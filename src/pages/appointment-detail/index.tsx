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
  const { getAppointmentById, cancelAppointment } = useAppStore();
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
            Taro.showToast({ title: '已取消', icon: 'success' });
            const updated = getAppointmentById(appointment.id);
            if (updated) setAppointment(updated);
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

  if (!appointment) {
    return (
      <View style={{ padding: 100, textAlign: 'center', color: '#86909c' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const showCancelButton = appointment.status !== 'cancelled' && 
    appointment.status !== 'completed' && 
    appointment.status !== 'rejected';

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
            <View key={node.type} className={styles.timelineItem}>
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
        </View>
      </View>

      <View className={styles.bottomBar}>
        {showCancelButton && (
          <View className={classnames(styles.btn, styles.btnDanger)} onClick={handleCancel}>
            取消预约
          </View>
        )}
        {appointment.status === 'pending_approval' && (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleApproval}>
            去审批
          </View>
        )}
        {appointment.status === 'rejected' && (
          <View className={classnames(styles.btn, styles.btnPrimary)}>
            重新提交
          </View>
        )}
        {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
          <View className={classnames(styles.btn, styles.btnSuccess)}>
            开始执行
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default AppointmentDetailPage;
