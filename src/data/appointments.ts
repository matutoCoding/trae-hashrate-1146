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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-18 10:30', comment: '客户需求明确，资料齐全' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '王医生', operatedAt: '2024-06-18 14:20', comment: '身体状况良好，适合手术' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-18 16:00', comment: '同意手术方案' }
    ],
    currentApprovalIndex: 3,
    notes: '客户对效果期望较高，术前请详细沟通',
    createdAt: '2024-06-17 09:00',
    updatedAt: '2024-06-18 16:00'
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
    createdAt: formatDate(today) + ' 08:30',
    updatedAt: formatDate(today) + ' 08:30'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-18 11:00', comment: '客户资料完整' },
      { type: 'doctor', name: '主诊医生审核', status: 'pending' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 1,
    notes: '手术方案需医生最终确认',
    createdAt: '2024-06-18 10:00',
    updatedAt: '2024-06-18 11:00'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '周咨询师', operatedAt: '2024-06-17 15:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '刘医生', operatedAt: '2024-06-17 16:30', comment: '适合激光治疗' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-17 17:30' }
    ],
    currentApprovalIndex: 3,
    createdAt: '2024-06-17 14:00',
    updatedAt: '2024-06-17 17:30'
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
    status: 'rejected',
    consultantName: '李咨询师',
    approvalNodes: [
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-16 10:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'rejected', operatorName: '王医生', operatedAt: '2024-06-17 09:30', comment: '客户体重超标，建议先减重再考虑手术' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 1,
    notes: '被医生驳回，需要补充减重计划',
    createdAt: '2024-06-16 09:00',
    updatedAt: '2024-06-17 09:30'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '陈咨询师', operatedAt: '2024-06-17 10:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '张医生', operatedAt: '2024-06-17 11:00' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-17 14:00' }
    ],
    currentApprovalIndex: 3,
    createdAt: '2024-06-16 16:00',
    updatedAt: formatDate(today) + ' 15:50'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '周咨询师', operatedAt: formatDate(today) + ' 10:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '刘医生', operatedAt: formatDate(today) + ' 11:30' },
      { type: 'director', name: '院长审核', status: 'pending' }
    ],
    currentApprovalIndex: 2,
    createdAt: formatDate(today) + ' 09:30',
    updatedAt: formatDate(today) + ' 11:30'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '李咨询师', operatedAt: '2024-06-15 14:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'approved', operatorName: '王医生', operatedAt: '2024-06-15 15:30' },
      { type: 'director', name: '院长审核', status: 'approved', operatorName: '赵院长', operatedAt: '2024-06-15 16:30' }
    ],
    currentApprovalIndex: 3,
    notes: '客户临时有事取消预约',
    createdAt: '2024-06-14 10:00',
    updatedAt: '2024-06-17 09:00'
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
      { type: 'consultant', name: '咨询师审核', status: 'approved', operatorName: '陈咨询师', operatedAt: formatDate(today) + ' 09:00' },
      { type: 'doctor', name: '主诊医生审核', status: 'pending' },
      { type: 'director', name: '院长审核', status: 'draft' }
    ],
    currentApprovalIndex: 1,
    createdAt: formatDate(today) + ' 08:30',
    updatedAt: formatDate(today) + ' 09:00'
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
    createdAt: formatDate(today) + ' 10:00',
    updatedAt: formatDate(today) + ' 10:00'
  }
];
