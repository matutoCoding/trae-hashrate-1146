import { OperatingRoom } from '@/types';

export const mockRooms: OperatingRoom[] = [
  {
    id: 'room-001',
    name: '一号手术室',
    type: '标准手术室',
    capacity: 2,
    equipment: ['手术床', '无影灯', '监护仪', '麻醉机'],
    status: 'active',
    description: '配备齐全的标准手术室，适用于各类常规医美手术'
  },
  {
    id: 'room-002',
    name: '二号手术室',
    type: '高级手术室',
    capacity: 3,
    equipment: ['手术床', '无影灯', '监护仪', '麻醉机', '吸脂设备', '内窥镜系统'],
    status: 'active',
    description: '高级配置手术室，可开展复杂整形手术'
  },
  {
    id: 'room-003',
    name: '注射室A',
    type: '注射室',
    capacity: 1,
    equipment: ['治疗床', '注射操作台', '消毒设备'],
    status: 'active',
    description: '专用于玻尿酸、肉毒素等注射类项目'
  },
  {
    id: 'room-004',
    name: '激光室',
    type: '激光治疗室',
    capacity: 1,
    equipment: ['激光治疗仪', '冷却系统', '护目镜'],
    status: 'active',
    description: '配备先进激光设备，用于皮肤美容治疗'
  },
  {
    id: 'room-005',
    name: '微整形室',
    type: '微整形室',
    capacity: 2,
    equipment: ['治疗床', '手术灯', '基础手术器械'],
    status: 'maintenance',
    description: '设备维护中，预计3天后恢复使用'
  },
  {
    id: 'room-006',
    name: '皮肤管理室',
    type: '皮肤护理室',
    capacity: 1,
    equipment: ['美容床', '冷热喷', '导入仪', '皮肤检测仪'],
    status: 'active',
    description: '专业皮肤护理与管理'
  }
];
