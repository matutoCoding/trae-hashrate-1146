import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Textarea, Input } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import ApprovalFlow from '@/components/ApprovalFlow';
import classnames from 'classnames';
import type { Appointment, PreOpAssessment, OperationType } from '@/types';

const operationTypeLabel: Record<OperationType, string> = {
  create: '创建预约',
  approve: '审批通过',
  reject: '审批驳回',
  resubmit: '重新提交',
  start_execution: '开始执行',
  complete: '标记完成',
  cancel: '取消预约',
  create_followup: '创建回访',
  complete_followup: '完成回访'
};

const operationTypeIcon: Record<OperationType, string> = {
  create: '📝',
  approve: '✅',
  reject: '❌',
  resubmit: '🔄',
  start_execution: '▶️',
  complete: '🎉',
  cancel: '🚫',
  create_followup: '📞',
  complete_followup: '✓'
};

const operationTypeColor: Record<OperationType, string> = {
  create: '#1890ff',
  approve: '#52c41a',
  reject: '#ff4d4f',
  resubmit: '#faad14',
  start_execution: '#722ed1',
  complete: '#52c41a',
  cancel: '#86909c',
  create_followup: '#13c2c2',
  complete_followup: '#52c41a'
};

const ApprovalDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getAppointmentById,
    approveAppointment,
    rejectAppointment,
    resubmitAppointment,
    savePreOpAssessment,
    currentUser,
    isMyApprovalTurn,
    checkPreOpAssessmentComplete
  } = useAppStore();

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
          setDoctorSigned(!!apt.preOpAssessment.doctorSignature);
        }
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

  const canOperate = appointment ? isMyApprovalTurn(appointment) : false;
  const currentNode = appointment?.approvalNodes[appointment.currentApprovalIndex];
  const isDoctorNode = currentNode?.type === 'doctor';
  const isPending = appointment?.status === 'pending_approval';
  const wasRejected = appointment?.approvalNodes.some(n => n.status === 'rejected') || false;

  const handleApprove = () => {
    if (!appointment || !canOperate) return;

    if (isDoctorNode) {
      const assessWithSig: PreOpAssessment = {
        ...assessment,
        doctorSignature: doctorSigned ? currentUser.name : undefined
      };
      const check = checkPreOpAssessmentComplete(assessWithSig);
      if (!check.ok) {
        Taro.showToast({ title: check.missing || '请先完成术前评估', icon: 'none' });
        return;
      }
      savePreOpAssessment(appointment.id, assessWithSig, currentUser.name);
    }

    Taro.showModal({
      title: '确认通过',
      content: `确定要通过${currentNode?.name || '审批'}吗？`,
      success: (res) => {
        if (res.confirm) {
          const comment = isDoctorNode ? '术前评估完成，同意手术' : '审核通过';
          const ok = approveAppointment(appointment.id, comment);
          if (ok) {
            Taro.showToast({ title: '已通过', icon: 'success' });
            refreshAppointment();
          } else {
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
        }
      }
    });
  };

  const handleResubmit = () => {
    if (!appointment || !canOperate) return;

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
            Taro.showToast({ title: '操作失败', icon: 'none' });
          }
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

    const ok = rejectAppointment(appointment.id, rejectReason.trim());
    if (ok) {
      refreshAppointment();
      setShowRejectModal(false);
      setRejectReason('');
      Taro.showToast({ title: '已驳回，退回上一环节', icon: 'none' });
    } else {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const handleSign = () => {
    setDoctorSigned(true);
    Taro.showToast({ title: '签字成功', icon: 'success' });
  };

  const handleConsentChange = (checked: boolean) => {
    setAssessment(prev => ({ ...prev, informedConsent: checked }));
  };

  if (!appointment) {
    return (
      <View style={{ padding: 100, textAlign: 'center', color: '#86909c' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const savedAssessment = appointment.preOpAssessment;
  const showAssessmentForm = isDoctorNode && canOperate && isPending;
  const showAssessmentView = savedAssessment && !showAssessmentForm;

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
            {canOperate && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 24, color: '#1890ff' }}>✓ 轮到您审批</Text>
              </View>
            )}
            {!canOperate && (
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 24, color: '#86909c' }}>等待{currentNode.name}处理</Text>
              </View>
            )}
          </View>
        )}

        {wasRejected && (
          <View className={styles.rejectReason}>
            <Text className={styles.rejectReasonText}>
              驳回原因：{appointment.approvalNodes.find(n => n.status === 'rejected')?.comment || '无'}
              {'\n'}驳回人：{appointment.approvalNodes.find(n => n.status === 'rejected')?.operatorName || '无'}
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

      {showAssessmentForm && (
        <View className={styles.assessmentSection}>
          <Text className={styles.sectionTitle}>术前评估（需填写）</Text>

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
            <Text className={styles.formLabel}>医生签字（必须签字才能通过）</Text>
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

      {showAssessmentView && (
        <View className={styles.assessmentSection}>
          <Text className={styles.sectionTitle}>术前评估记录</Text>

          <View className={styles.infoList}>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>既往病史</Text>
              <Text className={styles.infoContent}>{savedAssessment.medicalHistory || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>过敏史</Text>
              <Text className={styles.infoContent}>{savedAssessment.allergyHistory || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>当前用药</Text>
              <Text className={styles.infoContent}>{savedAssessment.currentMedication || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>体格检查</Text>
              <Text className={styles.infoContent}>{savedAssessment.physicalExamination || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>风险评估</Text>
              <Text className={styles.infoContent}>{savedAssessment.riskAssessment || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>知情同意</Text>
              <Text className={styles.infoContent}>
                {savedAssessment.informedConsent ? '✓ 已签署' : '未签署'}
              </Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>医生签字</Text>
              <Text className={styles.infoContent}>{savedAssessment.doctorSignature || '无'}</Text>
            </View>
            <View className={styles.infoItem}>
              <Text className={styles.infoLabel}>评估日期</Text>
              <Text className={styles.infoContent}>{savedAssessment.assessmentDate || '无'}</Text>
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

      {appointment.operationLogs && appointment.operationLogs.length > 0 && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>操作日志</Text>
          <View className={styles.logTimeline}>
            {appointment.operationLogs.map((log, idx) => (
              <View key={log.id} className={styles.logItem}>
                <View className={styles.logDot} style={{ background: operationTypeColor[log.type] }}>
                  <Text style={{ fontSize: 20 }}>{operationTypeIcon[log.type]}</Text>
                </View>
                {idx < appointment.operationLogs.length - 1 && (
                  <View className={styles.logLine} />
                )}
                <View className={styles.logContent}>
                  <View className={styles.logHeader}>
                    <Text className={styles.logType} style={{ color: operationTypeColor[log.type] }}>
                      {operationTypeLabel[log.type]}
                    </Text>
                    <Text className={styles.logTime}>
                      {log.operatedAt ? new Date(log.operatedAt).toLocaleString('zh-CN') : ''}
                    </Text>
                  </View>
                  <Text className={styles.logOperator}>
                    {log.operatorName}{log.operatorRole ? `（${log.operatorRole}）` : ''}
                  </Text>
                  {log.comment && (
                    <Text className={styles.logComment}>{log.comment}</Text>
                  )}
                  {log.details && (
                    <Text className={styles.logDetails}>{log.details}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        {canOperate && isPending && (
          <>
            <View className={classnames(styles.btn, styles.btnDanger)} onClick={handleReject}>
              驳回
            </View>
            {wasRejected ? (
              <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleResubmit}>
                重新提交
              </View>
            ) : (
              <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleApprove}>
                通过审批
              </View>
            )}
          </>
        )}
        {!canOperate && isPending && (
          <View className={classnames(styles.btn, styles.btnOutline)} style={{ flex: 1 }}>
            等待{currentNode?.name || '他人'}处理
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
              placeholder="请输入驳回原因，驳回后将退回上一环节"
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
