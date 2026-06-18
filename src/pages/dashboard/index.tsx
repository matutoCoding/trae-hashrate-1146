import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import type { DateRange } from '@/types';

const formatMoney = (n: number) => `¥${n.toLocaleString('zh-CN')}`;

type RangePreset = 'today' | '7d' | '30d' | 'month' | 'custom';

const DashboardPage: React.FC = () => {
  const { currentUser, getDashboardOverview, getProjectStats, getDoctorStats, getRoomStats } = useAppStore();

  const [preset, setPreset] = useState<RangePreset>('7d');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  React.useEffect(() => {
    if (currentUser.role !== 'director' && currentUser.role !== 'admin') {
      Taro.showToast({ title: '仅院长/管理员可查看', icon: 'none' });
      setTimeout(() => Taro.navigateBack(), 800);
    }
    Taro.setNavigationBarTitle({ title: '经营看板' });
  }, [currentUser]);

  const computeRange = (p: RangePreset): DateRange | undefined => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (p === 'today') {
      const ymd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      return { start: ymd, end: ymd };
    }
    if (p === '7d') {
      const from = new Date(today.getTime() - 6 * 86400000);
      return {
        start: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`,
        end: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      };
    }
    if (p === '30d') {
      const from = new Date(today.getTime() - 29 * 86400000);
      return {
        start: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-${String(from.getDate()).padStart(2, '0')}`,
        end: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      };
    }
    if (p === 'month') {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return {
        start: `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, '0')}-01`,
        end: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      };
    }
    if (p === 'custom' && startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    return undefined;
  };

  const range = useMemo(() => computeRange(preset), [preset, startDate, endDate]);
  const overview = useMemo(() => getDashboardOverview(range), [getDashboardOverview, range]);
  const projectStats = useMemo(() => getProjectStats(range), [getProjectStats, range]);
  const doctorStats = useMemo(() => getDoctorStats(range), [getDoctorStats, range]);
  const roomStats = useMemo(() => getRoomStats(range), [getRoomStats, range]);

  const presets: { key: RangePreset; label: string }[] = [
    { key: 'today', label: '今日' },
    { key: '7d', label: '近7天' },
    { key: '30d', label: '近30天' },
    { key: 'month', label: '本月' },
    { key: 'custom', label: '自定义' }
  ];

  const gotoList = (filter: { projectName?: string; doctorName?: string; roomName?: string }) => {
    const qs = Object.entries(filter)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    Taro.switchTab({
      url: `/pages/schedule/index`,
      success: () => {
        setTimeout(() => {
          Taro.showToast({ title: `筛选条件：${qs || '无'}`, icon: 'none' });
        }, 200);
      }
    });
  };

  return (
    <ScrollView scrollY className={styles.dashboardPage}>
      <View className={styles.filterBar}>
        <ScrollView scrollX className={styles.presetScroll}>
          <View className={styles.presetGroup}>
            {presets.map(p => (
              <View
                key={p.key}
                className={`${styles.presetBtn} ${preset === p.key ? styles.presetActive : ''}`}
                onClick={() => setPreset(p.key)}
              >
                {p.label}
              </View>
            ))}
          </View>
        </ScrollView>

        {preset === 'custom' && (
          <View className={styles.customRange}>
            <View className={styles.datePicker}>
              <Text className={styles.dateLabel}>开始</Text>
              <InputDate value={startDate} onChange={setStartDate} />
            </View>
            <View className={styles.datePicker}>
              <Text className={styles.dateLabel}>结束</Text>
              <InputDate value={endDate} onChange={setEndDate} />
            </View>
          </View>
        )}

        {range && (
          <View className={styles.rangeHint}>
            {range.start} ～ {range.end}
          </View>
        )}
      </View>

      <View className={styles.overviewSection}>
        <Text className={styles.sectionTitle}>总体概览</Text>
        <View className={styles.overviewGrid}>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue}>{overview.totalBookings}</Text>
            <Text className={styles.overviewLabel}>预约总量</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue} style={{ color: '#52c41a' }}>{overview.completedBookings}</Text>
            <Text className={styles.overviewLabel}>完成量</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue} style={{ color: '#fa541c' }}>{overview.cancelledBookings}</Text>
            <Text className={styles.overviewLabel}>取消量</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue} style={{ color: '#1890ff' }}>{formatMoney(overview.totalRevenue)}</Text>
            <Text className={styles.overviewLabel}>完成收入</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue} style={{ color: '#722ed1' }}>{overview.completionRate}%</Text>
            <Text className={styles.overviewLabel}>完成率</Text>
          </View>
          <View className={styles.overviewCard}>
            <Text className={styles.overviewValue} style={{ color: '#13c2c2' }}>{overview.avgOrderValue ? formatMoney(overview.avgOrderValue) : '—'}</Text>
            <Text className={styles.overviewLabel}>客单价</Text>
          </View>
        </View>
      </View>

      <View className={styles.statsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>按项目统计</Text>
          <Text className={styles.countHint}>{projectStats.length} 个项目</Text>
        </View>
        {projectStats.length > 0 ? (
          projectStats.map(stat => (
            <View key={stat.projectName} className={styles.statRow} onClick={() => gotoList({ projectName: stat.projectName })}>
              <View className={styles.statMain}>
                <Text className={styles.statName}>💉 {stat.projectName}</Text>
                <View className={styles.statTags}>
                  <Text className={`${styles.statTag} ${styles.tagPrimary}`}>预约 {stat.totalBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagSuccess}`}>完成 {stat.completedBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagError}`}>取消 {stat.cancelledBookings}</Text>
                </View>
              </View>
              <View className={styles.statRevenue}>
                <Text className={styles.revenueLabel}>收入</Text>
                <Text className={styles.revenueValue}>{formatMoney(stat.revenue)}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyHint text="暂无数据" />
        )}
      </View>

      <View className={styles.statsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>按医生统计</Text>
          <Text className={styles.countHint}>{doctorStats.length} 位医生</Text>
        </View>
        {doctorStats.length > 0 ? (
          doctorStats.map(stat => (
            <View key={stat.doctorName} className={styles.statRow} onClick={() => gotoList({ doctorName: stat.doctorName })}>
              <View className={styles.statMain}>
                <Text className={styles.statName}>👨‍⚕️ {stat.doctorName}</Text>
                <View className={styles.statTags}>
                  <Text className={`${styles.statTag} ${styles.tagPrimary}`}>预约 {stat.totalBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagSuccess}`}>完成 {stat.completedBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagError}`}>取消 {stat.cancelledBookings}</Text>
                </View>
              </View>
              <View className={styles.statRevenue}>
                <Text className={styles.revenueLabel}>收入</Text>
                <Text className={styles.revenueValue}>{formatMoney(stat.revenue)}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyHint text="暂无数据" />
        )}
      </View>

      <View className={styles.statsSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.sectionTitle}>按操作室统计</Text>
          <Text className={styles.countHint}>{roomStats.length} 间操作室</Text>
        </View>
        {roomStats.length > 0 ? (
          roomStats.map(stat => (
            <View key={stat.roomName} className={styles.statRow} onClick={() => gotoList({ roomName: stat.roomName })}>
              <View className={styles.statMain}>
                <Text className={styles.statName}>🏥 {stat.roomName}</Text>
                <View className={styles.statTags}>
                  <Text className={`${styles.statTag} ${styles.tagPrimary}`}>预约 {stat.totalBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagSuccess}`}>完成 {stat.completedBookings}</Text>
                  <Text className={`${styles.statTag} ${styles.tagError}`}>取消 {stat.cancelledBookings}</Text>
                </View>
              </View>
              <View className={styles.statRevenue}>
                <Text className={styles.revenueLabel}>收入</Text>
                <Text className={styles.revenueValue}>{formatMoney(stat.revenue)}</Text>
              </View>
            </View>
          ))
        ) : (
          <EmptyHint text="暂无数据" />
        )}
      </View>
    </ScrollView>
  );
};

const EmptyHint: React.FC<{ text: string }> = ({ text }) => (
  <View className={styles.emptyHint}>
    <Text className={styles.emptyIcon}>📊</Text>
    <Text className={styles.emptyText}>{text}</Text>
  </View>
);

const InputDate: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const picker = (e: any) => onChange(e.detail.value);
  return (
    <View className={styles.inputDate}>
      <View
        className={`${styles.inputBox} ${!value ? styles.placeholder : ''}`}
        onClick={() => {
          const today = new Date();
          const initial = value || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
          (Taro as any).showActionSheet({
            itemList: ['使用系统日期选择器'],
            success: (r: any) => {
              if (r.tapIndex === 0) {
                const date = (Taro as any).showModal({
                  title: '请输入日期',
                  editable: true,
                  placeholderText: initial,
                  success: (res: any) => {
                    if (res.confirm && res.content) onChange(res.content.trim());
                  }
                });
              }
            }
          });
        }}
      >
        <Text className={value ? styles.inputValue : styles.placeholderText}>
          {value || '点击选择'}
        </Text>
      </View>
    </View>
  );
};

export default DashboardPage;
