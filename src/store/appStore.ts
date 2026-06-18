import { createContext, useContext } from 'react';
import { Appointment, OperatingRoom, Project, User, PreOpAssessment, ApprovalNodeType, UserRole, OperationLog, ExecutionInfo, OperationType, FollowUpPlan, FollowUpRecord, FollowUpStatus, FollowUpResult, ProjectStats, DoctorStats, RoomStats, DashboardOverview, DateRange } from '@/types';
import { mockAppointments } from '@/data/appointments';
import { mockRooms } from '@/data/rooms';
import { mockProjects } from '@/data/projects';
import { mockCurrentUser } from '@/data/users';
import { checkTimeOverlap } from '@/utils';

interface AppState {
  appointments: Appointment[];
  rooms: OperatingRoom[];
  projects: Project[];
  currentUser: User;
}

interface AppContextType extends AppState {
  createAppointment: (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'approvalNodes' | 'currentApprovalIndex' | 'operationLogs'>) => Appointment;
  cancelAppointment: (id: string, reason?: string) => boolean;
  approveAppointment: (id: string, comment?: string) => boolean;
  rejectAppointment: (id: string, comment: string) => boolean;
  resubmitAppointment: (id: string, comment?: string) => boolean;
  savePreOpAssessment: (id: string, assessment: PreOpAssessment, doctorSignature: string) => boolean;
  startExecution: (id: string, executionNotes?: string) => boolean;
  completeAppointment: (id: string, completionNotes?: string) => boolean;
  checkTimeConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getAppointmentById: (id: string) => Appointment | undefined;
  isMyApprovalTurn: (appointment: Appointment) => boolean;
  switchRole: (role: UserRole, name?: string) => boolean;
  createFollowUpPlan: (appointmentId: string, plannedDate: string, plannedTime?: string) => boolean;
  completeFollowUp: (planId: string, appointmentId: string, result: FollowUpResult, feedback: string, notes?: string, nextFollowUpDate?: string) => boolean;
  getTodayFollowUpPlans: () => (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[];
  getMyFollowUpPlans: () => (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[];
  checkPreOpAssessmentComplete: (assessment: PreOpAssessment | undefined) => { ok: boolean; missing?: string };
  canApproveDoctorNode: (appointment: Appointment) => { ok: boolean; missing?: string };
  getProjectStats: (range?: DateRange) => ProjectStats[];
  getDoctorStats: (range?: DateRange) => DoctorStats[];
  getRoomStats: (range?: DateRange) => RoomStats[];
  getDashboardOverview: (range?: DateRange) => DashboardOverview;
}

const initialState: AppState = {
  appointments: mockAppointments,
  rooms: mockRooms,
  projects: mockProjects,
  currentUser: mockCurrentUser
};

let state = initialState;
const listeners: (() => void)[] = [];

const notify = () => {
  listeners.forEach(listener => listener());
};

export const getAppState = (): AppState => state;

export const subscribe = (listener: () => void) => {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  };
};

const nodeTypeToRole: Record<ApprovalNodeType, UserRole> = {
  consultant: 'consultant',
  doctor: 'doctor',
  director: 'director'
};

const roleToName: Record<UserRole, string> = {
  customer: '顾客',
  consultant: '李咨询师',
  doctor: '王医生',
  director: '张院长',
  admin: '系统管理员'
};

const addOperationLog = (
  appointment: Appointment,
  type: OperationType,
  comment?: string,
  details?: string
): OperationLog[] => {
  const log: OperationLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    operatorName: state.currentUser.name,
    operatorId: state.currentUser.id,
    operatorRole: state.currentUser.role,
    operatedAt: new Date().toISOString(),
    comment,
    details
  };
  return [...(appointment.operationLogs || []), log];
};

export const isMyApprovalTurn = (appointment: Appointment): boolean => {
  if (appointment.status !== 'pending_approval') return false;
  const currentNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  if (!currentNode || currentNode.status !== 'pending') return false;
  return nodeTypeToRole[currentNode.type] === state.currentUser.role || state.currentUser.role === 'admin';
};

