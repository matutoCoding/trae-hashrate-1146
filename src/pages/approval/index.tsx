import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import classnames from 'classnames';
import type { Appointment } from '@/types';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const ApprovalPage: React.FC = () => {
  const { appointments, approveAppointment, rejectAppointment, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (activeTab === 'pending') {
      result = result.filter(apt => apt.status === 'pending_approval');
    } else if (activeTab === 'approved') {
      result = result.filter(apt => apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'completed');
    } else if (activeTab === 'rejected') {
      result = result.filter(apt => apt.status === 'rejected');
    }

    if (filterType !== 'all') {
      result = result.filter(apt => {
        const currentNode = apt.approvalNodes[apt.currentApprovalIndex];
        return currentNode?.type === filterType;
      });
    }

    return result.sort((a, b) => {
      if (a.status === 'pending_approval' && b.status !== 'pending_approval') return -1;
      if (a.status !== 'pending_approval' && b.status === 'pending_approval') return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [appointments, activeTab, filterType]);

  const pendingCount = appointments.filter(apt => apt.status === 'pending_approval').length;
  const consultantCount = appointments.filter(apt => apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'completed').length;
  const rejectedCount = appointments.filter(apt => apt.status === 'rejected').length;

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认通过',
      content: '确定要通过该预约的审批吗？',
      success: (res) => {
        if (res.confirm) {
          approveAppointment(id);
          Taro.showToast({ title: '已通过', icon: 'success' });
        }
      }
    });
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认驳回',
      content: '确定要驳回该预约吗？',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: (res) => {
        if (res.confirm) {
          rejectAppointment(id, res.content || '资料不全，需补充材料');
          Taro.showToast({ title: '已驳回', icon: 'none' });
        }
      }
    });
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${id}`
    });
  };

  const getCurrentStepName = (appointment: Appointment) => {
    const node = appointment.approvalNodes[appointment.currentApprovalIndex];
    if (!node) return '已完成';
    const nameMap: Record<string, string> = {
      consultant: '咨询师审核',
      doctor: '主诊医生审核',
      director: '院长审核'
    };
    return nameMap[node.type] || node.name;
  };

  const tabs = [
    { key: 'pending', label: '待审批', count: pendingCount },
    { key: 'approved', label: '已通过', count: consultantCount },
    { key: 'rejected', label: '已驳回', count: rejectedCount },
    { key: 'all', label: '全部', count: appointments.length }
  ];

  const filters = [
    { key: 'all', label: '全部节点' },
    { key: 'consultant', label: '咨询师' },
    { key: 'doctor', label: '主诊医生' },
    { key: 'director', label: '院长' }
  ];

  return (
    <ScrollView className={styles.approvalPage} scrollY>
      <View className={styles.tabBar}>
        {tabs.map(tab => (
          <View
            key={tab.key}
            className={classnames(styles.tabItem, activeTab === tab.key && styles.active)}
            onClick={() => setActiveTab(tab.key as TabType)}
          >
            {tab.label}
            {tab.count > 0 && (
              <Text className={styles.tabCount}>{tab.count}</Text>
            )}
          </View>
        ))}
      </View>

      <ScrollView className={styles.filterBar} scrollX>
        {filters.map(filter => (
          <View
            key={filter.key}
            className={classnames(styles.filterItem, filterType === filter.key && styles.active)}
            onClick={() => setFilterType(filter.key)}
          >
            {filter.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.listContainer}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(apt => (
            <View
              key={apt.id}
              className={styles.approvalCard}
              onClick={() => goToDetail(apt.id)}
            >
              <View className={styles.cardHeader}>
                <Text className={styles.projectName}>{apt.projectName}</Text>
                {apt.status === 'pending_approval' ? (
                  <Text className={styles.currentStep}>{getCurrentStepName(apt)}</Text>
                ) : (
                  <StatusTag status={apt.status} />
                )}
              </View>

              <View className={styles.cardBody}>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>顾客</Text>
                  <Text className={styles.infoValue}>
                    {apt.customerName}（{apt.customerPhone}）
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>操作室</Text>
                  <Text className={styles.infoValue}>{apt.roomName}</Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>时间</Text>
                  <Text className={styles.infoValue}>
                    {apt.date} {apt.startTime}-{apt.endTime}
                  </Text>
                </View>
                <View className={styles.infoRow}>
                  <Text className={styles.infoLabel}>咨询师</Text>
                  <Text className={styles.infoValue}>{apt.consultantName}</Text>
                </View>
              </View>

              {apt.status === 'pending_approval' && (
                <View className={styles.cardFooter}>
                  <View
                    className={classnames(styles.btn, styles.btnDanger)}
                    onClick={(e) => handleReject(e, apt.id)}
                  >
                    驳回
                  </View>
                  <View
                    className={classnames(styles.btn, styles.btnPrimary)}
                    onClick={(e) => handleApprove(e, apt.id)}
                  >
                    通过
                  </View>
                </View>
              )}
            </View>
          ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emptyIcon}>📋</Text>
            <Text className={styles.emptyText}>暂无审批记录</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default ApprovalPage;
