import { Appointment } from '@/types';

const today = new Date();
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const mockAppointments: Appointment[] = [
  {
    id: 'apt-001',
    customerName: '张美丽',
    customerPhone: '138****8888',
    projectId: 'proj-001',
    projectName: '双眼皮手术',
    roomId: 'room-001',
    roomName: '一号手术室',
    date: formatDate(today),
    startTime: '09:00',
    endTime: '10:30',
    status: 'confirmed',
    consultantName: '李咨询师',
    doctorName: '王医生',
    directorName: '赵院长',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-18T10:30:00.000Z', comment: '客户需求明确，资料齐全' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '王医生', operatedAt: '2024-06-18T14:20:00.000Z', comment: '身体状况良好，适合手术' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-18T16:00:00.000Z', comment: '同意手术方案' }
    ],
    currentApprovalIndex: 3,
    notes: '客户对效果期望较高，术前请详细沟通',
    createdAt: '2024-06-17T09:00:00.000Z',
    updatedAt: '2024-06-18T16:00:00.000Z',
    operationLogs: [
      { id: 'log-001-1', type: 'create', operatorName: '李咨询师', operatedAt: '2024-06-17T09:00:00.000Z', comment: '创建预约' },
      { id: 'log-001-2', type: 'approve', operatorName: '李咨询师', operatorRole: 'consultant', operatedAt: '2024-06-18T10:30:00.000Z', comment: '客户需求明确，资料齐全', details: '咨询师审核 - 审批通过' },
      { id: 'log-001-3', type: 'approve', operatorName: '王医生', operatorRole: 'doctor', operatedAt: '2024-06-18T14:20:00.000Z', comment: '身体状况良好，适合手术', details: '主诊医生审核 - 审批通过' },
      { id: 'log-001-4', type: 'approve', operatorName: '赵院长', operatorRole: 'director', operatedAt: '2024-06-18T16:00:00.000Z', comment: '同意手术方案', details: '院长审核 - 审批通过' }
    ]
  },
  {
    id: 'apt-002',
    customerName: '刘小姐',
    customerPhone: '139****6666',
    projectId: 'proj-003',
    projectName: '玻尿酸填充',
    roomId: 'room-003',
    roomName: '注射室A',
    date: formatDate(today),
    startTime: '10:00',
    endTime: '10:30',
    status: 'pending_approval',
    consultantName: '陈咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'pending' },
      { type: 'doctor', name: '主诊医生审核', status: 'draft' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 0,
    notes: '首次到店，需要详细介绍',
    createdAt: formatDate(today) + 'T08:30:00.000Z',
    updatedAt: formatDate(today) + 'T08:30:00.000Z',
    operationLogs: [
      { id: 'log-002-1', type: 'create', operatorName: '陈咨询师', operatedAt: formatDate(today) + 'T08:30:00.000Z', comment: '创建预约' }
    ]
  },
  {
    id: 'apt-003',
    customerName: '王女士',
    customerPhone: '137****5555',
    projectId: 'proj-005',
    projectName: '自体脂肪隆胸',
    roomId: 'room-002',
    roomName: '二号手术室',
    date: formatDate(addDays(today, 1)),
    startTime: '09:00',
    endTime: '12:00',
    status: 'pending_approval',
    consultantName: '李咨询师',
    doctorName: '张医生',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-18T11:00:00.000Z', comment: '客户资料完整' },
      { type: 'doctor', name: '主诊医生审核', status: 'pending' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 1,
    notes: '手术方案需医生最终确认',
    createdAt: '2024-06-18T10:00:00.000Z',
    updatedAt: '2024-06-18T11:00:00.000Z',
    operationLogs: [
      { id: 'log-003-1', type: 'create', operatorName: '李咨询师', operatedAt: '2024-06-18T10:00:00.000Z', comment: '创建预约' },
      { id: 'log-003-2', type: 'approve', operatorName: '李咨询师', operatorRole: 'consultant', operatedAt: '2024-06-18T11:00:00.000Z', comment: '客户资料完整', details: '咨询师审核 - 审批通过' }
    ]
  },
  {
    id: 'apt-004',
    customerName: '陈小姐',
    customerPhone: '136****4444',
    projectId: 'proj-006',
    projectName: '激光祛斑',
    roomId: 'room-004',
    roomName: '激光室',
    date: formatDate(today),
    startTime: '14:00',
    endTime: '14:45',
    status: 'approved',
    consultantName: '周咨询师',
    doctorName: '刘医生',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '周咨询师', operatedAt: '2024-06-17T15:00:00.000Z' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '刘医生', operatedAt: '2024-06-17T16:30:00.000Z', comment: '适合激光治疗' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-17T17:30:00.000Z' }
    ],
    currentApprovalIndex: 3,
    createdAt: '2024-06-17T14:00:00.000Z',
    updatedAt: '2024-06-17T17:30:00.000Z',
    operationLogs: [
      { id: 'log-004-1', type: 'create', operatorName: '周咨询师', operatedAt: '2024-06-17T14:00:00.000Z', comment: '创建预约' },
      { id: 'log-004-2', type: 'approve', operatorName: '周咨询师', operatorRole: 'consultant', operatedAt: '2024-06-17T15:00:00.000Z', details: '咨询师审核 - 审批通过' },
      { id: 'log-004-3', type: 'approve', operatorName: '刘医生', operatorRole: 'doctor', operatedAt: '2024-06-17T16:30:00.000Z', comment: '适合激光治疗', details: '主诊医生审核 - 审批通过' },
      { id: 'log-004-4', type: 'approve', operatorName: '赵院长', operatorRole: 'director', operatedAt: '2024-06-17T17:30:00.000Z', details: '院长审核 - 审批通过' }
    ]
  },
  {
    id: 'apt-005',
    customerName: '赵女士',
    customerPhone: '135****3333',
    projectId: 'proj-007',
    projectName: '吸脂塑形',
    roomId: 'room-002',
    roomName: '二号手术室',
    date: formatDate(addDays(today, 2)),
    startTime: '10:00',
    endTime: '12:30',
    status: 'pending_approval',
    consultantName: '李咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'pending' },
      { type: 'doctor', name: '主诊医生审核', status: 'rejected', operatorName: '王医生', operatedAt: '2024-06-17T09:30:00.000Z', comment: '客户体重超标，建议先减重再考虑手术' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 0,
    notes: '被医生驳回，需要补充减重计划',
    createdAt: '2024-06-16T09:00:00.000Z',
    updatedAt: '2024-06-17T09:30:00.000Z',
    operationLogs: [
      { id: 'log-005-1', type: 'create', operatorName: '李咨询师', operatedAt: '2024-06-16T09:00:00.000Z', comment: '创建预约' },
      { id: 'log-005-2', type: 'approve', operatorName: '李咨询师', operatorRole: 'consultant', operatedAt: '2024-06-16T10:00:00.000Z', details: '咨询师审核 - 审批通过' },
      { id: 'log-005-3', type: 'reject', operatorName: '王医生', operatorRole: 'doctor', operatedAt: '2024-06-17T09:30:00.000Z', comment: '客户体重超标，建议先减重再考虑手术', details: '主诊医生审核 - 驳回，退回上一环节' }
    ]
  },
  {
    id: 'apt-006',
    customerName: '孙小姐',
    customerPhone: '134****2222',
    projectId: 'proj-004',
    projectName: '瘦脸针',
    roomId: 'room-003',
    roomName: '注射室A',
    date: formatDate(today),
    startTime: '15:30',
    endTime: '15:50',
    status: 'completed',
    consultantName: '陈咨询师',
    doctorName: '张医生',
    directorName: '赵院长',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '陈咨询师', operatedAt: '2024-06-17T10:00:00.000Z' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '张医生', operatedAt: '2024-06-17T11:00:00.000Z' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-17T14:00:00.000Z' }
    ],
    currentApprovalIndex: 3,
    createdAt: '2024-06-16T16:00:00.000Z',
    updatedAt: formatDate(today) + 'T15:50:00.000Z',
    executionInfo: {
      startTime: formatDate(today) + 'T15:30:00.000Z',
      endTime: formatDate(today) + 'T15:50:00.000Z',
      executingDoctor: '张医生',
      executingDoctorId: 'user-003',
      executionNotes: '客户状态良好，正常注射',
      completionNotes: '注射完成，无不良反应'
    },
    operationLogs: [
      { id: 'log-006-1', type: 'create', operatorName: '陈咨询师', operatedAt: '2024-06-16T16:00:00.000Z', comment: '创建预约' },
      { id: 'log-006-2', type: 'approve', operatorName: '陈咨询师', operatorRole: 'consultant', operatedAt: '2024-06-17T10:00:00.000Z', details: '咨询师审核 - 审批通过' },
      { id: 'log-006-3', type: 'approve', operatorName: '张医生', operatorRole: 'doctor', operatedAt: '2024-06-17T11:00:00.000Z', details: '主诊医生审核 - 审批通过' },
      { id: 'log-006-4', type: 'approve', operatorName: '赵院长', operatorRole: 'director', operatedAt: '2024-06-17T14:00:00.000Z', details: '院长审核 - 审批通过' },
      { id: 'log-006-5', type: 'start_execution', operatorName: '张医生', operatorRole: 'doctor', operatedAt: formatDate(today) + 'T15:30:00.000Z', comment: '客户状态良好，正常注射', details: '开始执行 - 执行医生：张医生' },
      { id: 'log-006-6', type: 'complete', operatorName: '张医生', operatorRole: 'doctor', operatedAt: formatDate(today) + 'T15:50:00.000Z', comment: '注射完成，无不良反应', details: '执行完成 - 完成说明：注射完成，无不良反应' },
      { id: 'log-006-7', type: 'create_followup', operatorName: '陈咨询师', operatorRole: 'consultant', operatedAt: formatDate(today) + 'T16:00:00.000Z', comment: `回访日期：${formatDate(today)} 10:00`, details: '创建回访计划' },
      { id: 'log-006-8', type: 'complete_followup', operatorName: '陈咨询师', operatorRole: 'consultant', operatedAt: formatDate(today) + 'T10:30:00.000Z', comment: '结果：满意，反馈：效果很好，无不良反应', details: '完成回访处理' }
    ],
    followUpPlans: [
      {
        id: 'fup-006-1',
        appointmentId: 'apt-006',
        plannedDate: formatDate(today),
        plannedTime: '10:00',
        status: 'done',
        assignedTo: '陈咨询师',
        assignedToId: 'user-002',
        createdAt: formatDate(today) + 'T16:00:00.000Z'
      },
      {
        id: 'fup-006-2',
        appointmentId: 'apt-006',
        plannedDate: formatDate(addDays(today, 7)),
        plannedTime: '10:00',
        status: 'pending',
        assignedTo: '陈咨询师',
        assignedToId: 'user-002',
        createdAt: formatDate(today) + 'T10:30:00.000Z'
      }
    ],
    followUpRecords: [
      {
        id: 'fur-006-1',
        planId: 'fup-006-1',
        appointmentId: 'apt-006',
        result: 'satisfied',
        customerFeedback: '效果很好，无不良反应，满意',
        handledBy: '陈咨询师',
        handledById: 'user-002',
        handledAt: formatDate(today) + 'T10:30:00.000Z',
        nextFollowUpDate: formatDate(addDays(today, 7)),
        notes: '建议7天后再回访一次'
      }
    ]
  },
  {
    id: 'apt-007',
    customerName: '周女士',
    customerPhone: '133****1111',
    projectId: 'proj-008',
    projectName: '热玛吉',
    roomId: 'room-004',
    roomName: '激光室',
    date: formatDate(addDays(today, 1)),
    startTime: '14:00',
    endTime: '15:00',
    status: 'pending_approval',
    consultantName: '周咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '周咨询师', operatedAt: formatDate(today) + 'T10:00:00.000Z' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '刘医生', operatedAt: formatDate(today) + 'T11:30:00.000Z' },
      { type: 'director', name: '院长审核', status: 'pending' }
    ],
    currentApprovalIndex: 2,
    createdAt: formatDate(today) + 'T09:30:00.000Z',
    updatedAt: formatDate(today) + 'T11:30:00.000Z',
    operationLogs: [
      { id: 'log-007-1', type: 'create', operatorName: '周咨询师', operatedAt: formatDate(today) + 'T09:30:00.000Z', comment: '创建预约' },
      { id: 'log-007-2', type: 'approve', operatorName: '周咨询师', operatorRole: 'consultant', operatedAt: formatDate(today) + 'T10:00:00.000Z', details: '咨询师审核 - 审批通过' },
      { id: 'log-007-3', type: 'approve', operatorName: '刘医生', operatorRole: 'doctor', operatedAt: formatDate(today) + 'T11:30:00.000Z', details: '主诊医生审核 - 审批通过' }
    ]
  },
  {
    id: 'apt-008',
    customerName: '吴小姐',
    customerPhone: '132****9999',
    projectId: 'proj-010',
    projectName: '水光针',
    roomId: 'room-006',
    roomName: '皮肤管理室',
    date: formatDate(addDays(today, 3)),
    startTime: '10:00',
    endTime: '10:40',
    status: 'cancelled',
    consultantName: '李咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-15T14:00:00.000Z' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '王医生', operatedAt: '2024-06-15T15:30:00.000Z' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-15T16:30:00.000Z' }
    ],
    currentApprovalIndex: 3,
    notes: '客户临时有事取消预约',
    createdAt: '2024-06-14T10:00:00.000Z',
    updatedAt: '2024-06-17T09:00:00.000Z',
    operationLogs: [
      { id: 'log-008-1', type: 'create', operatorName: '李咨询师', operatedAt: '2024-06-14T10:00:00.000Z', comment: '创建预约' },
      { id: 'log-008-2', type: 'approve', operatorName: '李咨询师', operatorRole: 'consultant', operatedAt: '2024-06-15T14:00:00.000Z', details: '咨询师审核 - 审批通过' },
      { id: 'log-008-3', type: 'approve', operatorName: '王医生', operatorRole: 'doctor', operatedAt: '2024-06-15T15:30:00.000Z', details: '主诊医生审核 - 审批通过' },
      { id: 'log-008-4', type: 'approve', operatorName: '赵院长', operatorRole: 'director', operatedAt: '2024-06-15T16:30:00.000Z', details: '院长审核 - 审批通过' },
      { id: 'log-008-5', type: 'cancel', operatorName: '李咨询师', operatedAt: '2024-06-17T09:00:00.000Z', comment: '客户临时有事取消预约', details: '取消预约' }
    ]
  },
  {
    id: 'apt-009',
    customerName: '郑女士',
    customerPhone: '131****8888',
    projectId: 'proj-002',
    projectName: '假体隆鼻',
    roomId: 'room-001',
    roomName: '一号手术室',
    date: formatDate(addDays(today, 2)),
    startTime: '14:00',
    endTime: '16:00',
    status: 'pending_approval',
    consultantName: '陈咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '陈咨询师', operatedAt: formatDate(today) + 'T09:00:00.000Z' },
      { type: 'doctor', name: '主诊医生审核', status: 'pending' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 1,
    createdAt: formatDate(today) + 'T08:30:00.000Z',
    updatedAt: formatDate(today) + 'T09:00:00.000Z',
    operationLogs: [
      { id: 'log-009-1', type: 'create', operatorName: '陈咨询师', operatedAt: formatDate(today) + 'T08:30:00.000Z', comment: '创建预约' },
      { id: 'log-009-2', type: 'approve', operatorName: '陈咨询师', operatorRole: 'consultant', operatedAt: formatDate(today) + 'T09:00:00.000Z', details: '咨询师审核 - 审批通过' }
    ]
  },
  {
    id: 'apt-010',
    customerName: '黄小姐',
    customerPhone: '130****7777',
    projectId: 'proj-009',
    projectName: '下颌角整形',
    roomId: 'room-002',
    roomName: '二号手术室',
    date: formatDate(addDays(today, 5)),
    startTime: '09:00',
    endTime: '13:00',
    status: 'pending_approval',
    consultantName: '李咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'pending' },
      { type: 'doctor', name: '主诊医生审核', status: 'draft' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 0,
    notes: '颌面手术，需要详细术前评估',
    createdAt: formatDate(today) + 'T10:00:00.000Z',
    updatedAt: formatDate(today) + 'T10:00:00.000Z',
    operationLogs: [
      { id: 'log-010-1', type: 'create', operatorName: '李咨询师', operatedAt: formatDate(today) + 'T10:00:00.000Z', comment: '创建预约' }
    ]
  }
];
