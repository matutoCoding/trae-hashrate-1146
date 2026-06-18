import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import classnames from 'classnames';
import type { Appointment } from '@/types';

type TabType = 'myPending' | 'pending' | 'approved' | 'all';

const ApprovalPage: React.FC = () => {
  const { appointments, approveAppointment, rejectAppointment, currentUser, isMyApprovalTurn } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('myPending');

  const myPendingCount = useMemo(() => {
    return appointments.filter(apt => isMyApprovalTurn(apt)).length;
  }, [appointments, isMyApprovalTurn]);

  const allPendingCount = useMemo(() => {
    return appointments.filter(apt => apt.status === 'pending_approval').length;
  }, [appointments]);

  const approvedCount = useMemo(() => {
    return appointments.filter(apt => apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'executing' || apt.status === 'completed').length;
  }, [appointments]);

  const hasRejectedNode = (apt: Appointment) => {
    return apt.approvalNodes.some(n => n.status === 'rejected');
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

  const getRoleName = (role: string) => {
    const map: Record<string, string> = { consultant: '咨询师', doctor: '医生', director: '院长', admin: '管理员' };
    return map[role] || role;
  };

  const filteredAppointments = useMemo(() => {
    let result = [...appointments];

    if (activeTab === 'myPending') {
      result = result.filter(apt => isMyApprovalTurn(apt));
    } else if (activeTab === 'pending') {
      result = result.filter(apt => apt.status === 'pending_approval');
    } else if (activeTab === 'approved') {
      result = result.filter(apt => apt.status === 'approved' || apt.status === 'confirmed' || apt.status === 'executing' || apt.status === 'completed');
    }

    return result.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [appointments, activeTab, isMyApprovalTurn]);

  const handleApprove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认通过',
      content: '确定要通过该预约的审批吗？',
      success: (res) => {
        if (res.confirm) {
          const ok = approveAppointment(id);
          if (ok) {
            Taro.showToast({ title: '已通过', icon: 'success' });
          } else {
            Taro.showToast({ title: '无权操作', icon: 'none' });
          }
        }
      }
    });
  };

  const handleReject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认驳回',
      content: '确定要驳回该预约吗？驳回后将退回上一环节补充资料。',
      editable: true,
      placeholderText: '请输入驳回原因',
      success: (res) => {
        if (res.confirm) {
          const ok = rejectAppointment(id, res.content || '资料不全，需补充材料');
          if (ok) {
            Taro.showToast({ title: '已驳回，退回上一环节', icon: 'none' });
          } else {
            Taro.showToast({ title: '无权操作', icon: 'none' });
          }
        }
      }
    });
  };

  const goToDetail = (id: string) => {
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${id}`
    });
  };

  const tabs = [
    { key: 'myPending', label: '待我审批', count: myPendingCount },
    { key: 'pending', label: '全部待审', count: allPendingCount },
    { key: 'approved', label: '已通过', count: approvedCount },
    { key: 'all', label: '全部', count: appointments.length }
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

      <View style={{ padding: '16rpx 32rpx', background: '#e6f7ff', display: 'flex', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, color: '#1890ff' }}>
          当前角色：{getRoleName(currentUser.role)}（{currentUser.name}）
        </Text>
      </View>

      <View className={styles.listContainer}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(apt => {
            const canOperate = isMyApprovalTurn(apt);
            const wasRejected = hasRejectedNode(apt);

            return (
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

                {wasRejected && (
                  <View style={{ padding: '8rpx 16rpx', background: '#fff2f0', borderRadius: 8, marginBottom: 16 }}>
                    <Text style={{ fontSize: 24, color: '#ff4d4f' }}>
                      ⚠️ 曾被驳回：{apt.approvalNodes.find(n => n.status === 'rejected')?.comment || '需补充资料'}
                    </Text>
                  </View>
                )}

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

                {canOperate && (
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
                      {wasRejected ? '重新提交' : '通过'}
                    </View>
                  </View>
                )}

                {!canOperate && apt.status === 'pending_approval' && (
                  <View style={{ padding: '12rpx 0 0', borderTop: '1rpx solid #f2f3f5' }}>
                    <Text style={{ fontSize: 24, color: '#86909c' }}>
                      等待{getCurrentStepName(apt)}处理
                    </Text>
                  </View>
                )}
              </View>
            );
          })
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