export const switchRole = (role: UserRole, name?: string): boolean => {
  const validRoles: UserRole[] = ['consultant', 'doctor', 'director', 'admin'];
  if (!validRoles.includes(role)) return false;

  const newUser: User = {
    ...state.currentUser,
    role,
    name: name || roleToName[role] || state.currentUser.name
  };

  state = {
    ...state,
    currentUser: newUser
  };

  notify();
  console.log('[User] 切换角色:', role, '用户:', newUser.name);
  return true;
};

export const createAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'approvalNodes' | 'currentApprovalIndex' | 'operationLogs'>): Appointment => {
  const hasConflict = checkTimeConflict(
    appointmentData.roomId,
    appointmentData.date,
    appointmentData.startTime,
    appointmentData.endTime
  );

  if (hasConflict) {
    throw new Error('该时段已被预约，请选择其他时段');
  }

  const project = state.projects.find(p => p.id === appointmentData.projectId);
  const requiresApproval = project?.requiresApproval ?? true;

  const approvalNodes = [
    { type: 'consultant' as const, name: '咨询师审核', status: requiresApproval ? 'pending' as const : 'approved' as const },
    { type: 'doctor' as const, name: '主诊医生审核', status: 'draft' as const },
    { type: 'director' as const, name: '院长审核', status: 'draft' as const }
  ];

  const newAppointment: Appointment = {
    ...appointmentData,
    id: `apt-${Date.now()}`,
    approvalNodes,
    currentApprovalIndex: requiresApproval ? 0 : 1,
    status: requiresApproval ? 'pending_approval' : 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    operationLogs: []
  };

  newAppointment.operationLogs = addOperationLog(newAppointment, 'create', '创建预约');

  state = {
    ...state,
    appointments: [...state.appointments, newAppointment]
  };

  notify();
  console.log('[Appointment] 创建预约成功:', newAppointment.id);
  return newAppointment;
};

export const cancelAppointment = (id: string, reason?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status === 'cancelled' || appointment.status === 'completed') {
    return false;
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    status: 'cancelled',
    notes: reason ? `${appointment.notes || ''}\n取消原因：${reason}`.trim() : appointment.notes,
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(appointment, 'cancel', reason, '取消预约')
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Appointment] 取消预约成功，时段已释放:', id);
  return true;
};

export const approveAppointment = (id: string, comment?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  const { currentApprovalIndex, approvalNodes } = appointment;

  if (currentApprovalIndex >= approvalNodes.length) return false;

  const currentNode = approvalNodes[currentApprovalIndex];
  const userRole = state.currentUser.role;
  if (nodeTypeToRole[currentNode.type] !== userRole && userRole !== 'admin') {
    console.error('[Approval] 角色不匹配，无权审批:', userRole, '需要:', currentNode.type);
    return false;
  }

  const newApprovalNodes = approvalNodes.map(n => ({ ...n }));
  newApprovalNodes[currentApprovalIndex] = {
    ...newApprovalNodes[currentApprovalIndex],
    status: 'approved',
    operatorName: state.currentUser.name,
    operatorId: state.currentUser.id,
    operatedAt: new Date().toISOString(),
    comment: comment || '同意'
  };

  const nextIndex = currentApprovalIndex + 1;
  if (nextIndex < approvalNodes.length) {
    newApprovalNodes[nextIndex] = {
      ...newApprovalNodes[nextIndex],
      status: 'pending',
      operatorName: undefined,
      operatorId: undefined,
      operatedAt: undefined,
      comment: undefined
    };
  }

  const allApproved = newApprovalNodes.every(node => node.status === 'approved');

  const updatedAppointment: Appointment = {
    ...appointment,
    approvalNodes: newApprovalNodes,
    currentApprovalIndex: nextIndex,
    status: allApproved ? 'approved' : 'pending_approval',
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'approve',
      comment || '同意',
      `${currentNode.name} - 审批通过`
    )
  };

  if (currentApprovalIndex === 0) {
    updatedAppointment.consultantName = state.currentUser.name;
  } else if (currentApprovalIndex === 1) {
    updatedAppointment.doctorName = state.currentUser.name;
  } else if (currentApprovalIndex === 2) {
    updatedAppointment.directorName = state.currentUser.name;
  }

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Approval] 审批通过:', id, '节点:', currentApprovalIndex, '操作人:', state.currentUser.name);
  return true;
};

