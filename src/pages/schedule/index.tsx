import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import AppointmentCard from '@/components/AppointmentCard';
import StatusTag from '@/components/StatusTag';
import { generateCalendarDays, formatDate, getAvailableTimeSlots } from '@/utils';
import classnames from 'classnames';

const SchedulePage: React.FC = () => {
  const { rooms, appointments, projects } = useAppStore();
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(new Date()));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<{ startTime: string; endTime: string } | null>(null);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return generateCalendarDays(year, month, appointments);
  }, [currentDate, appointments]);

  const timeSlots = useMemo(() => {
    if (!selectedRoomId || !selectedDate) return [];
    return getAvailableTimeSlots(selectedDate, selectedRoomId, appointments, 30);
  }, [selectedDate, selectedRoomId, appointments]);

  const dayAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === selectedDate && apt.roomId === selectedRoomId && apt.status !== 'cancelled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [appointments, selectedDate, selectedRoomId]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setSelectedTimeSlot(null);
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setSelectedTimeSlot(null);
  };

  const handleSelectTimeSlot = (slot: { startTime: string; endTime: string; available: boolean }) => {
    if (!slot.available) return;
    setSelectedTimeSlot({ startTime: slot.startTime, endTime: slot.endTime });
  };

  const handleCreateAppointment = () => {
    if (!selectedTimeSlot) {
      Taro.showToast({ title: '请先选择时段', icon: 'none' });
      return;
    }
    Taro.navigateTo({
      url: `/pages/create-appointment/index?roomId=${selectedRoomId}&date=${selectedDate}&startTime=${selectedTimeSlot.startTime}&endTime=${selectedTimeSlot.endTime}`
    });
  };

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const monthTitle = `${currentDate.getFullYear()}年${currentDate.getMonth() + 1}月`;

  return (
    <ScrollView className={styles.schedulePage} scrollY>
      <ScrollView className={styles.roomTabs} scrollX>
        {rooms.map(room => (
          <View
            key={room.id}
            className={classnames(styles.roomTab, room.id === selectedRoomId && styles.active)}
            onClick={() => handleSelectRoom(room.id)}
          >
            {room.name}
          </View>
        ))}
      </ScrollView>

      {selectedRoom && (
        <View className={styles.roomInfo}>
          <Text className={styles.roomName}>{selectedRoom.name}</Text>
          <View className={styles.roomMeta}>
            <Text className={styles.metaItem}>类型：{selectedRoom.type}</Text>
            <Text className={styles.metaItem}>
              状态：
              <StatusTag status={selectedRoom.status === 'active' ? 'approved' : selectedRoom.status === 'maintenance' ? 'pending' : 'cancelled'} 
                text={selectedRoom.status === 'active' ? '正常' : selectedRoom.status === 'maintenance' ? '维护中' : '停用'} 
              />
            </Text>
          </View>
        </View>
      )}

      <View className={styles.calendarSection}>
        <View className={styles.calendarHeader}>
          <View className={styles.navBtn} onClick={handlePrevMonth}>{'<'}</View>
          <Text className={styles.monthTitle}>{monthTitle}</Text>
          <View className={styles.navBtn} onClick={handleNextMonth}>{'>'}</View>
        </View>
        
        <View className={styles.weekDays}>
          {weekDays.map(day => (
            <Text key={day} className={styles.weekDay}>{day}</Text>
          ))}
        </View>
        
        <View className={styles.calendarDays}>
          {calendarDays.map((day, index) => (
            <View
              key={index}
              className={classnames(
                styles.calendarDay,
                !day.isCurrentMonth && styles.otherMonth,
                day.isToday && styles.today,
                day.date === selectedDate && styles.selected
              )}
              onClick={() => day.isCurrentMonth && handleSelectDate(day.date)}
            >
              <Text className={styles.dayNumber}>{day.day}</Text>
              {day.appointmentCount > 0 && (
                <Text className={styles.dayCount}>{day.appointmentCount}个</Text>
              )}
            </View>
          ))}
        </View>

        <View className={styles.legend}>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.available}`} />
            <Text>可预约</Text>
          </View>
          <View className={styles.legendItem}>
            <View className={`${styles.legendDot} ${styles.unavailable}`} />
            <Text>已占用</Text>
          </View>
        </View>
      </View>

      <View className={styles.timeSlotsSection}>
        <Text className={styles.sectionTitle}>可选时段</Text>
        <View className={styles.timeSlotsGrid}>
          {timeSlots.map((slot, index) => (
            <View
              key={index}
              className={classnames(
                styles.timeSlot,
                slot.available ? styles.available : styles.unavailable,
                selectedTimeSlot?.startTime === slot.startTime && styles.selected
              )}
              onClick={() => handleSelectTimeSlot(slot)}
            >
              <Text className={styles.slotTime}>{slot.startTime}</Text>
              <Text className={styles.slotStatus}>
                {slot.available ? '可预约' : '已占用'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.appointmentList}>
        <Text className={styles.listTitle}>当日预约 ({dayAppointments.length})</Text>
        {dayAppointments.length > 0 ? (
          dayAppointments.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))
        ) : (
          <View style={{ padding: '48rpx 0', textAlign: 'center', color: '#86909c' }}>
            <Text>当日暂无预约</Text>
          </View>
        )}
      </View>

      <View
        className={classnames(styles.createBtn, !selectedTimeSlot && styles.disabled)}
        onClick={handleCreateAppointment}
      >
        新建预约
      </View>
    </ScrollView>
  );
};

export default SchedulePage;
