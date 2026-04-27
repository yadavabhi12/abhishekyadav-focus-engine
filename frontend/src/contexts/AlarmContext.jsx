// src/contexts/AlarmContext.jsx
import { createContext, useContext, useReducer, useEffect } from 'react'
import { alarmService } from '../services/alarms'
import { useAuth } from './AuthContext'
import { toast } from 'react-hot-toast'

const AlarmContext = createContext()

const alarmReducer = (state, action) => {
  switch (action.type) {
    case 'SET_ALARMS':
      return { ...state, alarms: action.payload, loading: false }
    case 'ADD_ALARM':
      return { ...state, alarms: [...state.alarms, action.payload] }
    case 'UPDATE_ALARM':
      return {
        ...state,
        alarms: state.alarms.map(alarm =>
          alarm._id === action.payload._id ? action.payload : alarm
        )
      }
    case 'DELETE_ALARM':
      return {
        ...state,
        alarms: state.alarms.filter(alarm => alarm._id !== action.payload)
      }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

const initialState = {
  alarms: [],
  loading: false,
  error: null
}

export const AlarmProvider = ({ children }) => {
  const [state, dispatch] = useReducer(alarmReducer, initialState)
  const { user, token } = useAuth()

  useEffect(() => {
    if (user && token) {
      loadUpcomingAlarms()
    }
  }, [user, token])

  const loadUpcomingAlarms = async () => {
    if (!token) return
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await alarmService.getUpcomingAlarms()
      dispatch({ type: 'SET_ALARMS', payload: response.alarms || [] })
    } catch (error) {
      console.error('Error loading upcoming alarms:', error)
      // Don't show error for unauthorized requests
      if (error.response?.status !== 401) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    }
  }

  const loadActiveAlarms = async () => {
    if (!token) return
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      const response = await alarmService.getActiveAlarms()
      dispatch({ type: 'SET_ALARMS', payload: response.alarms || [] })
    } catch (error) {
      console.error('Error loading active alarms:', error)
      if (error.response?.status !== 401) {
        dispatch({ type: 'SET_ERROR', payload: error.message })
      }
    }
  }

  const snoozeAlarm = async (alarmId, minutes) => {
    try {
      const response = await alarmService.snoozeAlarm(alarmId, minutes)
      dispatch({ type: 'UPDATE_ALARM', payload: response.alarm })
      toast.success('Alarm snoozed successfully')
      return response.alarm
    } catch (error) {
      console.error('Error snoozing alarm:', error)
      toast.error('Failed to snooze alarm')
      throw error
    }
  }

  const dismissAlarm = async (alarmId) => {
    try {
      await alarmService.dismissAlarm(alarmId)
      dispatch({ type: 'DELETE_ALARM', payload: alarmId })
      toast.success('Alarm dismissed')
    } catch (error) {
      console.error('Error dismissing alarm:', error)
      toast.error('Failed to dismiss alarm')
      throw error
    }
  }

  const deleteAlarm = async (alarmId) => {
    try {
      await alarmService.deleteAlarm(alarmId)
      dispatch({ type: 'DELETE_ALARM', payload: alarmId })
      toast.success('Alarm deleted')
    } catch (error) {
      console.error('Error deleting alarm:', error)
      toast.error('Failed to delete alarm')
      throw error
    }
  }

  const setAlarm = async (taskId, alarmData) => {
    try {
      const response = await alarmService.setAlarm(taskId, alarmData)
      dispatch({ type: 'ADD_ALARM', payload: response.alarm })
      toast.success('Alarm set successfully')
      return response.alarm
    } catch (error) {
      console.error('Error setting alarm:', error)
      toast.error('Failed to set alarm')
      throw error
    }
  }

  const updateAlarm = async (alarmId, alarmData) => {
    try {
      const response = await alarmService.updateAlarm(alarmId, alarmData)
      dispatch({ type: 'UPDATE_ALARM', payload: response.alarm })
      toast.success('Alarm updated successfully')
      return response.alarm
    } catch (error) {
      console.error('Error updating alarm:', error)
      toast.error('Failed to update alarm')
      throw error
    }
  }

  const value = {
    alarms: state.alarms,
    loading: state.loading,
    error: state.error,
    loadUpcomingAlarms,
    loadActiveAlarms,
    snoozeAlarm,
    dismissAlarm,
    deleteAlarm,
    setAlarm,
    updateAlarm
  }

  return (
    <AlarmContext.Provider value={value}>
      {children}
    </AlarmContext.Provider>
  )
}

export const useAlarms = () => {
  const context = useContext(AlarmContext)
  if (!context) {
    throw new Error('useAlarms must be used within an AlarmProvider')
  }
  return context
}








// import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { useWebSocket } from './WebSocketContext';
// import { alarmService } from '../services/alarms';
// import { useAuth } from './AuthContext';

