import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatusTagProps {
  status: string;
  text?: string;
}

const statusMap: Record<string, { text: string; className: string }> = {
  pending: { text: '待处理', className: styles.pending },
  approved: { text: '已通过', className: styles.approved },
  rejected: { text: '已驳回', className: styles.rejected },
  confirmed: { text: '已确认', className: styles.confirmed },
  executing: { text: '执行中', className: styles.executing },
  completed: { text: '已完成', className: styles.completed },
  cancelled: { text: '已取消', className: styles.cancelled },
  pending_approval: { text: '待审批', className: styles.pendingApproval },
  draft: { text: '未开始', className: styles.cancelled }
};

const StatusTag: React.FC<StatusTagProps> = ({ status, text }) => {
  const info = statusMap[status] || { text: status, className: styles.pending };
  
  return (
    <View className={classnames(styles.statusTag, info.className)}>
      {text || info.text}
    </View>
  );
};

export default StatusTag;
