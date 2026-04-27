// services/focus.js (Fixed distraction endpoint)
import api from './api'

export const focusService = {
  startSession: async (taskId, type) => {
    try {
      const response = await api.post('/focus/sessions/start', { taskId, type })
      return response.data
    } catch (error) {
      console.error('Error starting focus session:', error)
      throw error
    }
  },

  endSession: async (completed = true) => {
    try {
      const response = await api.post('/focus/sessions/end', { completed })
      return response.data
    } catch (error) {
      console.error('Error ending focus session:', error)
      throw error
    }
  },

  pauseSession: async () => {
    try {
      const response = await api.post('/focus/sessions/pause')
      return response.data
    } catch (error) {
      console.error('Error pausing focus session:', error)
      throw error
    }
  },

  resumeSession: async () => {
    try {
      const response = await api.post('/focus/sessions/resume')
      return response.data
    } catch (error) {
      console.error('Error resuming focus session:', error)
      throw error
    }
  },

  addDistraction: async (type, description) => {
    try {
      // Use the correct endpoint format
      const response = await api.post('/focus/sessions/distraction', { 
        type, 
        description 
      })
      return response.data
    } catch (error) {
      console.error('Error adding distraction:', error)
      throw error
    }
  },

  getTodayStats: async () => {
    try {
      const response = await api.get('/focus/stats/today')
      return response.data
    } catch (error) {
      console.error('Error getting today stats:', error)
      // Return default stats if API fails
      return {
        stats: {
          totalFocusMinutes: 0,
          completedSessions: 0,
          distractions: 0
        }
      }
    }
  },

  getWeeklyStats: async () => {
    try {
      const response = await api.get('/focus/stats/weekly')
      return response.data
    } catch (error) {
      console.error('Error getting weekly stats:', error)
      throw error
    }
  },

  setGoal: async (weeklyGoal) => {
    try {
      const response = await api.put('/focus/goal', { weeklyGoal })
      return response.data
    } catch (error) {
      console.error('Error setting goal:', error)
      throw error
    }
  },

  getAchievements: async () => {
    try {
      const response = await api.get('/focus/achievements')
      return response.data
    } catch (error) {
      console.error('Error getting achievements:', error)
      throw error
    }
  }
};