import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Textarea } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import StatusTag from '@/components/StatusTag';
import ApprovalFlow from '@/components/ApprovalFlow';
import classnames from 'classnames';
import type { Appointment, OperationType, FollowUpResult, FollowUpRecord, FollowUpPlan } from '@/types';

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

const followUpResultLabel: Record<FollowUpResult, string> = {
  satisfied: '😀 满意',
  normal: '😐 一般',
  complain: '😠 投诉',
  serious: '🚨 严重'
};

const followUpResultColor: Record<FollowUpResult, string> = {
  satisfied: '#52c41a',
  normal: '#faad14',
  complain: '#fa541c',
  serious: '#ff4d4f'
};

const getTodayStr = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const AppointmentDetailPage: React.FC = () => {
  const router = useRouter();
  const {
    getAppointmentById,
    cancelAppointment,
    startExecution,
    completeAppointment,
    resubmitAppointment,
    currentUser,
    isMyApprovalTurn,
    createFollowUpPlan,
    completeFollowUp
  } = useAppStore();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [executionNotes, setExecutionNotes] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const [showCreateFollowUpModal, setShowCreateFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('');

  const [showCompleteFollowUpModal, setShowCompleteFollowUpModal] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState('');
  const [followUpResult, setFollowUpResult] = useState<FollowUpResult>('satisfied');
  const [feedback, setFeedback] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

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
    Taro.navigateTo({ url: `/pages/approval-detail/index?id=${appointment.id}` });
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

  const confirmStartExecution = () => {
    if (!appointment) return;
    const ok = startExecution(appointment.id, executionNotes || undefined);
    if (ok) {
      Taro.showToast({ title: '已开始执行', icon: 'success' });
      refreshAppointment();
      setShowExecutionModal(false);
      setExecutionNotes('');
    } else {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const confirmComplete = () => {
    if (!appointment) return;
    const ok = completeAppointment(appointment.id, completionNotes || undefined);
    if (ok) {
      Taro.showToast({ title: '已标记完成', icon: 'success' });
      refreshAppointment();
      setShowCompletionModal(false);
      setCompletionNotes('');
    } else {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  const openCreateFollowUp = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setFollowUpDate(`${y}-${m}-${day}`);
    setFollowUpTime('10:00');
    setShowCreateFollowUpModal(true);
  };

  const confirmCreateFollowUp = () => {
    if (!appointment || !followUpDate) {
      Taro.showToast({ title: '请选择回访日期', icon: 'none' });
      return;
    }
    const ok = createFollowUpPlan(appointment.id, followUpDate, followUpTime || undefined);
    if (ok) {
      Taro.showToast({ title: '回访计划已创建', icon: 'success' });
      refreshAppointment();
      setShowCreateFollowUpModal(false);
    } else {
      Taro.showToast({ title: '创建失败', icon: 'none' });
    }
  };

  const openCompleteFollowUp = (planId: string) => {
    setCurrentPlanId(planId);
    setFollowUpResult('satisfied');
    setFeedback('');
    setFollowUpNotes('');
    setNextFollowUpDate('');
    setShowCompleteFollowUpModal(true);
  };

  const confirmCompleteFollowUp = () => {
    if (!appointment || !currentPlanId) return;
    if (!feedback || feedback.trim().length === 0) {
      Taro.showToast({ title: '请填写顾客反馈', icon: 'none' });
      return;
    }
    const ok = completeFollowUp(
      currentPlanId,
      appointment.id,
      followUpResult,
      feedback,
      followUpNotes || undefined,
      nextFollowUpDate || undefined
    );
    if (ok) {
      Taro.showToast({ title: '回访处理完成', icon: 'success' });
      refreshAppointment();
      setShowCompleteFollowUpModal(false);
    } else {
      Taro.showToast({ title: '操作失败', icon: 'none' });
    }
  };

  if (!appointment) {
    return (
      <View style={{ padding: 100, textAlign: 'center', color: '#86909c' }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const canCancel = appointment.status !== 'cancelled' && appointment.status !== 'completed';
  const canResubmit = appointment.status === 'pending_approval' && isMyApprovalTurn(appointment);
  const wasRejected = appointment.approvalNodes.some(n => n.status === 'rejected');
  const currentApprovalNode = appointment.approvalNodes[appointment.currentApprovalIndex];
  const approvalNodeName = currentApprovalNode?.name || '已完成';
  const canCreateFollowUp = appointment.status === 'completed' || appointment.status === 'executing';

  const pendingFollowUpPlans: FollowUpPlan[] = [];
  const doneFollowUpPlans: FollowUpPlan[] = [];
  (appointment.followUpPlans || []).forEach(p => {
    if (p.status === 'pending') pendingFollowUpPlans.push(p);
    else doneFollowUpPlans.push(p);
  });
  const recordMap = new Map<string, FollowUpRecord>();
  (appointment.followUpRecords || []).forEach(r => recordMap.set(r.planId, r));

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
          {canResubmit && (
            <View className={classnames(styles.btn, styles.btnPrimary)} style={{ marginTop: 16 }} onClick={handleResubmit}>
              补充资料并重新提交
            </View>
          )}
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
              <Text className={styles.infoContent}>
                {appointment.preOpAssessment.assessmentDate
                  ? new Date(appointment.preOpAssessment.assessmentDate).toLocaleString('zh-CN')
                  : '无'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {appointment.executionInfo && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>执行信息</Text>
          <View className={styles.infoList}>
            {appointment.executionInfo.startTime && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>开始时间</Text>
                <Text className={styles.infoContent}>
                  {new Date(appointment.executionInfo.startTime).toLocaleString('zh-CN')}
                </Text>
              </View>
            )}
            {appointment.executionInfo.executingDoctor && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>执行医生</Text>
                <Text className={styles.infoContent}>{appointment.executionInfo.executingDoctor}</Text>
              </View>
            )}
            {appointment.executionInfo.executionNotes && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>执行备注</Text>
                <Text className={styles.infoContent}>{appointment.executionInfo.executionNotes}</Text>
              </View>
            )}
            {appointment.executionInfo.endTime && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>完成时间</Text>
                <Text className={styles.infoContent}>
                  {new Date(appointment.executionInfo.endTime).toLocaleString('zh-CN')}
                </Text>
              </View>
            )}
            {appointment.executionInfo.completionNotes && (
              <View className={styles.infoItem}>
                <Text className={styles.infoLabel}>完成说明</Text>
                <Text className={styles.infoContent}>{appointment.executionInfo.completionNotes}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {(appointment.followUpPlans && appointment.followUpPlans.length > 0) || canCreateFollowUp ? (
        <View className={styles.section}>
          <View className={styles.sectionHeader}>
            <Text className={styles.sectionTitle}>术后回访</Text>
            {canCreateFollowUp && (
              <Text
                className={styles.linkBtn}
                onClick={openCreateFollowUp}
              >
                + 创建回访计划
              </Text>
            )}
          </View>

          {pendingFollowUpPlans.length > 0 && (
            <>
              <View style={{ fontSize: 24, color: '#faad14', marginBottom: 12, marginTop: 8 }}>待回访</View>
              {pendingFollowUpPlans.map(plan => {
                const isToday = plan.plannedDate === getTodayStr();
                const isOverdue = plan.plannedDate < getTodayStr();
                return (
                  <View
                    key={plan.id}
                    style={{
                      padding: 16,
                      background: isToday ? '#fffbe6' : isOverdue ? '#fff2f0' : '#f2f3f5',
                      borderRadius: 8,
                      marginBottom: 12
                    }}
                  >
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 28, fontWeight: 600 }}>
                        📅 {plan.plannedDate} {plan.plannedTime || ''}
                      </Text>
                      <Text style={{ fontSize: 22, color: isToday ? '#faad14' : isOverdue ? '#ff4d4f' : '#86909c' }}>
                        {isToday ? '今日' : isOverdue ? '逾期' : '待处理'}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 24, color: '#4e5969' }}>
                      负责人：{plan.assignedTo || '未指派'}
                    </Text>
                    <View
                      className={classnames(styles.btn, styles.btnPrimary)}
                      style={{ marginTop: 12, width: 'auto', alignSelf: 'flex-start', padding: '8rpx 24rpx' }}
                      onClick={() => openCompleteFollowUp(plan.id)}
                    >
                      处理回访
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {doneFollowUpPlans.length > 0 && (
            <>
              <View style={{ fontSize: 24, color: '#52c41a', marginBottom: 12, marginTop: 12 }}>已完成回访</View>
              {doneFollowUpPlans.map(plan => {
                const record = recordMap.get(plan.id);
                return (
                  <View
                    key={plan.id}
                    style={{
                      padding: 16,
                      background: '#f6ffed',
                      borderRadius: 8,
                      marginBottom: 12
                    }}
                  >
                    <View style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={{ fontSize: 26, fontWeight: 600, color: '#52c41a' }}>
                        ✓ {plan.plannedDate} {plan.plannedTime || ''}
                      </Text>
                      {record && (
                        <Text style={{ fontSize: 24, color: followUpResultColor[record.result] }}>
                          {followUpResultLabel[record.result]}
                        </Text>
                      )}
                    </View>
                    {record && (
                      <>
                        <Text style={{ fontSize: 24, color: '#4e5969' }}>
                          反馈：{record.customerFeedback}
                        </Text>
                        <Text style={{ fontSize: 22, color: '#86909c', marginTop: 4 }}>
                          处理人：{record.handledBy} · {new Date(record.handledAt).toLocaleString('zh-CN')}
                        </Text>
                        {record.notes && (
                          <Text style={{ fontSize: 22, color: '#86909c', marginTop: 2 }}>
                            备注：{record.notes}
                          </Text>
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>
      ) : null}

      {appointment.notes && (
        <View className={styles.notesSection}>
          <Text className={styles.notesTitle}>备注信息</Text>
          <View className={styles.notesContent}>
            <Text>{appointment.notes}</Text>
          </View>
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
        {canCancel && (
          <View className={classnames(styles.btn, styles.btnDanger)} onClick={handleCancel}>
            取消预约
          </View>
        )}
        {appointment.status === 'pending_approval' && isMyApprovalTurn(appointment) && !wasRejected && (
          <View className={classnames(styles.btn, styles.btnPrimary)} onClick={handleApproval}>
            去审批
          </View>
        )}
        {appointment.status === 'pending_approval' && !isMyApprovalTurn(appointment) && (
          <View className={classnames(styles.btn, styles.btnOutline)} style={{ flex: 1 }}>
            等待{approvalNodeName}
          </View>
        )}
        {(appointment.status === 'approved' || appointment.status === 'confirmed') && (
          <View
            className={classnames(styles.btn, styles.btnSuccess)}
            onClick={() => setShowExecutionModal(true)}
          >
            开始执行
          </View>
        )}
        {appointment.status === 'executing' && (
          <View
            className={classnames(styles.btn, styles.btnSuccess)}
            onClick={() => setShowCompletionModal(true)}
          >
            标记完成
          </View>
        )}
        {appointment.status === 'completed' && (
          <View
            className={classnames(styles.btn, styles.btnOutline)}
            style={{ flex: 1 }}
            onClick={openCreateFollowUp}
          >
            创建回访
          </View>
        )}
      </View>

      {showExecutionModal && (
        <View className={styles.modal} onClick={() => setShowExecutionModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>开始执行</Text>
            <Text className={styles.modalDesc}>确认开始执行该预约项目</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder="请输入执行备注（可选）"
              value={executionNotes}
              onInput={(e) => setExecutionNotes(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowExecutionModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.modalBtn, styles.confirmGreen)}
                onClick={confirmStartExecution}
              >
                确认开始
              </View>
            </View>
          </View>
        </View>
      )}

      {showCompletionModal && (
        <View className={styles.modal} onClick={() => setShowCompletionModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>标记完成</Text>
            <Text className={styles.modalDesc}>确认该预约项目已完成</Text>
            <Textarea
              className={styles.modalTextarea}
              placeholder="请输入完成说明（可选）"
              value={completionNotes}
              onInput={(e) => setCompletionNotes(e.detail.value)}
              maxlength={200}
            />
            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowCompletionModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.modalBtn, styles.confirmGreen)}
                onClick={confirmComplete}
              >
                确认完成
              </View>
            </View>
          </View>
        </View>
      )}

      {showCreateFollowUpModal && (
        <View className={styles.modal} onClick={() => setShowCreateFollowUpModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>创建回访计划</Text>
            <Text className={styles.modalDesc}>为该顾客安排术后回访</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>回访日期</Text>
              <input
                type="date"
                style={{ width: '100%', padding: 16, border: '1rpx solid #e5e6eb', borderRadius: 8, fontSize: 28 }}
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>回访时间</Text>
              <input
                type="time"
                style={{ width: '100%', padding: 16, border: '1rpx solid #e5e6eb', borderRadius: 8, fontSize: 28 }}
                value={followUpTime}
                onChange={(e) => setFollowUpTime(e.target.value)}
              />
            </View>
            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowCreateFollowUpModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.modalBtn, styles.confirmGreen)}
                onClick={confirmCreateFollowUp}
              >
                创建
              </View>
            </View>
          </View>
        </View>
      )}

      {showCompleteFollowUpModal && (
        <View className={styles.modal} onClick={() => setShowCompleteFollowUpModal(false)}>
          <View className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <Text className={styles.modalTitle}>处理回访</Text>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>回访结果</Text>
              <View style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {(['satisfied', 'normal', 'complain', 'serious'] as FollowUpResult[]).map(r => (
                  <Text
                    key={r}
                    onClick={() => setFollowUpResult(r)}
                    style={{
                      padding: '8rpx 20rpx',
                      borderRadius: 48,
                      fontSize: 26,
                      background: followUpResult === r ? followUpResultColor[r] : '#f2f3f5',
                      color: followUpResult === r ? '#fff' : '#4e5969'
                    }}
                  >
                    {followUpResultLabel[r]}
                  </Text>
                ))}
              </View>
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>顾客反馈（必填）</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder="请填写顾客的实际反馈"
                value={feedback}
                onInput={(e) => setFeedback(e.detail.value)}
                maxlength={300}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>处理备注</Text>
              <Textarea
                className={styles.modalTextarea}
                placeholder="请填写处理备注（可选）"
                value={followUpNotes}
                onInput={(e) => setFollowUpNotes(e.detail.value)}
                maxlength={200}
              />
            </View>
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 26, color: '#4e5969', marginBottom: 8, display: 'block' }}>下次回访日期（可选）</Text>
              <input
                type="date"
                style={{ width: '100%', padding: 16, border: '1rpx solid #e5e6eb', borderRadius: 8, fontSize: 28 }}
                value={nextFollowUpDate}
                onChange={(e) => setNextFollowUpDate(e.target.value)}
              />
            </View>
            <View className={styles.modalActions}>
              <View
                className={classnames(styles.modalBtn, styles.cancel)}
                onClick={() => setShowCompleteFollowUpModal(false)}
              >
                取消
              </View>
              <View
                className={classnames(styles.modalBtn, styles.confirmGreen)}
                onClick={confirmCompleteFollowUp}
              >
                完成回访
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

export default AppointmentDetailPage;
