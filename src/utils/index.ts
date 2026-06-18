import { TimeSlot, Appointment } from '@/types';

export const checkTimeOverlap = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean => {
  const toMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const s1 = toMinutes(start1);
  const e1 = toMinutes(end1);
  const s2 = toMinutes(start2);
  const e2 = toMinutes(end2);

  return s1 < e2 && s2 < e1;
};

export const generateTimeSlots = (
  startTime: string = '09:00',
  endTime: string = '18:00',
  slotDuration: number = 30
): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentMin = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  while (currentMin + slotDuration <= endMinutes) {
    const startH = Math.floor(currentMin / 60);
    const startM = currentMin % 60;
    const endMins = currentMin + slotDuration;
    const endH = Math.floor(endMins / 60);
    const endM = endMins % 60;

    slots.push({
      startTime: `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`,
      endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
      available: true
    });

    currentMin += slotDuration;
  }

  return slots;
};

export const getAvailableTimeSlots = (
  date: string,
  roomId: string,
  appointments: Appointment[],
  projectDuration: number = 30
): TimeSlot[] => {
  const slots = generateTimeSlots('09:00', '18:00', projectDuration);
  
  const roomAppointments = appointments.filter(
    apt => apt.date === date && apt.roomId === roomId && apt.status !== 'cancelled' && apt.status !== 'rejected'
  );

  return slots.map(slot => {
    const hasConflict = roomAppointments.some(apt =>
      checkTimeOverlap(slot.startTime, slot.endTime, apt.startTime, apt.endTime)
    );
    
    const appointment = roomAppointments.find(apt =>
      checkTimeOverlap(slot.startTime, slot.endTime, apt.startTime, apt.endTime)
    );

    return {
      ...slot,
      available: !hasConflict,
      appointmentId: appointment?.id
    };
  });
};

export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending_approval: '待审批',
    approved: '已通过',
    rejected: '已驳回',
    confirmed: '已确认',
    executing: '执行中',
    completed: '已完成',
    cancelled: '已取消'
  };
  return statusMap[status] || status;
};

export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    pending_approval: '#faad14',
    approved: '#52c41a',
    rejected: '#ff4d4f',
    confirmed: '#1890ff',
    executing: '#722ed1',
    completed: '#52c41a',
    cancelled: '#86909c'
  };
  return colorMap[status] || '#86909c';
};

export const generateCalendarDays = (year: number, month: number, appointments: Appointment[]) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const todayStr = formatDate(today);

  const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean; appointmentCount: number }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const dateStr = formatDate(new Date(prevYear, prevMonth, day));
    const count = appointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled').length;
    days.push({ date: dateStr, day, isCurrentMonth: false, isToday: false, appointmentCount: count });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(new Date(year, month, day));
    const isToday = dateStr === todayStr;
    const count = appointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled').length;
    days.push({ date: dateStr, day, isCurrentMonth: true, isToday, appointmentCount: count });
  }

  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const dateStr = formatDate(new Date(nextYear, nextMonth, day));
    const count = appointments.filter(apt => apt.date === dateStr && apt.status !== 'cancelled').length;
    days.push({ date: dateStr, day, isCurrentMonth: false, isToday: false, appointmentCount: count });
  }

  return days;
};
