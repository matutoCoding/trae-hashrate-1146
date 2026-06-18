import { createContext, useContext } from 'react';
import { Appointment, OperatingRoom, Project, User, PreOpAssessment, ApprovalNodeType, UserRole } from '@/types';
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
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'approvalNodes' | 'currentApprovalIndex'>) => Appointment;
  cancelAppointment: (id: string, reason?: string) => boolean;
  approveAppointment: (id: string, comment?: string) => boolean;
  rejectAppointment: (id: string, comment: string) => boolean;
  resubmitAppointment: (id: string, comment?: string) => boolean;
  savePreOpAssessment: (id: string, assessment: PreOpAssessment, doctorSignature: string) => boolean;
  startExecution: (id: string) => boolean;
  completeAppointment: (id: string) => boolean;
  checkTimeConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getAppointmentById: (id: string) => Appointment | undefined;
  isMyApprovalTurn: (appointment: Appointment) => boolean;
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

export const isMyApprovalTurn = (appointment: Appointment): boolean => {
  if (appointment.status !== 'pending_approval') return false;
  const currentNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  if (!currentNode || currentNode.status !== 'pending') return false;
  return nodeTypeToRole[currentNode.type] === state.currentUser.role || state.currentUser.role === 'admin';
};

export const createAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt' | 'approvalNodes' | 'currentApprovalIndex'>): Appointment => {
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
    updatedAt: new Date().toISOString()
  };

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
    updatedAt: new Date().toISOString()
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
    updatedAt: new Date().toISOString()
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
    updatedAt: new Date().toISOString()
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
    updatedAt: new Date().toISOString()
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

export const startExecution = (id: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status !== 'approved' && appointment.status !== 'confirmed') {
    return false;
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    status: 'executing',
    updatedAt: new Date().toISOString()
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Appointment] 开始执行:', id);
  return true;
};

export const completeAppointment = (id: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status !== 'executing') {
    return false;
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    status: 'completed',
    updatedAt: new Date().toISOString()
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

export const AppContext = createContext<AppContextType | null>(null);

export const useAppStore = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within AppProvider');
  }
  return context;
};
