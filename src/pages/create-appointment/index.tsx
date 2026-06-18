import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Input, Textarea, ScrollView, Picker } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import styles from './index.module.scss';
import { useAppStore } from '@/store/appStore';
import classnames from 'classnames';
import { checkTimeOverlap, formatDate } from '@/utils';

const CreateAppointmentPage: React.FC = () => {
  const router = useRouter();
  const { rooms, projects, createAppointment, appointments, checkTimeConflict } = useAppStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);

  useEffect(() => {
    const { roomId, date, startTime: st, endTime: et } = router.params;
    if (roomId) setSelectedRoomId(roomId as string);
    if (date) setSelectedDate(date as string);
    if (st) setStartTime(st as string);
    if (et) setEndTime(et as string);
    
    if (!date) {
      setSelectedDate(formatDate(new Date()));
    }
  }, [router.params]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const selectedRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId);
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    if (selectedRoomId && selectedDate && startTime && endTime) {
      const conflict = checkTimeConflict(selectedRoomId, selectedDate, startTime, endTime);
      setHasConflict(conflict);
    } else {
      setHasConflict(false);
    }
  }, [selectedRoomId, selectedDate, startTime, endTime, checkTimeConflict]);

  const handleSubmit = () => {
    if (!customerName.trim()) {
      Taro.showToast({ title: '请输入顾客姓名', icon: 'none' });
      return;
    }
    if (!customerPhone.trim()) {
      Taro.showToast({ title: '请输入联系电话', icon: 'none' });
      return;
    }
    if (!selectedProjectId) {
      Taro.showToast({ title: '请选择项目', icon: 'none' });
      return;
    }
    if (!selectedRoomId) {
      Taro.showToast({ title: '请选择操作室', icon: 'none' });
      return;
    }
    if (!selectedDate) {
      Taro.showToast({ title: '请选择日期', icon: 'none' });
      return;
    }
    if (!startTime || !endTime) {
      Taro.showToast({ title: '请选择时段', icon: 'none' });
      return;
    }
    if (hasConflict) {
      Taro.showToast({ title: '该时段已被占用', icon: 'none' });
      return;
    }

    try {
      const appointment = createAppointment({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        projectId: selectedProjectId,
        projectName: selectedProject?.name || '',
        roomId: selectedRoomId,
        roomName: selectedRoom?.name || '',
        date: selectedDate,
        startTime,
        endTime,
        status: 'pending_approval',
        consultantName: '李咨询师',
        notes: notes.trim() || undefined,
        preOpAssessment: undefined
      });

      Taro.showToast({ title: '预约创建成功', icon: 'success' });
      
      setTimeout(() => {
        Taro.redirectTo({
          url: `/pages/appointment-detail/index?id=${appointment.id}`
        });
      }, 1500);
    } catch (error: any) {
      Taro.showToast({ title: error.message || '创建失败', icon: 'none' });
    }
  };

  const handleDateChange = (e: any) => {
    setSelectedDate(e.detail.value);
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setShowProjectPicker(false);
    
    const project = projects.find(p => p.id === projectId);
    if (project && startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + project.duration;
      const endHours = Math.floor(totalMinutes / 60);
      const endMinutes = totalMinutes % 60;
      setEndTime(`${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`);
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowRoomPicker(false);
  };

  const activeRooms = rooms.filter(r => r.status === 'active');

  return (
    <ScrollView className={styles.createPage} scrollY>
      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>顾客信息</Text>
        
        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            姓名
          </Text>
          <View className={styles.formValue}>
            <Input
              className={styles.formInput}
              placeholder="请输入顾客姓名"
              value={customerName}
              onInput={(e) => setCustomerName(e.detail.value)}
            />
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            电话
          </Text>
          <View className={styles.formValue}>
            <Input
              className={styles.formInput}
              type="number"
              placeholder="请输入联系电话"
              value={customerPhone}
              onInput={(e) => setCustomerPhone(e.detail.value)}
            />
          </View>
        </View>
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>项目信息</Text>
        
        <View className={styles.formItem} onClick={() => setShowProjectPicker(true)}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            项目
          </Text>
          <View className={styles.formValue}>
            <Text className={classnames(styles.selectValue, !selectedProjectId && styles.placeholder)}>
              {selectedProject ? selectedProject.name : '请选择项目'}
            </Text>
            <Text className={styles.selectArrow}>›</Text>
          </View>
        </View>

        {selectedProject && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>项目时长</Text>
            <View className={styles.formValue}>
              <Text className={styles.selectValue}>{selectedProject.duration} 分钟</Text>
            </View>
          </View>
        )}

        {selectedProject && (
          <View className={styles.formItem}>
            <Text className={styles.formLabel}>项目价格</Text>
            <View className={styles.formValue}>
              <Text className={styles.selectValue}>¥{selectedProject.price}</Text>
            </View>
          </View>
        )}
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>预约信息</Text>
        
        <View className={styles.formItem} onClick={() => setShowRoomPicker(true)}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            操作室
          </Text>
          <View className={styles.formValue}>
            <Text className={classnames(styles.selectValue, !selectedRoomId && styles.placeholder)}>
              {selectedRoom ? selectedRoom.name : '请选择操作室'}
            </Text>
            <Text className={styles.selectArrow}>›</Text>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            日期
          </Text>
          <View className={styles.formValue}>
            <Picker mode="date" value={selectedDate} onChange={handleDateChange}>
              <View className={styles.datePicker}>
                <Text className={classnames(styles.selectValue, !selectedDate && styles.placeholder)}>
                  {selectedDate || '请选择日期'}
                </Text>
                <Text className={styles.selectArrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            开始时间
          </Text>
          <View className={styles.formValue}>
            <Picker mode="time" value={startTime} onChange={(e) => setStartTime(e.detail.value)}>
              <View className={styles.datePicker}>
                <Text className={classnames(styles.selectValue, !startTime && styles.placeholder)}>
                  {startTime || '请选择开始时间'}
                </Text>
                <Text className={styles.selectArrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>

        <View className={styles.formItem}>
          <Text className={styles.formLabel}>
            <Text className={styles.formRequired}>*</Text>
            结束时间
          </Text>
          <View className={styles.formValue}>
            <Picker mode="time" value={endTime} onChange={(e) => setEndTime(e.detail.value)}>
              <View className={styles.datePicker}>
                <Text className={classnames(styles.selectValue, !endTime && styles.placeholder)}>
                  {endTime || '请选择结束时间'}
                </Text>
                <Text className={styles.selectArrow}>›</Text>
              </View>
            </Picker>
          </View>
        </View>

        {hasConflict && (
          <View className={styles.conflictWarning}>
            <Text>⚠️ 该时段已被预约，请选择其他时段</Text>
          </View>
        )}
      </View>

      <View className={styles.formSection}>
        <Text className={styles.sectionTitle}>备注信息</Text>
        <Textarea
          className={styles.formTextarea}
          placeholder="请输入备注信息（选填）"
          value={notes}
          onInput={(e) => setNotes(e.detail.value)}
          maxlength={200}
        />
      </View>

      {showProjectPicker && (
        <View 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowProjectPicker(false)}
        >
          <View 
            style={{ background: '#fff', width: '100%', maxHeight: '70%', borderRadius: '24rpx 24rpx 0 0', padding: '32rpx' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: '32rpx', fontWeight: 600, marginBottom: '24rpx' }}>选择项目</Text>
            <ScrollView scrollY style={{ maxHeight: '600rpx' }}>
              {projects.map(project => (
                <View 
                  key={project.id} 
                  className={styles.projectItem}
                  onClick={() => handleSelectProject(project.id)}
                >
                  <View className={styles.projectInfo}>
                    <Text className={styles.projectName}>{project.name}</Text>
                    <Text className={styles.projectMeta}>
                      {project.category} · {project.duration}分钟
                    </Text>
                  </View>
                  <Text className={styles.projectPrice}>¥{project.price}</Text>
                  {selectedProjectId === project.id && (
                    <View className={styles.selectedCheck}>✓</View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {showRoomPicker && (
        <View 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setShowRoomPicker(false)}
        >
          <View 
            style={{ background: '#fff', width: '100%', maxHeight: '70%', borderRadius: '24rpx 24rpx 0 0', padding: '32rpx' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: '32rpx', fontWeight: 600, marginBottom: '24rpx' }}>选择操作室</Text>
            <ScrollView scrollY style={{ maxHeight: '600rpx' }}>
              {activeRooms.map(room => (
                <View 
                  key={room.id} 
                  className={styles.projectItem}
                  onClick={() => handleSelectRoom(room.id)}
                >
                  <View className={styles.projectInfo}>
                    <Text className={styles.projectName}>{room.name}</Text>
                    <Text className={styles.projectMeta}>{room.type}</Text>
                  </View>
                  {selectedRoomId === room.id && (
                    <View className={styles.selectedCheck}>✓</View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <View className={styles.bottomBar}>
        <View 
          className={classnames(styles.submitBtn, hasConflict && styles.disabled)}
          onClick={handleSubmit}
        >
          提交预约
        </View>
      </View>
    </ScrollView>
  );
};

export default CreateAppointmentPage;
