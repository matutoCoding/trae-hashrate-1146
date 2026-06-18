// 操作室
export interface OperatingRoom {
  id: string;
  name: string;
  type: string;
  capacity: number;
  equipment: string[];
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
}

// 医美项目
export interface Project {
  id: string;
  name: string;
  category: string;
  duration: number;
  price: number;
  description: string;
  requiresApproval: boolean;
}

// 审批节点类型
export type ApprovalNodeType = 'consultant' | 'doctor' | 'director';

// 审批状态
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'draft';

// 审批节点
export interface ApprovalNode {
  type: ApprovalNodeType;
  name: string;
  status: ApprovalStatus;
  operatorName?: string;
  operatorId?: string;
  comment?: string;
  operatedAt?: string;
  signature?: string;
}

// 预约状态
export type AppointmentStatus = 
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'confirmed'
  | 'executing'
  | 'completed'
  | 'cancelled';

// 预约
export interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  projectId: string;
  projectName: string;
  roomId: string;
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  consultantName: string;
  doctorName?: string;
  directorName?: string;
  approvalNodes: ApprovalNode[];
  currentApprovalIndex: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  preOpAssessment?: PreOpAssessment;
  executionInfo?: ExecutionInfo;
  operationLogs: OperationLog[];
}

// 术前评估
export interface PreOpAssessment {
  id: string;
  medicalHistory: string;
  allergyHistory: string;
  currentMedication: string;
  physicalExamination: string;
  riskAssessment: string;
  informedConsent: boolean;
  doctorSignature?: string;
  patientSignature?: string;
  assessmentDate?: string;
}

// 执行信息
export interface ExecutionInfo {
  startTime?: string;
  endTime?: string;
  executingDoctor?: string;
  executingDoctorId?: string;
  executionNotes?: string;
  completionNotes?: string;
}

// 操作类型
export type OperationType =
  | 'create'
  | 'approve'
  | 'reject'
  | 'resubmit'
  | 'start_execution'
  | 'complete'
  | 'cancel';

// 操作日志
export interface OperationLog {
  id: string;
  type: OperationType;
  operatorName: string;
  operatorId?: string;
  operatorRole?: string;
  operatedAt: string;
  comment?: string;
  details?: string;
}

// 用户角色
export type UserRole = 'customer' | 'consultant' | 'doctor' | 'director' | 'admin';

// 用户
export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  department?: string;
}

// 时段
export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  appointmentId?: string;
}

// 日历日期
export interface CalendarDay {
  date: string;
  dayOfWeek: number;
  isToday: boolean;
  isCurrentMonth: boolean;
  appointmentCount: number;
}

// 统计数据
export interface Statistics {
  todayAppointments: number;
  pendingApproval: number;
  completedToday: number;
  totalRooms: number;
  monthlyRevenue: number;
  customerSatisfaction: number;
}
