import { User } from '@/types';

export const mockCurrentUser: User = {
  id: 'user-001',
  name: '张院长',
  role: 'director',
  phone: '138****8888',
  department: '院办'
};

export const mockUsers: User[] = [
  {
    id: 'user-001',
    name: '张院长',
    role: 'director',
    phone: '138****8888',
    department: '院办'
  },
  {
    id: 'user-002',
    name: '李咨询师',
    role: 'consultant',
    phone: '139****6666',
    department: '咨询部'
  },
  {
    id: 'user-003',
    name: '陈咨询师',
    role: 'consultant',
    phone: '137****5555',
    department: '咨询部'
  },
  {
    id: 'user-004',
    name: '王医生',
    role: 'doctor',
    phone: '136****4444',
    department: '整形科'
  },
  {
    id: 'user-005',
    name: '张医生',
    role: 'doctor',
    phone: '135****3333',
    department: '整形科'
  },
  {
    id: 'user-006',
    name: '刘医生',
    role: 'doctor',
    phone: '134****2222',
    department: '皮肤科'
  }
];
