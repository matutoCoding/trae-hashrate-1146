import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import classnames from 'classnames';
import type { Appointment, UserRole } from '@/types';

type TabType = 'myPending' | 'pending' | 'approved' | 'all';

const ApprovalPage: React.FC = () => {
  const {
    appointments,
    approveAppointment,
    rejectAppointment,
    resubmitAppointment,
    savePreOpAssessment,
    currentUser,
    isMyApprovalTurn,
    switchRole
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<TabType>('myPending');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

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

  const isDoctorNodeForApt = (apt: Appointment) => {
    if (apt.status !== 'pending_approval') return false;
    const node = apt.approvalNodes[apt.currentApprovalIndex];
    return node?.type === 'doctor' && node?.status === 'pending';
  };

  const canDoctorApprove = (apt: Appointment): boolean => {
    if (!isDoctorNodeForApt(apt)) return true;
    const assess = apt.preOpAssessment;
    if (!assess) return false;
    if (!assess.informedConsent) return false;
    if (!assess.doctorSignature) return false;
    return true;
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

  const handleApprove = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();

    if (isDoctorNodeForApt(apt) && !canDoctorApprove(apt)) {
      Taro.showToast({ title: '请先完成术前评估、知情同意和签字', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认通过',
      content: '确定要通过该预约的审批吗？',
      success: (res) => {
        if (res.confirm) {
          const ok = approveAppointment(apt.id);
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

  const handleResubmit = (e: React.MouseEvent, apt: Appointment) => {
    e.stopPropagation();
    Taro.showModal({
      title: '确认重新提交',
      content: '补充资料后重新提交审批？',
      success: (res) => {
        if (res.confirm) {
          const ok = resubmitAppointment(apt.id, '补充资料后重新提交');
          if (ok) {
            Taro.showToast({ title: '已重新提交', icon: 'success' });
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

  const handleSwitchRole = (role: UserRole) => {
    switchRole(role);
    setShowRoleSwitcher(false);
    Taro.showToast({ title: `已切换为${getRoleName(role)}`, icon: 'success' });
  };

  const tabs = [
    { key: 'myPending', label: '待我审批', count: myPendingCount },
    { key: 'pending', label: '全部待审', count: allPendingCount },
    { key: 'approved', label: '已通过', count: approvedCount },
    { key: 'all', label: '全部', count: appointments.length }
  ];

  const roleOptions: { role: UserRole; label: string }[] = [
    { role: 'consultant', label: '咨询师' },
    { role: 'doctor', label: '主诊医生' },
    { role: 'director', label: '院长' },
    { role: 'admin', label: '管理员' }
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

      <View className={styles.roleBar} onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}>
        <Text className={styles.roleText}>
          当前角色：{getRoleName(currentUser.role)}（{currentUser.name}）
        </Text>
        <Text className={styles.roleArrow}>{showRoleSwitcher ? '▲' : '▼'}</Text>
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

      <View className={styles.listContainer}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(apt => {
            const canOperate = isMyApprovalTurn(apt);
            const wasRejected = hasRejectedNode(apt);
            const isDoctor = isDoctorNodeForApt(apt);
            const doctorCanPass = canDoctorApprove(apt);

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
                  <View className={styles.rejectHint}>
                    <Text className={styles.rejectHintText}>
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
                    {wasRejected ? (
                      <View
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={(e) => handleResubmit(e, apt)}
                      >
                        重新提交
                      </View>
                    ) : isDoctor && !doctorCanPass ? (
                      <View
                        className={classnames(styles.btn, styles.btnWarning)}
                        onClick={() => goToDetail(apt.id)}
                      >
                        去完成评估
                      </View>
                    ) : (
                      <View
                        className={classnames(styles.btn, styles.btnPrimary)}
                        onClick={(e) => handleApprove(e, apt)}
                      >
                        通过
                      </View>
                    )}
                  </View>
                )}

                {!canOperate && apt.status === 'pending_approval' && (
                  <View className={styles.waitHint}>
                    <Text className={styles.waitHintText}>
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

      {showRoleSwitcher && (
        <View className={styles.overlay} onClick={() => setShowRoleSwitcher(false)} />
      )}
    </ScrollView>
  );
};

export default ApprovalPage;
