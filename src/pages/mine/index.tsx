import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import classnames from 'classnames';
import type { UserRole, DateRange, Appointment, FollowUpPlan, FollowUpRecord } from '@/types';

const roleMap: Record<string, string> = {
  customer: '顾客',
  consultant: '咨询师',
  doctor: '主诊医生',
  director: '院长',
  admin: '管理员'
};

const MinePage: React.FC = () => {
  const { currentUser, appointments, isMyApprovalTurn, switchRole, getMyFollowUpPlans, getTodayFollowUpPlans } = useAppStore();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [showFollowUpList, setShowFollowUpList] = useState(false);

  const myPendingCount = useMemo(() => {
    return appointments.filter(apt => isMyApprovalTurn(apt)).length;
  }, [appointments, isMyApprovalTurn]);

  const todayFollowUps = useMemo(() => getTodayFollowUpPlans(), [getTodayFollowUpPlans]);
  const myFollowUps = useMemo(() => getMyFollowUpPlans(), [getMyFollowUpPlans]);
  const todayPendingFollowUps = useMemo(() => todayFollowUps.filter(f => f.status === 'pending').length, [todayFollowUps]);
  const myPendingFollowUps = useMemo(() => myFollowUps.filter(f => f.status === 'pending').length, [myFollowUps]);

  const stats = useMemo(() => {
    const myAppointments = appointments.filter(
      apt => apt.consultantName === currentUser.name ||
        apt.doctorName === currentUser.name ||
        apt.directorName === currentUser.name
    );

    const pendingCount = appointments.filter(apt => apt.status === 'pending_approval').length;
    const approvedCount = appointments.filter(apt => apt.status === 'approved' || apt.status === 'confirmed').length;
    const completedCount = appointments.filter(apt => apt.status === 'completed').length;

    return {
      total: myAppointments.length,
      pending: pendingCount,
      approved: approvedCount,
      completed: completedCount
    };
  }, [appointments, currentUser]);

  const roleOptions: { role: UserRole; label: string }[] = [
    { role: 'consultant', label: '咨询师' },
    { role: 'doctor', label: '主诊医生' },
    { role: 'director', label: '院长' },
    { role: 'admin', label: '管理员' }
  ];

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setShowRoleSwitcher(false);
    Taro.showToast({ title: `已切换为${roleMap[role]}`, icon: 'success' });
  };

  const menuGroups = [
    {
      title: '业务管理',
      items: [
        { icon: '📅', title: '我的预约', desc: '查看我参与的预约', color: 'primary', badge: stats.total, path: '' },
        { icon: '✍️', title: '待我审批', desc: `等待处理（${myPendingCount}）`, color: 'warning', badge: myPendingCount, path: '/pages/approval/index' },
        { icon: '📞', title: '今日回访', desc: `今日需回访（${todayPendingFollowUps}）`, color: 'primary', badge: todayPendingFollowUps, path: '__followup__' },
        { icon: '☎️', title: '我的回访', desc: `共 ${myFollowUps.length} 条，待处理 ${myPendingFollowUps}`, color: 'success', badge: myPendingFollowUps, path: '__myfollowup__' },
        { icon: '✅', title: '已通过', desc: '我已审批通过的', color: 'success', badge: stats.approved, path: '' },
      ]
    },
    {
      title: '机构管理',
      items: [
        { icon: '📊', title: '经营看板', desc: '预约/完成/收入趋势', color: 'primary', badge: 0, path: '/pages/dashboard/index', roles: ['director', 'admin'] },
        { icon: '🏥', title: '操作室管理', desc: '管理操作室资源', color: 'primary', badge: 0, path: '' },
        { icon: '💉', title: '项目管理', desc: '管理医美项目', color: 'success', badge: 0, path: '' },
        { icon: '👥', title: '人员管理', desc: '管理员工信息', color: 'warning', badge: 0, path: '' },
      ]
    },
    {
      title: '其他',
      items: [
        { icon: '⚙️', title: '系统设置', desc: '偏好设置与通知', color: 'primary', badge: 0, path: '' },
        { icon: '❓', title: '帮助与反馈', desc: '常见问题与建议', color: 'error', badge: 0, path: '' },
        { icon: '📖', title: '关于我们', desc: '版本信息', color: 'primary', badge: 0, path: '' },
      ]
    }
  ];

  const handleMenuItemClick = (path: string, item?: { roles?: string[] }) => {
    if (item?.roles && item.roles.length > 0 && !item.roles.includes(currentUser.role)) {
      Taro.showToast({ title: '仅院长/管理员可查看', icon: 'none' });
      return;
    }
    if (path === '__followup__') {
      setShowFollowUpList(true);
      return;
    }
    if (path === '__myfollowup__') {
      setShowFollowUpList(true);
      return;
    }
    if (path) {
      if (path.startsWith('/pages/approval')) {
        Taro.switchTab({ url: path });
      } else if (path.startsWith('/pages/dashboard')) {
        Taro.navigateTo({ url: path });
      } else {
        Taro.showToast({ title: '功能开发中', icon: 'none' });
      }
    } else {
      Taro.showToast({ title: '功能开发中', icon: 'none' });
    }
  };

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '已退出', icon: 'success' });
        }
      }
    });
  };

  return (
    <ScrollView className={styles.minePage} scrollY>
      <View className={styles.header}>
        <View className={styles.userInfo}>
          <View className={styles.avatar}>
            <Text>{currentUser.name.charAt(0)}</Text>
          </View>
          <View className={styles.userDetail}>
            <Text className={styles.userName}>{currentUser.name}</Text>
            <View className={styles.userRole}>
              {roleMap[currentUser.role] || currentUser.role}
            </View>
          </View>
          <View className={styles.switchRoleBtn} onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}>
            <Text className={styles.switchRoleText}>切换角色</Text>
          </View>
        </View>

        {showRoleSwitcher && (
          <View className={styles.roleSwitcher}>
            {roleOptions.map(opt => (
              <View
                key={opt.role}
                className={classnames(
                  styles.roleOption,
                  currentUser.role === opt.role && styles.roleActive
                )}
                onClick={() => handleSwitchRole(opt.role)}
              >
                {opt.label}
                {currentUser.role === opt.role && ' ✓'}
              </View>
            ))}
          </View>
        )}

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总预约数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{myPendingCount}</Text>
            <Text className={styles.statLabel}>待我审批</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.completed}</Text>
            <Text className={styles.statLabel}>已完成</Text>
          </View>
        </View>
      </View>

      <View className={styles.menuSection}>
        {menuGroups.map((group, groupIndex) => (
          <View key={groupIndex} className={styles.menuGroup}>
            <Text className={styles.menuGroupTitle}>{group.title}</Text>
            {group.items.map((item, itemIndex) => (
              <View
                key={itemIndex}
                className={styles.menuItem}
                onClick={() => handleMenuItemClick(item.path, item)}
              >
                <View className={classnames(styles.menuIcon, styles[item.color])}>
                  {item.icon}
                </View>
                <View className={styles.menuContent}>
                  <Text className={styles.menuTitle}>{item.title}</Text>
                  <Text className={styles.menuDesc}>{item.desc}</Text>
                </View>
                {item.badge > 0 && (
                  <View className={styles.menuBadge}>{item.badge}</View>
                )}
                <Text className={styles.menuArrow}>›</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      {showFollowUpList && (
        <View className={styles.followUpModalOverlay} onClick={() => setShowFollowUpList(false)}>
          <View className={styles.followUpModal} onClick={e => e.stopPropagation()}>
            <View className={styles.followUpModalHeader}>
              <Text className={styles.followUpModalTitle}>回访计划</Text>
              <Text className={styles.followUpModalClose} onClick={() => setShowFollowUpList(false)}>×</Text>
            </View>
            <ScrollView scrollY className={styles.followUpModalScroll}>
              {myFollowUps.length > 0 ? (
                myFollowUps.map(follow => (
                  <View
                    key={follow.id}
                    className={styles.followUpCard}
                    onClick={() => {
                      setShowFollowUpList(false);
                      Taro.navigateTo({ url: `/pages/appointment-detail/index?id=${follow.appointmentId}` });
                    }}
                  >
                    <View className={styles.followUpHeader}>
                      <Text className={styles.followUpCustomer}>{follow.appointment?.customerName || '顾客'}</Text>
                      <Text className={`${styles.followUpBadge} ${follow.status === 'pending' ? styles.pending : styles.done}`}>
                        {follow.status === 'pending' ? '待处理' : '已完成'}
                      </Text>
                    </View>
                    <View className={styles.followUpInfo}>
                      <Text>📋 {follow.appointment?.projectName}</Text>
                      <Text>📅 {follow.plannedDate}</Text>
                    </View>
                    {follow.plannedTime && (
                      <View className={styles.followUpInfo}>
                        <Text>⏰ {follow.plannedTime}</Text>
                        <Text>👤 {follow.assignedToName || '未分配'}</Text>
                      </View>
                    )}
                    {follow.notes && (
                      <View className={styles.followUpNotes}>备注：{follow.notes}</View>
                    )}
                    {follow.record && (
                      <View className={styles.followUpRecordBox}>
                        <Text className={styles.followUpRecordLabel}>回访结果：</Text>
                        <Text className={styles.followUpRecordText}>
                          {follow.record.result === 'satisfied' ? '满意 😀' :
                           follow.record.result === 'neutral' ? '一般 😐' :
                           follow.record.result === 'complaint' ? '投诉 😠' : '严重问题 🚨'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View className={styles.followUpEmpty}>
                  <Text className={styles.followUpEmptyIcon}>📞</Text>
                  <Text className={styles.followUpEmptyText}>暂无回访计划</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <View className={styles.logoutSection}>
        <View className={styles.logoutBtn} onClick={handleLogout}>
          退出登录
        </View>
      </View>

      <View className={styles.versionInfo}>
        <Text>医美预约管理系统 v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default MinePage;
