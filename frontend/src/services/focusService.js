// services/focusService.js
import api from './api';

export const focusService = {
  // Start a focus session
  startSession: async (taskId, sessionType = 'work') => {
    try {
      const response = await api.post('/focus/sessions/start', {
        taskId,
        type: sessionType
      });
      return response.data.session;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  },

  // End a focus session
  endSession: async (completed = true) => {
    try {
      const response = await api.post('/focus/sessions/end', { completed });
      return response.data.session;
    } catch (error) {
      console.error('Error ending focus session:', error);
      throw error;
    }
  },

  // Pause a focus session
  pauseSession: async () => {
    try {
      const response = await api.post('/focus/sessions/pause');
      return response.data.session;
    } catch (error) {
      console.error('Error pausing focus session:', error);
      throw error;
    }
  },

  // Resume a focus session
  resumeSession: async () => {
    try {
      const response = await api.post('/focus/sessions/resume');
      return response.data.session;
    } catch (error) {
      console.error('Error resuming focus session:', error);
      throw error;
    }
  },

  // Add a distraction
  addDistraction: async (type, description = '') => {
    try {
      const response = await api.post('/focus/sessions/distraction', {
        type,
        description
      });
      return response.data.session;
    } catch (error) {
      console.error('Error adding distraction:', error);
      throw error;
    }
  },

  // Get today's focus statistics
  getTodayStats: async () => {
    try {
      const response = await api.get('/focus/stats/today');
      return response.data.stats;
    } catch (error) {
      console.error('Error getting focus stats:', error);
      // Return default stats if there's an error
      return {
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0,
        activeSession: null
      };
    }
  },

  // Get weekly focus report
  getWeeklyReport: async () => {
    try {
      const response = await api.get('/focus/stats/weekly');
      return response.data.report;
    } catch (error) {
      console.error('Error getting weekly report:', error);
      throw error;
    }
  },

  // Update weekly goal
  updateWeeklyGoal: async (weeklyGoal) => {
    try {
      const response = await api.put('/focus/goal', { weeklyGoal });
      return response.data;
    } catch (error) {
      console.error('Error updating weekly goal:', error);
      throw error;
    }
  },

  // Get achievements
  getAchievements: async () => {
    try {
      const response = await api.get('/focus/achievements');
      return response.data.achievements;
    } catch (error) {
      console.error('Error getting achievements:', error);
      throw error;
    }
  }
};