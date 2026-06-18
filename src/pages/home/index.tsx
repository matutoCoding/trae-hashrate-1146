import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatCard from '@/components/StatCard';
import AppointmentCard from '@/components/AppointmentCard';
import { formatDate } from '@/utils';

const HomePage: React.FC = () => {
  const { appointments, currentUser, rooms } = useAppStore();
  const today = formatDate(new Date());

  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(
      apt => apt.date === today && apt.status !== 'cancelled' && apt.status !== 'rejected'
    );
    const pendingApproval = appointments.filter(
      apt => apt.status === 'pending_approval'
    );
    const completedToday = appointments.filter(
      apt => apt.date === today && apt.status === 'completed'
    );

    return {
      todayAppointments: todayAppointments.length,
      pendingApproval: pendingApproval.length,
      completedToday: completedToday.length,
      totalRooms: rooms.filter(r => r.status === 'active').length
    };
  }, [appointments, rooms, today]);

  const todayAppointments = useMemo(() => {
    return appointments
      .filter(apt => apt.date === today && apt.status !== 'cancelled' && apt.status !== 'rejected')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 5);
  }, [appointments, today]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'create':
        Taro.navigateTo({ url: '/pages/create-appointment/index' });
        break;
      case 'schedule':
        Taro.switchTab({ url: '/pages/schedule/index' });
        break;
      case 'approval':
        Taro.switchTab({ url: '/pages/approval/index' });
        break;
      case 'rooms':
        Taro.switchTab({ url: '/pages/schedule/index' });
        break;
      default:
        break;
    }
  };

  const handleViewAll = () => {
    Taro.switchTab({ url: '/pages/schedule/index' });
  };

  const onPullDownRefresh = () => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  React.useEffect(() => {
    Taro.setNavigationBarTitle({ title: '医美预约管理' });
  }, []);

  return (
    <ScrollView 
      className={styles.homePage} 
      scrollY
      refresherEnabled
      onRefresherRefresh={onPullDownRefresh}
    >
      <View className={styles.header}>
        <Text className={styles.welcome}>你好，欢迎回来</Text>
        <Text className={styles.userName}>{currentUser.name}</Text>
        <Text className={styles.tips}>今天有 {stats.todayAppointments} 个预约待处理</Text>
      </View>

      <View className={styles.statSection}>
        <View className={styles.statGrid}>
          <StatCard 
            value={stats.todayAppointments} 
            label="今日预约" 
            variant="primary" 
          />
          <StatCard 
            value={stats.pendingApproval} 
            label="待审批" 
            variant="warning" 
          />
          <StatCard 
            value={stats.completedToday} 
            label="今日完成" 
            variant="success" 
          />
          <StatCard 
            value={stats.totalRooms} 
            label="可用操作室" 
            variant="primary" 
          />
        </View>
      </View>

      <View className={styles.quickActions}>
        <Text className={styles.sectionTitle}>快捷操作</Text>
        <View className={styles.actionGrid}>
          <View className={styles.actionItem} onClick={() => handleQuickAction('create')}>
            <View className={`${styles.actionIcon} ${styles.primary}`}>+</View>
            <Text className={styles.actionLabel}>新建预约</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('schedule')}>
            <View className={`${styles.actionIcon} ${styles.success}`}>📅</View>
            <Text className={styles.actionLabel}>排期管理</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('approval')}>
            <View className={`${styles.actionIcon} ${styles.warning}`}>✍️</View>
            <Text className={styles.actionLabel}>审批中心</Text>
          </View>
          <View className={styles.actionItem} onClick={() => handleQuickAction('rooms')}>
            <View className={`${styles.actionIcon} ${styles.error}`}>🏥</View>
            <Text className={styles.actionLabel}>操作室</Text>
          </View>
        </View>
      </View>

      <View className={styles.appointmentSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>今日预约</Text>
          <Text className={styles.viewAll} onClick={handleViewAll}>查看全部</Text>
        </View>
        
        {todayAppointments.length > 0 ? (
          todayAppointments.map(apt => (
            <AppointmentCard key={apt.id} appointment={apt} />
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📭</Text>
            <Text className={styles.emptyText}>今日暂无预约</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default HomePage;
