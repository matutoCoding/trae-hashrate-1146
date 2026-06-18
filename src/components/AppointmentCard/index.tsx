import React from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import StatusTag from '@/components/StatusTag';
import type { Appointment } from '@/types';

interface AppointmentCardProps {
  appointment: Appointment;
  showCustomer?: boolean;
  onClick?: () => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  showCustomer = true,
  onClick 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/appointment-detail/index?id=${appointment.id}`
      });
    }
  };

  return (
    <View className={styles.appointmentCard} onClick={handleClick}>
      <View className={styles.cardHeader}>
        <Text className={styles.projectName}>{appointment.projectName}</Text>
        <StatusTag status={appointment.status} />
      </View>
      
      <View className={styles.cardBody}>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>操作室</Text>
          <Text className={styles.infoValue}>{appointment.roomName}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>日期</Text>
          <Text className={styles.infoValue}>{appointment.date}</Text>
        </View>
        <View className={styles.infoRow}>
          <Text className={styles.infoLabel}>时段</Text>
          <Text className={styles.infoValue}>
            {appointment.startTime} - {appointment.endTime}
          </Text>
        </View>
        {showCustomer && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>顾客</Text>
            <Text className={styles.infoValue}>
              {appointment.customerName}（{appointment.customerPhone}）
            </Text>
          </View>
        )}
        {appointment.executionInfo?.startTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>开始执行</Text>
            <Text className={styles.infoValue}>
              {new Date(appointment.executionInfo.startTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        {appointment.executionInfo?.completeTime && (
          <View className={styles.infoRow}>
            <Text className={styles.infoLabel}>完成时间</Text>
            <Text className={styles.infoValue}>
              {new Date(appointment.executionInfo.completeTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        )}
        {appointment.executionInfo?.notes && (
          <View className={styles.infoNotesRow}>
            <Text className={styles.infoNotesLabel}>执行备注</Text>
            <Text className={styles.infoNotesValue}>
              {appointment.executionInfo.notes}
            </Text>
          </View>
        )}
        {appointment.executionInfo?.completionNotes && (
          <View className={styles.infoNotesRow}>
            <Text className={styles.infoNotesLabel}>完成说明</Text>
            <Text className={styles.infoNotesValue}>
              {appointment.executionInfo.completionNotes}
            </Text>
          </View>
        )}
      </View>
      
      <View className={styles.cardFooter}>
        <View className={styles.customerInfo}>
          <Text className={styles.customerName}>
            咨询师：{appointment.consultantName}
          </Text>
          <Text className={styles.customerName}>
            医生：{appointment.doctorName}
          </Text>
          {appointment.executionInfo?.executingDoctor && appointment.executionInfo.executingDoctor !== appointment.doctorName && (
            <Text className={styles.customerName}>
              执行医生：{appointment.executionInfo.executingDoctor}
            </Text>
          )}
        </View>
        {!appointment.executionInfo?.startTime && (
          <Text className={styles.timeInfo}>
            {appointment.startTime} - {appointment.endTime}
          </Text>
        )}
      </View>
    </View>
  );
};

export default AppointmentCard;
