import React, { useEffect, useState, useMemo } from 'react';
import { useDidShow, useDidHide } from '@tarojs/taro';
import './app.scss';
import { AppContext, getAppState, subscribe } from '@/store/appStore';
import {
  createAppointment,
  cancelAppointment,
  approveAppointment,
  rejectAppointment,
  resubmitAppointment,
  savePreOpAssessment,
  startExecution,
  completeAppointment,
  checkTimeConflict,
  getAppointmentById,
  isMyApprovalTurn,
  switchRole
} from '@/store/appStore';

function App(props) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      forceUpdate(n => n + 1);
    });
    return unsubscribe;
  }, []);

  useDidShow(() => {});
  useDidHide(() => {});

  const state = getAppState();

  const contextValue = useMemo(() => ({
    ...state,
    createAppointment,
    cancelAppointment,
    approveAppointment,
    rejectAppointment,
    resubmitAppointment,
    savePreOpAssessment,
    startExecution,
    completeAppointment,
    checkTimeConflict,
    getAppointmentById,
    isMyApprovalTurn,
    switchRole
  }), [state]);

  return (
    <AppContext.Provider value={contextValue}>
      {props.children}
    </AppContext.Provider>
  );
}

export default App;
