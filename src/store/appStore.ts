import { createContext, useContext } from 'react';
import { Appointment, OperatingRoom, Project, User } from '@/types';
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
  checkTimeConflict: (roomId: string, date: string, startTime: string, endTime: string, excludeId?: string) => boolean;
  getAppointmentById: (id: string) => Appointment | undefined;
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
  console.log('[Appointment] 取消预约成功:', id);
  return true;
};

export const approveAppointment = (id: string, comment?: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  const { currentApprovalIndex, approvalNodes } = appointment;

  if (currentApprovalIndex >= approvalNodes.length) return false;

  const newApprovalNodes = [...approvalNodes];
  const currentNode = { ...newApprovalNodes[currentApprovalIndex] };
  currentNode.status = 'approved';
  currentNode.operatorName = state.currentUser.name;
  currentNode.operatorId = state.currentUser.id;
  currentNode.operatedAt = new Date().toISOString();
  currentNode.comment = comment;
  newApprovalNodes[currentApprovalIndex] = currentNode;

  const nextIndex = currentApprovalIndex + 1;
  if (nextIndex < approvalNodes.length) {
    const nextNode = { ...newApprovalNodes[nextIndex] };
    nextNode.status = 'pending';
    newApprovalNodes[nextIndex] = nextNode;
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
  console.log('[Approval] 审批通过:', id, '节点:', currentApprovalIndex);
  return true;
};

export const rejectAppointment = (id: string, comment: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  const { currentApprovalIndex, approvalNodes } = appointment;

  if (currentApprovalIndex >= approvalNodes.length) return false;

  const newApprovalNodes = [...approvalNodes];
  const currentNode = { ...newApprovalNodes[currentApprovalIndex] };
  currentNode.status = 'rejected';
  currentNode.operatorName = state.currentUser.name;
  currentNode.operatorId = state.currentUser.id;
  currentNode.operatedAt = new Date().toISOString();
  currentNode.comment = comment;
  newApprovalNodes[currentApprovalIndex] = currentNode;

  for (let i = currentApprovalIndex + 1; i < newApprovalNodes.length; i++) {
    newApprovalNodes[i] = { ...newApprovalNodes[i], status: 'draft' };
  }

  const updatedAppointment: Appointment = {
    ...appointment,
    approvalNodes: newApprovalNodes,
    status: 'rejected',
    updatedAt: new Date().toISOString()
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Approval] 审批驳回:', id, '节点:', currentApprovalIndex, '原因:', comment);
  return true;
};

export const resubmitAppointment = (id: string): boolean => {
  const index = state.appointments.findIndex(apt => apt.id === id);
  if (index === -1) return false;

  const appointment = state.appointments[index];
  if (appointment.status !== 'rejected') return false;

  const newApprovalNodes = appointment.approvalNodes.map((node, idx) => {
    if (idx === 0) {
      return { ...node, status: 'pending' as const };
    }
    return { ...node, status: 'draft' as const };
  });

  const updatedAppointment: Appointment = {
    ...appointment,
    approvalNodes: newApprovalNodes,
    currentApprovalIndex: 0,
    status: 'pending_approval',
    updatedAt: new Date().toISOString()
  };

  const newAppointments = [...state.appointments];
  newAppointments[index] = updatedAppointment;

  state = { ...state, appointments: newAppointments };
  notify();
  console.log('[Approval] 重新提交审批:', id);
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
      apt.status !== 'rejected' &&
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
