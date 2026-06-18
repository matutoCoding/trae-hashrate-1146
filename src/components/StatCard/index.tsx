import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';
import classnames from 'classnames';

interface StatCardProps {
  value: number | string;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, variant = 'primary', onClick }) => {
  return (
    <View className={classnames(styles.statCard, styles[variant])} onClick={onClick}>
      <Text className={styles.statValue}>{value}</Text>
      <Text className={styles.statLabel}>{label}</Text>
    </View>
  );
};

export default StatCard;
