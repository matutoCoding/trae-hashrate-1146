import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';
import type { ApprovalNode } from '@/types';

interface ApprovalFlowProps {
  nodes: ApprovalNode[];
  currentIndex: number;
}

const ApprovalFlow: React.FC<ApprovalFlowProps> = ({ nodes, currentIndex }) => {
  const getStepIcon = (status: string, index: number) => {
    if (status === 'approved') return '✓';
    if (status === 'rejected') return '✕';
    return String(index + 1);
  };

  return (
    <View className={styles.approvalFlow}>
      <Text className={styles.flowTitle}>审批流程</Text>
      <View className={styles.flowSteps}>
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const isActive = index < currentIndex || node.status === 'approved';
          
          return (
            <View
              key={node.type}
              className={classnames(styles.step, isLast && styles.lastStep)}
            >
              <View
                className={classnames(
                  styles.stepIcon,
                  styles[node.status]
                )}
              >
                {getStepIcon(node.status, index)}
              </View>
              <Text className={styles.stepName}>{node.name}</Text>
              <Text className={styles.stepInfo}>
                {node.operatorName ? node.operatorName : node.status === 'pending' ? '待处理' : '未开始'}
              </Text>
              {!isLast && (
                <View
                  className={classnames(
                    styles.stepLine,
                    isActive && styles.stepLineActive
                  )}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default ApprovalFlow;
