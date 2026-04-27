import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAlarms } from '../../contexts/AlarmContext'
import { useWebSocket } from '../../contexts/WebSocketContext'
import { toast } from 'react-hot-toast'
import AlarmNotification from './AlarmNotification'

const AlarmManager = () => {
  const { loadUpcomingAlarms } = useAlarms()
  const { socket, isConnected } = useWebSocket()
  const [activeAlarms, setActiveAlarms] = useState([])
  const [audioContext, setAudioContext] = useState(null)
  const hasLoadedRef = useRef(false)
  const socketHandlersRef = useRef({})

  // Initialize audio context on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContext) {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContext(context)
      } catch (error) {
        console.error('Failed to initialize audio context:', error)
      }
    }
  }, [audioContext])

  // Load upcoming alarms only once on mount
  useEffect(() => {
    if (!hasLoadedRef.current) {
      console.log('🔄 Loading upcoming alarms...')
      loadUpcomingAlarms().catch(error => {
        console.error('Failed to load upcoming alarms:', error)
      })
      hasLoadedRef.current = true
    }
  }, [loadUpcomingAlarms])

  // Initialize audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initAudioContext()
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
    
    document.addEventListener('click', handleUserInteraction)
    document.addEventListener('keydown', handleUserInteraction)
    
    return () => {
      document.removeEventListener('click', handleUserInteraction)
      document.removeEventListener('keydown', handleUserInteraction)
    }
  }, [initAudioContext])

  // WebSocket event handlers - defined with useCallback to prevent recreation
  const handleAlarmTrigger = useCallback((data) => {
    console.log('🔔 Alarm triggered received:', data)
    
    // Generate unique ID for the alarm
    const alarmId = data.alarmId || `task-${data.taskId}-${Date.now()}`
    
    // Check if this alarm is already active
    setActiveAlarms(prev => {
      const isAlreadyActive = prev.some(alarm => alarm.id === alarmId)
      
      if (!isAlreadyActive) {
        const newAlarm = {
          ...data,
          id: alarmId,
          timestamp: new Date().toISOString(),
          isSnoozed: false
        }
        
        console.log('🆕 Adding new alarm to active alarms:', newAlarm)
        
        // Play sound
        playAlarmSound(newAlarm.sound)
        
        // Show browser notification
        showBrowserNotification(newAlarm)
        
        // Show toast notification
        toast.success(
          `Alarm: ${newAlarm.taskTitle || 'Task reminder'}`,
          {
            duration: 5000,
            icon: '🔔',
            position: 'top-right'
          }
        )
        
        return [...prev, newAlarm]
      } else {
        console.log('⏭️ Alarm already active, skipping:', alarmId)
        return prev
      }
    })
  }, [])

  const handleAlarmNotification = useCallback((data) => {
    console.log('📢 General alarm notification:', data)
    if (data.type === 'ALARM_TRIGGERED') {
      handleAlarmTrigger(data)
    }
  }, [handleAlarmTrigger])

  // WebSocket setup - only setup once
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('WebSocket not connected, skipping setup')
      return
    }

    console.log('🔌 Setting up WebSocket listeners for alarms')

    // Store handlers for cleanup
    socketHandlersRef.current = {
      alarm_triggered: handleAlarmTrigger,
      alarm_notification: handleAlarmNotification
    }

    // Setup listeners
    socket.on('alarm_triggered', socketHandlersRef.current.alarm_triggered)
    socket.on('alarm_notification', socketHandlersRef.current.alarm_notification)

    return () => {
      console.log('🧹 Cleaning up WebSocket listeners')
      if (socket) {
        Object.entries(socketHandlersRef.current).forEach(([event, handler]) => {
          socket.off(event, handler)
        })
      }
    }
  }, [socket, isConnected, handleAlarmTrigger, handleAlarmNotification])

  const playAlarmSound = useCallback((soundType = 'default') => {
    try {
      if (!audioContext) {
        console.log('Audio context not available')
        return
      }

      console.log('🔊 Playing alarm sound:', soundType)
      
      // Resume audio context if suspended
      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(console.error)
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Sound configuration
      let frequency = 800
      let duration = 2000
      
      switch(soundType) {
        case 'gentle':
          oscillator.type = 'sine'
          frequency = 600
          duration = 1500
          break
        case 'urgent':
          oscillator.type = 'square'
          frequency = 1200
          duration = 3000
          break
        case 'melodic':
          oscillator.type = 'sine'
          frequency = 1000
          duration = 2500
          break
        default:
          oscillator.type = 'triangle'
          frequency = 800
          duration = 2000
      }
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
      
      oscillator.onended = () => {
        oscillator.disconnect()
        gainNode.disconnect()
      }
      
    } catch (error) {
      console.error('🔊 Error playing alarm sound:', error)
    }
  }, [audioContext])

  const showBrowserNotification = useCallback((data) => {
    if (!('Notification' in window)) {
      return
    }

    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          createNotification(data)
        }
      })
    } else if (Notification.permission === 'granted') {
      createNotification(data)
    }
  }, [])

  const createNotification = (data) => {
    const notification = new Notification('Task Alarm', {
      body: `${data.taskTitle || 'Task'} - ${data.message || 'Time to complete your task!'}`,
      icon: '/favicon.ico',
      tag: 'task-alarm',
      requireInteraction: true
    })

    notification.onclick = () => {
      window.focus()
      notification.close()
    }

    setTimeout(() => {
      notification.close()
    }, 10000)
  }

  const handleSnooze = useCallback(async (alarmId, minutes = 5) => {
    try {
      console.log('⏰ Snoozing alarm:', alarmId, 'for', minutes, 'minutes')
      setActiveAlarms(prev => prev.filter(alarm => alarm.id !== alarmId))
      toast.success(`Alarm snoozed for ${minutes} minutes`)
    } catch (error) {
      console.error('Failed to snooze alarm:', error)
      toast.error('Failed to snooze alarm')
    }
  }, [])

  const handleDismiss = useCallback(async (alarmId) => {
    try {
      console.log('❌ Dismissing alarm:', alarmId)
      setActiveAlarms(prev => prev.filter(alarm => alarm.id !== alarmId))
      toast.success('Alarm dismissed')
    } catch (error) {
      console.error('Failed to dismiss alarm:', error)
      toast.error('Failed to dismiss alarm')
    }
  }, [])

  const handleCompleteTask = useCallback(async (taskId) => {
    try {
      console.log('✅ Completing task:', taskId)
      setActiveAlarms(prev => prev.filter(alarm => !alarm.taskId || alarm.taskId !== taskId))
      toast.success('Task marked as complete')
    } catch (error) {
      console.error('Failed to complete task:', error)
      toast.error('Failed to complete task')
    }
  }, [])

  // Debug: Log when component re-renders
  useEffect(() => {
    console.log('🔄 AlarmManager re-rendered, active alarms:', activeAlarms.length)
  })

  return (
    <>
      {activeAlarms.map((alarm) => (
        <AlarmNotification
          key={alarm.id}
          alarm={alarm}
          onDismiss={() => handleDismiss(alarm.id)}
          onSnooze={(minutes) => handleSnooze(alarm.id, minutes)}
          onComplete={() => alarm.taskId && handleCompleteTask(alarm.taskId)}
        />
      ))}
    </>
  )
}

export default React.memo(AlarmManager)