export const rejectAppointment = (id: string, comment: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  const { currentApprovalIndex, approvalNodes } = appointment;

  if (currentApprovalIndex >= approvalNodes.length) return false;

  const currentNode = approvalNodes[currentApprovalIndex];
  const userRole = state.currentUser.role;
  if (nodeTypeToRole[currentNode.type] !== userRole && userRole !== 'admin') {
    console.error('[Approval] 角色不匹配，无权驳回:', userRole, '需要:', currentNode.type);
    return false;
  }

  const newApprovalNodes = approvalNodes.map(n => ({ ...n }));

  newApprovalNodes[currentApprovalIndex] = {
    ...newApprovalNodes[currentApprovalIndex],
    status: 'rejected',
    operatorName: state.currentUser.name,
    operatorId: state.currentUser.id,
    operatedAt: new Date().toISOString(),
    comment
  };

  const backToIndex = Math.max(0, currentApprovalIndex - 1);

  newApprovalNodes[backToIndex] = {
    ...newApprovalNodes[backToIndex],
    status: 'pending',
    operatorName: undefined,
    operatorId: undefined,
    operatedAt: undefined,
    comment: undefined
  };

  for (let i = backToIndex + 1; i < newApprovalNodes.length; i++) {
    if (i !== currentApprovalIndex) {
      newApprovalNodes[i] = {
        ...newApprovalNodes[i],
        status: 'draft',
        operatorName: undefined,
        operatorId: undefined,
        operatedAt: undefined,
        comment: undefined
      };
    }
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    approvalNodes: newApprovalNodes,
    currentApprovalIndex: backToIndex,
    status: 'pending_approval',
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'reject',
      comment,
      `${currentNode.name} - 驳回，退回上一环节`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Approval] 审批驳回:', id, '节点:', currentApprovalIndex, '退回到:', backToIndex, '原因:', comment);
  return true;
};

export const resubmitAppointment = (id: string, comment?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  const { currentApprovalIndex, approvalNodes } = appointment;

  if (appointment.status !== 'pending_approval') return false;

  const currentNode = approvalNodes[currentApprovalIndex];
  if (!currentNode || currentNode.status !== 'pending') return false;

  const userRole = state.currentUser.role;
  if (nodeTypeToRole[currentNode.type] !== userRole && userRole !== 'admin') {
    console.error('[Approval] 角色不匹配，无权重新提交');
    return false;
  }

  const newApprovalNodes = approvalNodes.map(n => ({ ...n }));
  newApprovalNodes[currentApprovalIndex] = {
    ...newApprovalNodes[currentApprovalIndex],
    status: 'approved',
    operatorName: state.currentUser.name,
    operatorId: state.currentUser.id,
    operatedAt: new Date().toISOString(),
    comment: comment || '补充资料后重新提交'
  };

  const nextIndex = currentApprovalIndex + 1;
  if (nextIndex < approvalNodes.length) {
    newApprovalNodes[nextIndex] = {
      ...newApprovalNodes[nextIndex],
      status: 'pending',
      operatorName: undefined,
      operatorId: undefined,
      operatedAt: undefined,
      comment: undefined
    };
  }

  for (let i = nextIndex + 1; i < newApprovalNodes.length; i++) {
    newApprovalNodes[i] = {
      ...newApprovalNodes[i],
      status: 'draft',
      operatorName: undefined,
      operatorId: undefined,
      operatedAt: undefined,
      comment: undefined
    };
  }

  const allApproved = newApprovalNodes.every(node => node.status === 'approved');

  const updatedAppointment: Appointment = {
    ...appointment,
    approvalNodes: newApprovalNodes,
    currentApprovalIndex: nextIndex,
    status: allApproved ? 'approved' : 'pending_approval',
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'resubmit',
      comment || '补充资料后重新提交',
      `${currentNode.name} - 重新提交审批`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Approval] 重新提交审批:', id, '从节点:', currentApprovalIndex, '推进到:', nextIndex);
  return true;
};

export const savePreOpAssessment = (id: string, assessment: PreOpAssessment, doctorSignature: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];

  const updatedAppointment: Appointment = {
    ...appointment,
    preOpAssessment: {
      ...assessment,
      id: assessment.id || `assess-${Date.now()}`,
      doctorSignature,
      assessmentDate: new Date().toISOString()
    },
    updatedAt: new Date().toISOString()
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Assessment] 术前评估已保存:', id);
  return true;
};

