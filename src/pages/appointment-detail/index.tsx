import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import ApprovalFlow from '@/components/ApprovalFlow';
import classnames from 'classnames';
import type { Appointment } from '@/types';

const AppointmentDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getAppointmentById,
    cancelAppointment,
    startExecution,
    completeAppointment,
    resubmitAppointment,
    currentUser,
    isMyApprovalTurn
  } = useAppStore();
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const apt = getAppointmentById(id as string);
      if (apt) {
        setAppointment(apt);
      } else {
        Taro.showToast({ title: '预约不存在', icon: 'none' });
      }
    }
  }, [router.params.id, getAppointmentById]);

  const refreshAppointment = () => {
    if (!appointment) return;
    const updated = getAppointmentById(appointment.id);
    if (updated) setAppointment(updated);
  };

  const handleCancel = () => {
    if (!appointment) return;

    Taro.showModal({
      title: '确认取消',
      content: '确定要取消这个预约吗？取消后该时段将立即释放。',
      editable: true,
      placeholderText: '请输入取消原因（可选）',
      success: (res) => {
        if (res.confirm) {
          const success = cancelAppointment(appointment.id, res.content);
          if (success) {
            Taro.showToast({ title: '已取消，时段已释放', icon: 'success' });
            refreshAppointment();
          }
        }
      }
    });
  };

  const handleApproval = () => {
    if (!appointment) return;
    Taro.navigateTo({
      url: `/pages/approval-detail/index?id=${appointment.id}`
    });
  };

  const handleResubmit = () => {
    if (!appointment) return;

    Taro.showModal({
      title: '确认重新提交',
      content: '补充资料后重新提交审批？',
      success: (res) => {
        if (res.confirm) {
          const ok = resubmitAppointment(appointment.id, '补充资料后重新提交');
          if (ok) {
            Taro.showToast({ title: '已重新提交', icon: 'success' });
            refreshAppointment();
          } else {
            Taro.showToast({ title: '无权操作或状态不允许', icon: 'none' });
          }
        }
      }
    });
  };

  const handleStartExecution = () => {
    if (!appointment) return;

    Taro.showModal({
      title: '确认开始执行',
      content: '确定要开始执行该预约项目吗？',
      success: (res) => {
        if (res.confirm) {
          const ok = startExecution(appointment.id);
          if (ok) {
            Taro.showToast({ title: '已开始执行', icon: 'success' });
            refreshAppointment();
          } else {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleComplete = () => {
    if (!appointment) return;

    Taro.showModal({
      title: '确认完成',
      content: '确定要标记该预约项目为已完成吗？',
      success: (res) => {
        if (res.confirm) {
          const ok = completeAppointment(appointment.id);
          if (ok) {
            Taro.showToast({ title: '已标记完成', icon: 'success' });
            refreshAppointment();
          } else {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  if (!appointment) {
    return (
      <View style={{ padding: 100, textAlign: 'center', color: '#86909c' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const canCancel = appointment.status !== 'cancelled' &&
    appointment.status !== 'completed';

  const canResubmit = appointment.status === 'pending_approval' && isMyApprovalTurn(appointment);
  const wasRejected = appointment.approvalNodes.some(n => n.status === 'rejected');

  const currentApprovalNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  const approvalNodeName = currentApprovalNode?.name || '已完成';

  return (
    <ScrollView className={styles.detailPage} scrollY>
      <View className={styles.section}>
        <View className={styles.projectInfo}>
          <Text className={styles.projectName}>{appointment.projectName}</Text>
          <StatusTag status={appointment.status} />
        </View>

        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预约编号</Text>
            <Text className={styles.infoContent}>{appointment.id}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>操作室</Text>
            <Text className={styles.infoContent}>{appointment.roomName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预约日期</Text>
            <Text className={styles.infoContent}>{appointment.date}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>预约时段</Text>
            <Text className={styles.infoContent}>
              {appointment.startTime} - {appointment.endTime}
            </Text>
          </View>
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>顾客信息</Text>
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>姓名</Text>
            <Text className={styles.infoContent}>{appointment.customerName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>联系电话</Text>
            <Text className={styles.infoContent}>{appointment.customerPhone}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>咨询师</Text>
            <Text className={styles.infoContent}>{appointment.consultantName}</Text>
          </View>
          {appointment.doctorName && (
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>主诊医生</Text>
              <Text className={styles.infoContent}>{appointment.doctorName}</Text>
            </View>
          )}
          {appointment.directorName && (
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>院长</Text>
              <Text className={styles.infoContent}>{appointment.directorName}</Text>
            </View>
          )}
        </View>
      </View>

      <View className={styles.approvalSection}>
        <ApprovalFlow
          nodes={appointment.approvalNodes}
          currentIndex={appointment.currentApprovalIndex}
        />
      </View>

      {wasRejected && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>驳回信息</Text>
          {appointment.approvalNodes.filter(n => n.status === 'rejected').map((node, idx) => (
            <View key={idx} style={{ padding: '8rpx 16rpx', background: '#fff2f0', borderRadius: 8, marginBottom: 8 }}>
              <Text style={{ fontSize: 24, color: '#ff4d4f' }}>
                {node.name} 驳回 - {node.operatorName}：{node.comment || '无'}
              </Text>
            </View>
          ))}
        </View>
      )}

      {appointment.preOpAssessment && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>术前评估记录</Text>
          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>既往病史</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.medicalHistory || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>过敏史</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.allergyHistory || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>当前用药</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.currentMedication || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>体格检查</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.physicalExamination || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>风险评估</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.riskAssessment || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>知情同意</Text>
              <Text className={styles.infoContent}>
                {appointment.preOpAssessment.informedConsent ? '✓ 已签署' : '未签署'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>医生签字</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.doctorSignature || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>评估日期</Text>
              <Text className={styles.infoContent}>{appointment.preOpAssessment.assessmentDate || '无'}</Text>
            </View>
          </View>
        </View>
      )}

      {appointment.notes && (
        <View className={styles.notesSection}>
          <Text className={styles.notesTitle}>备注信息</Text>
          <View className={styles.notesContent}>
            <Text>{appointment.notes}</Text>
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>操作记录</Text>
        <View className={styles.timeline}>
          {appointment.approvalNodes.map((node, index) => (
            <View key={`${node.type}-${index}`} className={styles.timelineItem}>
              <View
                className={classnames(
                  styles.timelineDot,
                  node.status === 'approved' && styles.success,
                  node.status === 'rejected' && styles.error,
                  node.status === 'pending' && styles.active
                )}
              />
              <View className={styles.timelineLine} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>{node.name}</Text>
                <Text className={styles.timelineDesc}>
                  {node.status === 'approved'
                    ? `已通过 - ${node.operatorName}`
                    : node.status === 'rejected'
                    ? `已驳回 - ${node.operatorName}`
                    : node.status === 'pending'
                    ? '待处理'
                    : '未开始'}
                </Text>
                {node.operatedAt && (
                  <Text className={styles.timelineTime}>{node.operatedAt}</Text>
                )}
                {node.comment && (
                  <View className={styles.timelineComment}>
                    <Text>{node.comment}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          {appointment.status === 'executing' && (
            <View className={styles.timelineItem}>
              <View className={classnames(styles.timelineDot, styles.active)} />
              <View className={styles.timelineLine} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>项目执行中</Text>
                <Text className={styles.timelineDesc}>正在进行医美项目操作</Text>
              </View>
            </View>
          )}
          {appointment.status === 'completed' && (
            <View className={styles.timelineItem}>
              <View className={classnames(styles.timelineDot, styles.success)} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>已完成</Text>
                <Text className={styles.timelineDesc}>项目操作已完成</Text>
              </View>
            </View>
          )}
          {appointment.status === 'cancelled' && (
            <View className={styles.timelineItem}>
              <View className={classnames(styles.timelineDot, styles.error)} />
              <View className={styles.timelineContent}>
                <Text className={styles.timelineTitle}>已取消</Text>
              </View>
            </View>
          )}
        </View>
      </View>

      <View className={styles.bottomBar}>
        {canCancel && (
          <View className={classnames(styles.btn, styles.btnDanger)} onClick={handleCancel}>
            取消预约
          </View>
        )}
        {appointment.status === 'pending_approval' && isMyApprovalTurn(appointment) && (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleApproval}>
            去审批
          </View>
        )}
        {appointment.status === 'pending_approval' && !isMyApprovalTurn(appointment) && (
          <View className={classnames(styles.btn, styles.btnOutline)} style={{ flex: 1 }}>
            等待{approvalNodeName}
          </View>
        )}
        {canResubmit && wasRejected && (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleResubmit}>
            重新提交
          </View>
        )}
        {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
          <View className={classnames(styles.btn, styles.btnSuccess)} onClick={handleStartExecution}>
            开始执行
          </View>
        )}
        {appointment.status === 'executing' && (
          <View className={classnames(styles.btn, styles.btnSuccess)} onClick={handleComplete}>
            标记完成
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppointmentDetailPage;
