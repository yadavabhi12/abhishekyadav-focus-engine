
// routes/focus.js (Fixed distraction endpoint)
const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');

const router = express.Router();

// Import the FocusService
const FocusService = require('../services/focusService');
let focusService;

// Initialize the focus service
const initFocusService = () => {
  focusService = new FocusService();
  console.log('✅ Focus service initialized');
};

// Initialize immediately
initFocusService();

/* -------------------- SESSION ROUTES -------------------- */

// Start a focus session
router.post('/sessions/start', auth, async (req, res) => {
  try {
    const { taskId, type } = req.body;
    const session = await focusService.startFocusSession(req.user._id, taskId, type);
    res.json({ session });
  } catch (error) {
    console.error('Error starting focus session:', error);
    res.status(400).json({ error: error.message });
  }
});

// End a focus session
router.post('/sessions/end', auth, async (req, res) => {
  try {
    const { completed } = req.body;
    const session = await focusService.endFocusSession(req.user._id, completed);
    res.json({ session });
  } catch (error) {
    console.error('Error ending focus session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Pause a focus session
router.post('/sessions/pause', auth, async (req, res) => {
  try {
    const session = await focusService.pauseFocusSession(req.user._id);
    res.json({ session });
  } catch (error) {
    console.error('Error pausing focus session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Resume a focus session
router.post('/sessions/resume', auth, async (req, res) => {
  try {
    const session = await focusService.resumeFocusSession(req.user._id);
    res.json({ session });
  } catch (error) {
    console.error('Error resuming focus session:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add a distraction - FIXED ENDPOINT
router.post('/sessions/distractions', auth, async (req, res) => {
  try {
    const { type, description } = req.body;
    const session = await focusService.addDistraction(req.user._id, type, description);
    res.json({ session });
  } catch (error) {
    console.error('Error adding distraction:', error);
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- STATS ROUTES -------------------- */

// Get today's focus statistics
router.get('/stats/today', auth, async (req, res) => {
  try {
    const stats = await focusService.getTodayStats(req.user._id);

    const safeStats = {
      totalFocusMinutes: stats.totalFocusMinutes || 0,
      completedSessions: stats.completedSessions || 0,
      distractions: stats.distractions || 0,
      activeSession: stats.activeSession || null
    };

    res.json({ stats: safeStats });
  } catch (error) {
    console.error('Error getting focus stats:', error);
    res.status(500).json({
      error: 'Failed to get focus statistics',
      stats: {
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0,
        activeSession: null
      }
    });
  }
});

// ... rest of the focus routes ...
// Get weekly focus report
router.get('/stats/weekly', auth, async (req, res) => {
  try {
    const report = await focusService.getWeeklyFocusReport(req.user._id);
    res.json({ report });
  } catch (error) {
    console.error('Error getting weekly focus report:', error);
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- GOAL ROUTE -------------------- */

// Update weekly goal
router.put('/goal', auth, async (req, res) => {
  try {
    const { weeklyGoal } = req.body;

    if (weeklyGoal < 1 || weeklyGoal > 80) {
      return res.status(400).json({ error: 'Weekly goal must be between 1 and 80 hours' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'stats.weeklyGoal': weeklyGoal },
      { new: true }
    );

    res.json({ weeklyGoal: user.stats.weeklyGoal });
  } catch (error) {
    console.error('Error updating weekly goal:', error);
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- ACHIEVEMENTS ROUTE -------------------- */

router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const todayStats = user.getTodayFocusStats();

    const achievements = [
      {
        name: 'Daily Focus',
        description: 'Complete 2 hours of focused work today',
        progress: Math.min((todayStats.totalFocusMinutes || 0) / 120 * 100, 100),
        completed: (todayStats.totalFocusMinutes || 0) >= 120,
        icon: '⏰'
      },
      {
        name: 'Focus Sessions',
        description: 'Complete 4 focus sessions today',
        progress: Math.min((todayStats.completedSessions || 0) / 4 * 100, 100),
        completed: (todayStats.completedSessions || 0) >= 4,
        icon: '🎯'
      },
      {
        name: 'Weekly Goal',
        description: `Reach your weekly goal of ${user.stats.weeklyGoal} hours`,
        progress: Math.min((user.stats.totalFocusHours || 0) / user.stats.weeklyGoal * 100, 100),
        completed: (user.stats.totalFocusHours || 0) >= user.stats.weeklyGoal,
        icon: '🏆'
      },
      {
        name: 'Task Master',
        description: 'Complete 10 tasks this week',
        progress: Math.min((user.stats.totalTasksCompleted || 0) / 10 * 100, 100),
        completed: (user.stats.totalTasksCompleted || 0) >= 10,
        icon: '✅'
      },
      {
        name: 'Consistency King',
        description: 'Maintain a 7-day focus streak',
        progress: Math.min((user.stats.streak || 0) / 7 * 100, 100),
        completed: (user.stats.streak || 0) >= 7,
        icon: '👑'
      }
    ];

    res.json({ achievements });
  } catch (error) {
    console.error('Error getting achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

/* -------------------- EXPORT -------------------- */
module.exports = { router, initFocusService };