export const startExecution = (id: string, executionNotes?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status !== 'approved' && appointment.status !== 'confirmed') {
    return false;
  }

  const executionInfo: ExecutionInfo = {
    ...appointment.executionInfo,
    startTime: new Date().toISOString(),
    executingDoctor: state.currentUser.name,
    executingDoctorId: state.currentUser.id,
    executionNotes
  };

  const updatedAppointment: Appointment = {
    ...appointment,
    status: 'executing',
    executionInfo,
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'start_execution',
      executionNotes,
      `开始执行 - 执行医生：${state.currentUser.name}`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Appointment] 开始执行:', id);
  return true;
};

export const completeAppointment = (id: string, completionNotes?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status !== 'executing') {
    return false;
  }

  const executionInfo: ExecutionInfo = {
    ...appointment.executionInfo,
    endTime: new Date().toISOString(),
    completionNotes
  };

  const updatedAppointment: Appointment = {
    ...appointment,
    status: 'completed',
    executionInfo,
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'complete',
      completionNotes,
      `执行完成 - 完成说明：${completionNotes || '无'}`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Appointment] 标记完成:', id);
  return true;
};

export const checkTimeConflict = (
  roomId: string,
  date: string,
  startTime: string,
  endTime: string,
  excludeId?: string
): boolean => {
  const roomAppointments = state.appointments.filter(
    apt => apt.roomId === roomId &&
      apt.date === date &&
      apt.status !== 'cancelled' &&
      apt.id !== excludeId
  );

  return roomAppointments.some(apt =>
    checkTimeOverlap(startTime, endTime, apt.startTime, apt.endTime)
  );
};

export const getAppointmentById = (id: string): Appointment | undefined => {
  return state.appointments.find(apt => apt.id === id);
};

export const checkPreOpAssessmentComplete = (assessment: PreOpAssessment | undefined): { ok: boolean; missing?: string } => {
  if (!assessment) return { ok: false, missing: '尚未填写术前评估' };
  if (!assessment.medicalHistory || assessment.medicalHistory.trim().length === 0) return { ok: false, missing: '请填写既往病史' };
  if (!assessment.allergyHistory || assessment.allergyHistory.trim().length === 0) return { ok: false, missing: '请填写过敏史' };
  if (!assessment.currentMedication || assessment.currentMedication.trim().length === 0) return { ok: false, missing: '请填写当前用药情况' };
  if (!assessment.physicalExamination || assessment.physicalExamination.trim().length === 0) return { ok: false, missing: '请填写体格检查' };
  if (!assessment.riskAssessment || assessment.riskAssessment.trim().length === 0) return { ok: false, missing: '请填写风险评估' };
  if (!assessment.informedConsent) return { ok: false, missing: '请勾选知情同意' };
  if (!assessment.doctorSignature || assessment.doctorSignature.trim().length === 0) return { ok: false, missing: '请医生签字' };
  return { ok: true };
};

export const canApproveDoctorNode = (appointment: Appointment): { ok: boolean; missing?: string } => {
  if (appointment.status !== 'pending_approval') return { ok: false };
  const currentNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  if (!currentNode || currentNode.type !== 'doctor') return { ok: true };
  return checkPreOpAssessmentComplete(appointment.preOpAssessment);
};

