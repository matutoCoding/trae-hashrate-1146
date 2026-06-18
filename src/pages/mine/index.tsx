import React, { useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import classnames from 'classnames';

const roleMap: Record<string, string> = {
  customer: '顾客',
  consultant: '咨询师',
  doctor: '主诊医生',
  director: '院长',
  admin: '管理员'
};

const MinePage: React.FC = () => {
  const { currentUser, appointments } = useAppStore();

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

  const menuGroups = [
    {
      title: '业务管理',
      items: [
        { icon: '📅', title: '我的预约', desc: '查看我参与的预约', color: 'primary', badge: stats.total, path: '' },
        { icon: '✍️', title: '待我审批', desc: '等待处理的审批', color: 'warning', badge: stats.pending, path: '/pages/approval/index' },
        { icon: '✅', title: '已通过', desc: '我已审批通过的', color: 'success', badge: 0, path: '' },
      ]
    },
    {
      title: '机构管理',
      items: [
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

  const handleMenuItemClick = (path: string) => {
    if (path) {
      if (path.startsWith('/pages/approval')) {
        Taro.switchTab({ url: path });
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
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.total}</Text>
            <Text className={styles.statLabel}>总预约数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{stats.pending}</Text>
            <Text className={styles.statLabel}>待审批</Text>
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
                onClick={() => handleMenuItemClick(item.path)}
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