// const AlarmContext = createContext();

// const alarmReducer = (state, action) => {
//   switch (action.type) {
//     case 'ADD_ALARM':
//       // Check if alarm already exists
//       if (state.activeAlarms.some(alarm => alarm.id === action.payload.id)) {
//         return state;
//       }
//       return { ...state, activeAlarms: [...state.activeAlarms, action.payload] };
//     case 'REMOVE_ALARM':
//       return {
//         ...state,
//         activeAlarms: state.activeAlarms.filter(alarm => alarm.id !== action.payload)
//       };
//     case 'CLEAR_ALARMS':
//       return { ...state, activeAlarms: [] };
//     case 'SET_UPCOMING_ALARMS':
//       return { ...state, upcomingAlarms: action.payload };
//     case 'SNOOZE_ALARM':
//       return {
//         ...state,
//         activeAlarms: state.activeAlarms.filter(alarm => alarm.id !== action.payload.alarmId),
//         snoozedAlarms: [...state.snoozedAlarms, { 
//           alarmId: action.payload.alarmId, 
//           until: action.payload.until 
//         }]
//       };
//     default:
//       return state;
//   }
// };

// const initialState = {
//   activeAlarms: [],
//   upcomingAlarms: [],
//   snoozedAlarms: []
// };

// export const AlarmProvider = ({ children }) => {
//   const [state, dispatch] = useReducer(alarmReducer, initialState);
//   const { socket, isConnected } = useWebSocket();
//   const { user } = useAuth();

//   useEffect(() => {
//     if (socket && isConnected) {
//       // Listen for alarm events
//       const handleAlarmTriggered = (data) => {
//         console.log('Alarm triggered received:', data);
//         if (data.type === 'ALARM_TRIGGERED' && data.alarm) {
//           dispatch({ type: 'ADD_ALARM', payload: data.alarm });
//         }
//       };

//       socket.on('alarm', handleAlarmTriggered);
//       socket.on('alarm_notification', handleAlarmTriggered);

//       // Clean up on unmount
//       return () => {
//         socket.off('alarm', handleAlarmTriggered);
//         socket.off('alarm_notification', handleAlarmTriggered);
//       };
//     }
//   }, [socket, isConnected]);

//   useEffect(() => {
//     // Load upcoming alarms on mount
//     loadUpcomingAlarms();
//   }, []);

//   const loadUpcomingAlarms = async () => {
//     try {
//       const response = await alarmService.getUpcomingAlarms();
//       dispatch({ type: 'SET_UPCOMING_ALARMS', payload: response.alarms });
//     } catch (error) {
//       console.error('Error loading upcoming alarms:', error);
//     }
//   };

//   const dismissAlarm = async (alarmId) => {
//     try {
//       // Find the task ID from alarm
//       const alarm = state.activeAlarms.find(a => a.id === alarmId);
//       if (alarm && alarm.taskId) {
//         await alarmService.dismissAlarm(alarm.taskId);
//       }
//       dispatch({ type: 'REMOVE_ALARM', payload: alarmId });
//     } catch (error) {
//       console.error('Error dismissing alarm:', error);
//     }
//   };

//   const snoozeAlarm = async (alarmId, minutes = 5) => {
//     try {
//       // Find the task ID from alarm
//       const alarm = state.activeAlarms.find(a => a.id === alarmId);
//       if (alarm && alarm.taskId) {
//         await alarmService.snoozeAlarm(alarm.taskId, minutes);
        
//         // Calculate snooze until time
//         const until = new Date();
//         until.setMinutes(until.getMinutes() + minutes);
        
//         dispatch({ 
//           type: 'SNOOZE_ALARM', 
//           payload: { alarmId, until } 
//         });
//       }
//     } catch (error) {
//       console.error('Error snoozing alarm:', error);
//     }
//   };

//   const addAlarm = (alarm) => {
//     dispatch({ type: 'ADD_ALARM', payload: alarm });
//   };

//   const removeAlarm = (alarmId) => {
//     dispatch({ type: 'REMOVE_ALARM', payload: alarmId });
//   };

//   const value = {
//     activeAlarms: state.activeAlarms,
//     upcomingAlarms: state.upcomingAlarms,
//     snoozedAlarms: state.snoozedAlarms,
//     dismissAlarm,
//     snoozeAlarm,
//     addAlarm,
//     removeAlarm,
//     loadUpcomingAlarms
//   };

//   return (
//     <AlarmContext.Provider value={value}>
//       {children}
//     </AlarmContext.Provider>
//   );
// };

// export const useAlarms = () => {
//   const context = useContext(AlarmContext);
//   if (!context) {
//     throw new Error('useAlarms must be used within an AlarmProvider');
//   }
//   return context;
// };



