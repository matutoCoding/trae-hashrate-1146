import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import ApprovalFlow from '@/components/ApprovalFlow';
import classnames from 'classnames';
import type { Appointment, PreOpAssessment } from '@/types';

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter();
  const { getAppointmentById, approveAppointment, rejectAppointment, currentUser } = useAppStore();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [assessment, setAssessment] = useState<PreOpAssessment>({
    id: '',
    medicalHistory: '',
    allergyHistory: '',
    currentMedication: '',
    physicalExamination: '',
    riskAssessment: '',
    informedConsent: false
  });
  const [doctorSigned, setDoctorSigned] = useState(false);

  useEffect(() => {
    const id = router.params.id;
    if (id) {
      const apt = getAppointmentById(id as string);
      if (apt) {
        setAppointment(apt);
        if (apt.preOpAssessment) {
          setAssessment(apt.preOpAssessment);
        }
      } else {
        Taro.showToast({ title: '预约不存在', icon: 'none' });
      }
    }
  }, [router.params.id, getAppointmentById]);

  const handleApprove = () => {
    if (!appointment) return;
    
    const currentNode = appointment.approvalNodes[appointment.currentApprovalIndex];
    
    if (currentNode?.type === 'doctor' && !assessment.informedConsent) {
      Taro.showToast({ title: '请先完成术前评估', icon: 'none' });
      return;
    }

    Taro.showModal({
      title: '确认通过',
      content: `确定要通过${currentNode?.name || '审批'}吗？`,
      success: (res) => {
        if (res.confirm) {
          const comment = currentNode?.type === 'doctor' ? '术前评估完成，同意手术' : '资料齐全，同意';
          approveAppointment(appointment.id, comment);
          
          const updated = getAppointmentById(appointment.id);
          if (updated) setAppointment(updated);
          
          Taro.showToast({ title: '已通过', icon: 'success' });
        }
      }
    });
  };

  const handleReject = () => {
    setShowRejectModal(true);
  };

  const confirmReject = () => {
    if (!appointment) return;
    
    if (!rejectReason.trim()) {
      Taro.showToast({ title: '请输入驳回原因', icon: 'none' });
      return;
    }

    rejectAppointment(appointment.id, rejectReason.trim());
    
    const updated = getAppointmentById(appointment.id);
    if (updated) setAppointment(updated);
    
    setShowRejectModal(false);
    setRejectReason('');
    Taro.showToast({ title: '已驳回', icon: 'none' });
  };

  const handleSign = () => {
    setDoctorSigned(true);
    Taro.showToast({ title: '签字成功', icon: 'success' });
  };

  const handleConsentChange = (checked: boolean) => {
    setAssessment(prev => ({
      ...prev,
      informedConsent: checked
    }));
  };

  if (!appointment) {
    return (
      <View style={{ padding: 100, textAlign: 'center', color: '#86909c' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const currentNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  const isPending = appointment.status === 'pending_approval';
  const showApproveButton = isPending;
  const showRejectButton = isPending;
  const isDoctorNode = currentNode?.type === 'doctor';

  return (
    <ScrollView className={styles.approvalDetailPage} scrollY>
      <View className={styles.section}>
        <View className={styles.sectionTitle}>
          <Text>{appointment.projectName}</Text>
          <StatusTag status={appointment.status} />
        </View>
        
        <View className={styles.infoList}>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>顾客</Text>
            <Text className={styles.infoContent}>
              {appointment.customerName}（{appointment.customerPhone}）
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>操作室</Text>
            <Text className={styles.infoContent}>{appointment.roomName}</Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>时间</Text>
            <Text className={styles.infoContent}>
              {appointment.date} {appointment.startTime}-{appointment.endTime}
            </Text>
          </View>
          <View className={styles.infoItem}>
            <Text className={styles.infoLabel}>咨询师</Text>
            <Text className={styles.infoContent}>{appointment.consultantName}</Text>
          </View>
        </View>

        {isPending && currentNode && (
          <View style={{ marginTop: 24, paddingTop: 24, borderTop: '1rpx solid #f2f3f5' }}>
            <View style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 28, color: '#4E5969' }}>当前节点</Text>
              <View className={styles.currentStep}>{currentNode.name}</View>
            </View>
          </View>
        )}

        {appointment.status === 'rejected' && appointment.approvalNodes.some(n => n.status === 'rejected') && (
          <View className={styles.rejectReason}>
            <Text className={styles.rejectReasonText}>
              驳回原因：{appointment.approvalNodes.find(n => n.status === 'rejected')?.comment || '无'}
            </Text>
          </View>
        )}
      </View>

      <View className={styles.section}>
        <ApprovalFlow 
          nodes={appointment.approvalNodes} 
          currentIndex={appointment.currentApprovalIndex} 
        />
      </View>

      {isDoctorNode && isPending && (
        <View className={styles.assessmentSection}>
          <Text className={styles.sectionTitle}>术前评估</Text>
          
          <View className={styles.assessmentForm}>
            <View className={styles.formItem}>
              <Text className={styles.formLabel}>既往病史</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="请输入顾客既往病史"
                value={assessment.medicalHistory}
                onInput={(e) => setAssessment(prev => ({ ...prev, medicalHistory: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>过敏史</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="请输入顾客过敏史"
                value={assessment.allergyHistory}
                onInput={(e) => setAssessment(prev => ({ ...prev, allergyHistory: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>当前用药</Text>
              <Input
                className={styles.formInput}
                placeholder="请输入当前使用药物"
                value={assessment.currentMedication}
                onInput={(e) => setAssessment(prev => ({ ...prev, currentMedication: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>体格检查</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="请输入体格检查结果"
                value={assessment.physicalExamination}
                onInput={(e) => setAssessment(prev => ({ ...prev, physicalExamination: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <Text className={styles.formLabel}>风险评估</Text>
              <Textarea
                className={styles.formTextarea}
                placeholder="请输入手术风险评估"
                value={assessment.riskAssessment}
                onInput={(e) => setAssessment(prev => ({ ...prev, riskAssessment: e.detail.value }))}
              />
            </View>

            <View className={styles.formItem}>
              <View 
                className={styles.checkboxItem}
                onClick={() => handleConsentChange(!assessment.informedConsent)}
              >
                <View className={classnames(styles.checkbox, assessment.informedConsent && styles.checked)}>
                  {assessment.informedConsent && '✓'}
                </View>
                <Text className={styles.checkboxLabel}>
                  顾客已签署知情同意书，了解手术风险
                </Text>
              </View>
            </View>
          </View>

          <View className={styles.signatureSection} style={{ marginTop: 24, padding: 0, boxShadow: 'none' }}>
            <Text className={styles.formLabel}>医生签字</Text>
            <View className={styles.signatureBox} onClick={handleSign}>
              {doctorSigned ? (
                <Text className={styles.signatureSigned}>{currentUser.name}</Text>
              ) : (
                <>
                  <Text className={styles.signatureIcon}>✍️</Text>
                  <Text className={styles.signatureText}>点击签字</Text>
                </>
              )}
            </View>
          </View>
        </View>
      )}

      {appointment.notes && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>备注信息</Text>
          <Text style={{ fontSize: 28, color: '#4E5969', lineHeight: 1.6 }}>{appointment.notes}</Text>
        </View>
      )}

      <View className={styles.bottomBar}>
        {showRejectButton && (
          <View className={classnames(styles.btn, styles.btnDanger)} onClick={handleReject}>
            驳回
          </View>
        )}
        {showApproveButton && (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleApprove}>
            通过审批
          </View>
        )}
        {!isPending && (
          <View className={classnames(styles.btn, styles.btnOutline)} style={{ flex: 1 }}>
            审批已完成
          </View>
        )}
      </View>

      {showRejectModal && (
        <View className={styles.rejectModal} onClick={() => setShowRejectModal(false)}>
          <View className={styles.rejectModalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>驳回原因</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder="请输入驳回原因"
              value={rejectReason}
              onInput={(e) => setRejectReason(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.modalActions}>
              <View 
                className={classnames(styles.modalBtn, styles.cancel)} 
                onClick={() => setShowRejectModal(false)}
              >
                取消
              </View>
              <View 
                className={classnames(styles.modalBtn, styles.confirm)} 
                onClick={confirmReject}
              >
                确认驳回
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default ApprovalDetailPage;