export const createFollowUpPlan = (appointmentId: string, plannedDate: string, plannedTime?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === appointmentId);
  if (index === -1) return false;

  const appointment = state.appointments[index];

  const plan: FollowUpPlan = {
    id: `fup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    appointmentId,
    plannedDate,
    plannedTime,
    status: 'pending',
    assignedTo: state.currentUser.name,
    assignedToId: state.currentUser.id,
    createdAt: new Date().toISOString()
  };

  const existingPlans = appointment.followUpPlans || [];
  const newPlans = [...existingPlans, plan];

  const updatedAppointment: Appointment = {
    ...appointment,
    followUpPlans: newPlans,
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'create_followup',
      `回访日期：${plannedDate}${plannedTime ? ' ' + plannedTime : ''}`,
      `创建回访计划`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[FollowUp] 创建回访计划:', plan.id, '预约:', appointmentId);
  return true;
};

export const completeFollowUp = (
  planId: string,
  appointmentId: string,
  result: FollowUpResult,
  feedback: string,
  notes?: string,
  nextFollowUpDate?: string
): boolean => {
  const aptIndex = state.appointments.findIndex(apt => apt.id === appointmentId);
  if (aptIndex === -1) return false;

  const appointment = state.appointments[aptIndex];
  const existingPlans = appointment.followUpPlans || [];
  const planIdx = existingPlans.findIndex(p => p.id === planId);
  if (planIdx === -1) return false;

  const newPlans = existingPlans.map((p, i) =>
    i === planIdx ? { ...p, status: 'done' as FollowUpStatus } : p
  );

  const record: FollowUpRecord = {
    id: `fur-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    planId,
    appointmentId,
    result,
    customerFeedback: feedback,
    handledBy: state.currentUser.name,
    handledById: state.currentUser.id,
    handledAt: new Date().toISOString(),
    nextFollowUpDate,
    notes
  };

  if (nextFollowUpDate) {
    const nextPlan: FollowUpPlan = {
      id: `fup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      appointmentId,
      plannedDate: nextFollowUpDate,
      status: 'pending',
      assignedTo: state.currentUser.name,
      assignedToId: state.currentUser.id,
      createdAt: new Date().toISOString()
    };
    newPlans.push(nextPlan);
  }

  const existingRecords = appointment.followUpRecords || [];
  const newRecords = [...existingRecords, record];

  const resultText: Record<FollowUpResult, string> = {
    satisfied: '满意',
    normal: '一般',
    complain: '投诉',
    serious: '严重'
  };

  const updatedAppointment: Appointment = {
    ...appointment,
    followUpPlans: newPlans,
    followUpRecords: newRecords,
    updatedAt: new Date().toISOString(),
    operationLogs: addOperationLog(
      appointment,
      'complete_followup',
      `结果：${resultText[result]}，反馈：${feedback || '无'}`,
      `完成回访处理`
    )
  };

  const newAppointments = [...state.appointments];
  newAppointments[aptIndex] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[FollowUp] 完成回访:', record.id, '计划:', planId);
  return true;
};

const getTodayStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const getTodayFollowUpPlans = (): (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[] => {
  const today = getTodayStr();
  const results: (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[] = [];

  state.appointments.forEach(apt => {
    const plans = apt.followUpPlans || [];
    const records = apt.followUpRecords || [];
    plans.forEach(plan => {
      if (plan.plannedDate === today) {
        const record = records.find(r => r.planId === plan.id);
        results.push({ ...plan, appointment: apt, record });
      }
    });
  });

  return results.sort((a, b) => a.status === 'pending' ? -1 : 1);
};

export const getMyFollowUpPlans = (): (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[] => {
  const results: (FollowUpPlan & { appointment?: Appointment; record?: FollowUpRecord })[] = [];

  state.appointments.forEach(apt => {
    const plans = apt.followUpPlans || [];
    const records = apt.followUpRecords || [];
    plans.forEach(plan => {
      if (plan.assignedToId === state.currentUser.id || plan.assignedTo === state.currentUser.name) {
        const record = records.find(r => r.planId === plan.id);
        results.push({ ...plan, appointment: apt, record });
      }
    });
  });

  return results.sort((a, b) => a.status === 'pending' ? -1 : 1);
};

const isInDateRange = (dateStr: string, range?: DateRange): boolean => {
  if (!range) return true;
  const d = new Date(dateStr).getTime();
  const start = new Date(range.startDate).getTime();
  const end = new Date(range.endDate).getTime() + 86400000;
  return d >= start && d < end;
};

export const getDashboardOverview = (range?: DateRange): DashboardOverview => {
  const filtered = state.appointments.filter(apt => isInDateRange(apt.createdAt, range));

  const totalCount = filtered.length;
  const completedCount = filtered.filter(a => a.status === 'completed').length;
  const cancelledCount = filtered.filter(a => a.status === 'cancelled').length;
  const pendingCount = filtered.filter(a =>
    a.status === 'pending_approval' || a.status === 'approved' || a.status === 'executing' || a.status === 'confirmed'
  ).length;

  let totalRevenue = 0;
  filtered.forEach(apt => {
    if (apt.status === 'completed' || apt.status === 'executing' || apt.status === 'approved') {
      const project = state.projects.find(p => p.id === apt.projectId);
      if (project) totalRevenue += project.price;
    }
  });

  const completedWithRevenue = filtered.filter(a =>
    a.status === 'completed' || a.status === 'executing' || a.status === 'approved'
  ).length;

  return {
    totalAppointments: totalCount,
    completedCount,
    cancelledCount,
    pendingCount,
    totalRevenue,
    avgRevenue: completedWithRevenue > 0 ? Math.round(totalRevenue / completedWithRevenue) : 0,
    completionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    cancelRate: totalCount > 0 ? Math.round((cancelledCount / totalCount) * 100) : 0
  };
};

export const getProjectStats = (range?: DateRange): ProjectStats[] => {
  const projectMap = new Map<string, ProjectStats>();

  state.projects.forEach(p => {
    projectMap.set(p.id, {
      projectId: p.id,
      projectName: p.name,
      totalCount: 0,
      completedCount: 0,
      cancelledCount: 0,
      revenue: 0
    });
  });

  state.appointments
    .filter(apt => isInDateRange(apt.createdAt, range))
    .forEach(apt => {
      const stat = projectMap.get(apt.projectId);
      if (!stat) return;
      stat.totalCount++;
      if (apt.status === 'completed') stat.completedCount++;
      if (apt.status === 'cancelled') stat.cancelledCount++;
      if (apt.status === 'completed' || apt.status === 'executing' || apt.status === 'approved') {
        const project = state.projects.find(p => p.id === apt.projectId);
        if (project) stat.revenue += project.price;
      }
    });

  return Array.from(projectMap.values())
    .filter(s => s.totalCount > 0)
    .sort((a, b) => b.revenue - a.revenue);
};

export const getDoctorStats = (range?: DateRange): DoctorStats[] => {
  const doctorMap = new Map<string, DoctorStats>();

  state.appointments
    .filter(apt => isInDateRange(apt.createdAt, range))
    .forEach(apt => {
      const doctorName = apt.doctorName || apt.executionInfo?.executingDoctor || '未指派';
      if (!doctorMap.has(doctorName)) {
        doctorMap.set(doctorName, {
          doctorName,
          totalCount: 0,
          completedCount: 0,
          cancelledCount: 0,
          revenue: 0
        });
      }
      const stat = doctorMap.get(doctorName)!;
      stat.totalCount++;
      if (apt.status === 'completed') stat.completedCount++;
      if (apt.status === 'cancelled') stat.cancelledCount++;
      if (apt.status === 'completed' || apt.status === 'executing' || apt.status === 'approved') {
        const project = state.projects.find(p => p.id === apt.projectId);
        if (project) stat.revenue += project.price;
      }
    });

  return Array.from(doctorMap.values())
    .filter(s => s.totalCount > 0)
    .sort((a, b) => b.revenue - a.revenue);
};

export const getRoomStats = (range?: DateRange): RoomStats[] => {
  const roomMap = new Map<string, { total: number; completed: number; hours: number }>();

  state.rooms.forEach(r => {
    roomMap.set(r.id, { total: 0, completed: 0, hours: 0 });
  });

  const timeToMinutes = (t: string): number => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  state.appointments
    .filter(apt => isInDateRange(apt.createdAt, range))
    .forEach(apt => {
      const stat = roomMap.get(apt.roomId);
      if (!stat) return;
      stat.total++;
      if (apt.status === 'completed') stat.completed++;
      const duration = timeToMinutes(apt.endTime) - timeToMinutes(apt.startTime);
      stat.hours += Math.max(duration, 0);
    });

  const totalDays = range ? (new Date(range.endDate).getTime() - new Date(range.startDate).getTime()) / 86400000 + 1 : 30;
  const roomMinutesPerDay = 9 * 60;
  const totalRoomMinutes = totalDays * roomMinutesPerDay;

  return state.rooms
    .filter(r => r.status === 'active')
    .map(r => {
      const s = roomMap.get(r.id) || { total: 0, completed: 0, hours: 0 };
      return {
        roomId: r.id,
        roomName: r.name,
        totalCount: s.total,
        completedCount: s.completed,
        utilizationRate: totalRoomMinutes > 0 ? Math.round((s.hours / totalRoomMinutes) * 100) : 0
      };
    })
    .sort((a, b) => b.utilizationRate - a.utilizationRate);
};

export const AppContext = createContext<AppContextType | null>(null);

export const useAppStore = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
};
