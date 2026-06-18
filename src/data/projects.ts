import { Project } from '@/types';

export const mockProjects: Project[] = [
  {
    id: 'proj-001',
    name: '双眼皮手术',
    category: '眼部整形',
    duration: 90,
    price: 8800,
    description: '采用微创技术，打造自然双眼皮效果',
    requiresApproval: true
  },
  {
    id: 'proj-002',
    name: '假体隆鼻',
    category: '鼻部整形',
    duration: 120,
    price: 15800,
    description: '进口假体材料，塑造立体美鼻',
    requiresApproval: true
  },
  {
    id: 'proj-003',
    name: '玻尿酸填充',
    category: '注射美容',
    duration: 30,
    price: 3800,
    description: '进口玻尿酸，安全填充塑形',
    requiresApproval: false
  },
  {
    id: 'proj-004',
    name: '瘦脸针',
    category: '注射美容',
    duration: 20,
    price: 2800,
    description: '肉毒素注射，打造精致小V脸',
    requiresApproval: false
  },
  {
    id: 'proj-005',
    name: '自体脂肪隆胸',
    category: '胸部整形',
    duration: 180,
    price: 28800,
    description: '自体脂肪移植，自然丰胸',
    requiresApproval: true
  },
  {
    id: 'proj-006',
    name: '激光祛斑',
    category: '皮肤美容',
    duration: 45,
    price: 3500,
    description: '先进激光技术，有效祛除各类色斑',
    requiresApproval: false
  },
  {
    id: 'proj-007',
    name: '吸脂塑形',
    category: '体形雕塑',
    duration: 150,
    price: 18800,
    description: '水动力吸脂，精准塑身',
    requiresApproval: true
  },
  {
    id: 'proj-008',
    name: '热玛吉',
    category: '抗衰紧致',
    duration: 60,
    price: 12800,
    description: '射频紧肤，逆龄抗衰',
    requiresApproval: false
  },
  {
    id: 'proj-009',
    name: '下颌角整形',
    category: '面部轮廓',
    duration: 240,
    price: 38800,
    description: '颌面整形，打造完美脸型',
    requiresApproval: true
  },
  {
    id: 'proj-010',
    name: '水光针',
    category: '皮肤美容',
    duration: 40,
    price: 1980,
    description: '深层补水，改善肤质',
    requiresApproval: false
  }
];
