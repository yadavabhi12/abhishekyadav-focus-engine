// src/services/alarmService.js
import api from './api'

export const alarmService = {
  // Set alarm for a task
  setAlarm: async (taskId, alarmData) => {
    try {
      const response = await api.post(`/tasks/${taskId}/alarm`, alarmData)
      return response.data
    } catch (error) {
      console.error('Error setting alarm:', error)
      throw error
    }
  },

  // Snooze alarm
  snoozeAlarm: async (taskId, minutes = 5) => {
    try {
      const response = await api.post(`/tasks/${taskId}/snooze`, { minutes })
      return response.data
    } catch (error) {
      console.error('Error snoozing alarm:', error)
      throw error
    }
  },

  // Dismiss alarm
  dismissAlarm: async (taskId) => {
    try {
      const response = await api.post(`/tasks/${taskId}/disable-alarm`)
      return response.data
    } catch (error) {
      console.error('Error disabling alarm:', error)
      throw error
    }
  },

  // Get upcoming alarms
  getUpcomingAlarms: async () => {
    try {
      const response = await api.get('/tasks/upcoming-alarms')
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming alarms:', error)
      throw error
    }
  }
}
