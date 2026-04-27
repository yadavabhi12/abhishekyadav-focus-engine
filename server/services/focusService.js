// services/focusService.js
const Task = require('../models/Task');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');

class FocusService {
  constructor() {
    this.activeSessions = new Map();
  }

  async startFocusSession(userId, taskId, sessionType = 'pomodoro') {
    try {
      console.log('Starting focus session for user:', userId, 'task:', taskId, 'type:', sessionType);

      const task = taskId ? await Task.findOne({ _id: taskId, ownerId: userId }) : null;

      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const sessionSettings = user.settings.focusMode.pomodoro;

      const sessionData = {
        taskId: taskId || null,
        startTime: new Date(),
        type: sessionType,
        duration: sessionType === 'break' ? sessionSettings.breakTime : sessionSettings.workTime,
        completed: false,
        distractions: []
      };

      this.activeSessions.set(userId.toString(), sessionData);
      console.log('Active sessions:', Array.from(this.activeSessions.keys()));

      await sendNotification({
        userId,
        title: 'Focus Session Started',
        message: task ? `Focus session started for "${task.title}"` : 'General focus session started',
        type: 'focus',
        ...(task && { taskId })
      });

      return sessionData;
    } catch (error) {
      console.error('Error starting focus session:', error);
      throw error;
    }
  }

  async endFocusSession(userId, completed = true) {
    try {
      const userIdStr = userId.toString();
      const sessionData = this.activeSessions.get(userIdStr);

      if (!sessionData) throw new Error('No active focus session');

      sessionData.endTime = new Date();
      sessionData.completed = completed;

      const duration = Math.round((sessionData.endTime - sessionData.startTime) / 60000);
      sessionData.duration = duration;

      // Update task if linked
      if (sessionData.taskId) {
        await Task.findByIdAndUpdate(sessionData.taskId, {
          $push: {
            focusSessions: {
              startTime: sessionData.startTime,
              endTime: sessionData.endTime,
              duration,
              type: sessionData.type,
              completed,
              distractions: sessionData.distractions
            }
          },
          $inc: { actualMinutes: duration }
        });
      }

      // Update daily stats
      const user = await User.findById(userId);
      const today = new Date().toISOString().split('T')[0];

      await user.updateFocusStats(today, {
        totalFocusMinutes: duration,
        completedSessions: completed ? 1 : 0,
        distractions: sessionData.distractions.length
      });

      // Update global stats
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'stats.totalFocusHours': duration / 60,
          'stats.totalTasksCompleted': completed && sessionData.taskId ? 1 : 0
        },
        $set: { 'stats.lastActive': new Date() }
      });

      this.activeSessions.delete(userIdStr);
      console.log('Session ended, active sessions:', Array.from(this.activeSessions.keys()));

      if (completed) {
        await sendNotification({
          userId,
          title: 'Focus Session Completed',
          message: `Great job! You focused for ${duration} minutes`,
          type: 'focus'
        });
      }

      return sessionData;
    } catch (error) {
      console.error('Error ending focus session:', error);
      throw error;
    }
  }

  async addDistraction(userId, type, description) {
    try {
      const userIdStr = userId.toString();
      const sessionData = this.activeSessions.get(userIdStr);

      if (!sessionData) throw new Error('No active focus session');

      const distraction = { type, description, time: new Date() };
      sessionData.distractions.push(distraction);

      const user = await User.findById(userId);
      const today = new Date().toISOString().split('T')[0];

      await user.updateFocusStats(today, { distractions: 1 });

      return sessionData;
    } catch (error) {
      console.error('Error adding distraction:', error);
      throw error;
    }
  }

  async getTodayStats(userId) {
    try {
      const user = await User.findById(userId);
      const todayStats = user.getTodayFocusStats();

      const activeSession = this.activeSessions.get(userId.toString());

      return {
        totalFocusMinutes: Number(todayStats.totalFocusMinutes) || 0,
        completedSessions: Number(todayStats.completedSessions) || 0,
        distractions: Number(todayStats.distractions) || 0,
        activeSession: activeSession
          ? {
              taskId: activeSession.taskId,
              startTime: activeSession.startTime,
              type: activeSession.type,
              duration: activeSession.duration
            }
          : null
      };
    } catch (error) {
      console.error('Error getting focus stats:', error);
      return {
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0,
        activeSession: null
      };
    }
  }

  async getWeeklyFocusReport(userId) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      const user = await User.findById(userId);

      const weeklyStats = user.focusStats.filter(stat => {
        const statDate = new Date(stat.date);
        return statDate >= startDate && statDate <= endDate;
      });

      const totalFocus = weeklyStats.reduce((sum, stat) => sum + (stat.totalFocusMinutes || 0), 0);
      const totalSessions = weeklyStats.reduce((sum, stat) => sum + (stat.completedSessions || 0), 0);
      const totalDistractions = weeklyStats.reduce((sum, stat) => sum + (stat.distractions || 0), 0);

      const goal = user.stats.weeklyGoal * 60;
      const goalPercentage = goal > 0 ? Math.min((totalFocus / goal) * 100, 100) : 0;

      return {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        totalFocusMinutes: totalFocus,
        totalFocusHours: Math.round((totalFocus / 60) * 10) / 10,
        completedSessions: totalSessions,
        distractions: totalDistractions,
        goal: user.stats.weeklyGoal,
        goalPercentage: Math.round(goalPercentage),
        dailyStats: weeklyStats
      };
    } catch (error) {
      console.error('Error getting weekly focus report:', error);
      throw error;
    }
  }

  async pauseFocusSession(userId) {
    try {
      const sessionData = this.activeSessions.get(userId.toString());
      if (!sessionData) throw new Error('No active focus session');
      return sessionData;
    } catch (error) {
      console.error('Error pausing focus session:', error);
      throw error;
    }
  }

  async resumeFocusSession(userId) {
    try {
      const sessionData = this.activeSessions.get(userId.toString());
      if (!sessionData) throw new Error('No active focus session to resume');
      return sessionData;
    } catch (error) {
      console.error('Error resuming focus session:', error);
      throw error;
    }
  }

  hasActiveSession(userId) {
    return this.activeSessions.has(userId.toString());
  }

  getActiveSession(userId) {
    return this.activeSessions.get(userId.toString());
  }
}

module.exports = FocusService;

















