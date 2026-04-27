import React, { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAlarms } from '../contexts/AlarmContext'
import { useWebSocket } from '../contexts/WebSocketContext'
import { alarmService } from '../services/alarmService'
import AlarmNotification from './alarms/AlarmNotification'

const AlarmHandler = () => {
  const { user } = useAuth()
  const { activeAlarms, addAlarm, removeAlarm } = useAlarms()
  const { socket } = useWebSocket()

  useEffect(() => {
    if (user && socket) {
      setupWebSocketListeners()
    }

    return () => {
      // Cleanup WebSocket listeners
      if (socket) {
        socket.off('alarm_triggered')
        socket.off('alarm_notification')
      }
    }
  }, [user, socket])

  const setupWebSocketListeners = () => {
    if (!socket) return

    // Listen for alarm trigger events
    socket.on('alarm_triggered', (data) => {
      if (data.type === 'ALARM_TRIGGERED') {
        addAlarm(data.alarm)
      }
    })

    // Listen for alarm notifications
    socket.on('alarm_notification', (data) => {
      if (data.type === 'ALARM_NOTIFICATION') {
        const alarm = {
          id: data.notification._id,
          taskId: data.notification.taskId,
          title: data.notification.message.replace(/"/g, '').replace('is scheduled for now', '').trim(),
          time: new Date().toLocaleTimeString(),
          notificationId: data.notification._id,
          sound: data.notification.data?.sound || 'default',
          vibration: data.notification.data?.vibration !== false
        }
        addAlarm(alarm)
      }
    })
  }

  const handleAlarmDismiss = (alarmId) => {
    removeAlarm(alarmId)
  }

  const handleAlarmSnooze = (alarmId, minutes) => {
    removeAlarm(alarmId)
  }

  return (
    <>
      {activeAlarms.map(alarm => (
        <AlarmNotification
          key={alarm.id}
          alarm={alarm}
          onDismiss={() => handleAlarmDismiss(alarm.id)}
          onSnooze={(minutes) => handleAlarmSnooze(alarm.id, minutes)}
        />
      ))}
    </>
  )
}

export default AlarmHandler