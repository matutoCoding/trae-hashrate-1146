import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatCard from '@/components/StatCard';
import AppointmentCard from '@/components/AppointmentCard';

const HomePage: React.FC = () => {
  const { appointments, rooms, currentUser, getTodayFollowUpPlans } = useAppStore();

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const todayFollowUpList = useMemo(() => getTodayFollowUpPlans(), [getTodayFollowUpPlans]);

  const todayPendingFollowUps = useMemo(() => {
    return todayFollowUpList.filter(f => f.status === 'pending').length;
  }, [todayFollowUpList]);

  const stats = useMemo(() => {
    const todayAppointments = appointments.filter(
      apt => apt.date === today && apt.status !== 'cancelled' && apt.status !== 'rejected'
    );
    const pendingApproval = appointments.filter(
      apt => apt.status === 'pending_approval'
    );
    const executing = appointments.filter(
      apt => apt.status === 'executing'
    );
    const completedToday = appointments.filter(
      apt => apt.date === today && apt.status === 'completed'
    );

    return {
      todayAppointments: todayAppointments.length,
      pendingApproval: pendingApproval.length,
      executing: executing.length,
      completedToday: completedToday.length,
      todayPendingFollowUps
    };
  }, [appointments, rooms, today, todayPendingFollowUps]);

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
            value={stats.todayPendingFollowUps} 
            label="待回访" 
            variant="warning" 
          />
          <StatCard 
            value={stats.executing} 
            label="执行中" 
            variant="primary" 
          />
          <StatCard 
            value={stats.completedToday} 
            label="今日完成" 
            variant="success" 
          />
          <StatCard 
            value={rooms.filter(r => r.status === 'active').length} 
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
          <Text className={styles.sectionTitle}>今日待回访</Text>
          <Text className={styles.viewAll} onClick={() => Taro.switchTab({ url: '/pages/mine/index' })}>全部回访</Text>
        </View>

        {todayFollowUpList.length > 0 ? (
          todayFollowUpList.map(follow => (
            <View
              key={follow.id}
              className={styles.followUpCard}
              onClick={() => Taro.navigateTo({ url: `/pages/appointment-detail/index?id=${follow.appointmentId}` })}
            >
              <View className={styles.followUpHeader}>
                <Text className={styles.followUpCustomer}>{follow.appointment?.customerName || '顾客'}</Text>
                <Text className={`${styles.followUpBadge} ${follow.status === 'pending' ? styles.pending : styles.done}`}>
                  {follow.status === 'pending' ? '待处理' : '已完成'}
                </Text>
              </View>
              <View className={styles.followUpInfo}>
                <Text>📋 {follow.appointment?.projectName}</Text>
                {follow.plannedTime && <Text>⏰ {follow.plannedTime}</Text>}
              </View>
              {follow.notes && (
                <View className={styles.followUpNotes}>备注：{follow.notes}</View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>✅</Text>
            <Text className={styles.emptyText}>今日暂无回访计划</Text>
          </View>
        )}
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
