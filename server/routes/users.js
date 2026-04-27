// routes/users.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

/* -------------------- Multer Config -------------------- */
const makeStorage = (folder, prefix) =>
  multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = path.join(__dirname, '..', 'uploads', folder);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, `${prefix}-${uniqueSuffix}${extension}`);
    }
  });

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) cb(null, true);
  else cb(new Error('Only image files are allowed'), false);
};

const uploadAvatar = multer({
  storage: makeStorage('avatars', 'avatar'),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadCover = multer({
  storage: makeStorage('covers', 'cover'),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter
});

// Create upload directories on startup
['uploads', 'uploads/avatars', 'uploads/covers'].forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
});

/* -------------------- Profile Routes -------------------- */
// Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-passwordHash')
      .populate('achievements');

    if (!user) return res.status(404).json({ error: 'User not found' });

    const recentTasks = await Task.find({ ownerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('category', 'name color');

    const todayStats = user.getTodayFocusStats();
    const productivityScore = Math.min(
      (user.stats.totalFocusHours / user.stats.weeklyGoal) * 100,
      100
    );

    res.json({
      user,
      stats: {
        ...user.stats.toObject(),
        productivityScore: Math.round(productivityScore),
        todayFocus: todayStats.totalFocusMinutes,
        todaySessions: todayStats.completedSessions
      },
      recentTasks
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, location, website, company, position, education, coverUrl } = req.body;
    const updateData = { name, bio, location, website, company, position, education, coverUrl };

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(400).json({ error: error.message });
  }
});

// Update user settings
router.put('/me/settings', auth, async (req, res) => {
  try {
    const {
      darkMode,
      sounds,
      snoozeMinutes,
      notifications,
      emailAlerts,
      workingHours,
      focusMode,
      defaultView
    } = req.body;

    const updateData = {
      'settings.darkMode': darkMode,
      'settings.sounds': sounds,
      'settings.snoozeMinutes': snoozeMinutes,
      'settings.notifications': notifications,
      'settings.emailAlerts': emailAlerts,
      'settings.workingHours': workingHours,
      'settings.focusMode': focusMode
    };
    if (defaultView) updateData.defaultView = defaultView;

    const user = await User.findByIdAndUpdate(req.user._id, updateData, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(400).json({ error: error.message });
  }
});

/* -------------------- Uploads -------------------- */
// Upload avatar
router.post('/me/photo', auth, uploadAvatar.single('photo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old avatar
    if (user.photoUrl) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'avatars', path.basename(user.photoUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.photoUrl = `/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({ success: true, user, photoUrl: user.photoUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload photo' });
  }
});

// Upload cover
router.post('/me/cover', auth, uploadCover.single('cover'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old cover
    if (user.coverUrl) {
      const oldPath = path.join(__dirname, '..', 'uploads', 'covers', path.basename(user.coverUrl));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.coverUrl = `/uploads/covers/${req.file.filename}`;
    await user.save();

    res.json({ success: true, user, coverUrl: user.coverUrl });
  } catch (error) {
    console.error('Cover upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload cover' });
  }
});

// Serve avatar
router.get('/photo/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'avatars', req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).json({ error: 'Photo not found' });
});

// Serve cover
router.get('/cover/:filename', (req, res) => {
  const filePath = path.join(__dirname, '..', 'uploads', 'covers', req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).json({ error: 'Cover not found' });
});

/* -------------------- Stats & Timeline -------------------- */
// Focus stats
router.get('/me/focus-stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const todayStats = user.getTodayFocusStats();
    const weeklyReport = user.getWeeklyFocusReport();

    res.json({
      today: todayStats,
      weekly: weeklyReport,
      overall: {
        totalFocusHours: user.stats.totalFocusHours || 0,
        totalTasksCompleted: user.stats.totalTasksCompleted || 0,
        streak: user.stats.streak || 0,
        productivityScore: user.stats.productivityScore || 0
      }
    });
  } catch (error) {
    console.error('Error fetching focus stats:', error);
    res.status(500).json({ error: 'Failed to fetch focus statistics' });
  }
});

// Timeline
router.get('/timeline', auth, async (req, res) => {
  try {
    const { range = '7' } = req.query;
    const days = parseInt(range);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startStr, $lte: endStr }
    });

    const user = await User.findById(req.user._id);
    const stats = user.focusStats.filter(stat => {
      const d = new Date(stat.date);
      return d >= startDate && d <= endDate;
    });

    const timeline = [];
    const cur = new Date(startDate);
    while (cur <= endDate) {
      const dStr = cur.toISOString().split('T')[0];
      const dayTasks = tasks.filter(t => t.date === dStr);
      const dayStats = stats.find(s => s.date === dStr) || {
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0,
        tasksCompleted: 0
      };

      timeline.push({
        date: dStr,
        tasks: dayTasks.length,
        completed: dayTasks.filter(t => t.completed).length,
        focusMinutes: dayStats.totalFocusMinutes,
        sessions: dayStats.completedSessions,
        distractions: dayStats.distractions
      });

      cur.setDate(cur.getDate() + 1);
    }

    res.json({
      period: { start: startStr, end: endStr },
      timeline,
      summary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        totalFocus: stats.reduce((sum, s) => sum + s.totalFocusMinutes, 0),
        totalSessions: stats.reduce((sum, s) => sum + s.completedSessions, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Failed to fetch timeline' });
  }
});

// Category stats
router.get('/me/category-stats', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startStr, $lte: endStr }
    }).populate('category');

    const categoryStats = {};

    tasks.forEach(task => {
      if (task.category) {
        const name = task.category.name || 'Uncategorized';
        const color = task.category.color || '#6b7280';

        if (!categoryStats[name]) {
          categoryStats[name] = { category: name, tasks: 0, completed: 0, hours: 0, color };
        }

        categoryStats[name].tasks++;
        if (task.completed) categoryStats[name].completed++;

        if (task.focusSessions && task.focusSessions.length > 0) {
          categoryStats[name].hours +=
            task.focusSessions.reduce((tot, s) => tot + (s.duration || 0), 0) / 60;
        }
      }
    });

    res.json({
      period: { start: startStr, end: endStr },
      stats: Object.values(categoryStats).sort((a, b) => b.tasks - a.tasks)
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

/* -------------------- Achievements -------------------- */

// routes/users.js - Fix achievements route
router.get('/me/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get today's stats safely
    const todayStats = user.getTodayFocusStats();
    
    // Ensure we have valid numbers
    const totalFocusMinutes = Number(todayStats.totalFocusMinutes) || 0;
    const completedSessions = Number(todayStats.completedSessions) || 0;
    const totalFocusHours = Number(user.stats?.totalFocusHours) || 0;
    const weeklyGoal = Number(user.stats?.weeklyGoal) || 20; // Default to 20 if not set
    const totalTasksCompleted = Number(user.stats?.totalTasksCompleted) || 0;
    const streak = Number(user.stats?.streak) || 0;

    const achievements = [
      {
        name: 'Daily Focus',
        description: 'Complete 2 hours of focused work today',
        progress: Math.min((totalFocusMinutes / 120) * 100, 100),
        completed: totalFocusMinutes >= 120,
        icon: '⏰',
        points: 10
      },
      {
        name: 'Focus Sessions',
        description: 'Complete 4 focus sessions today',
        progress: Math.min((completedSessions / 4) * 100, 100),
        completed: completedSessions >= 4,
        icon: '🎯',
        points: 15
      },
      {
        name: 'Weekly Goal',
        description: `Reach your weekly goal of ${weeklyGoal} hours`,
        progress: weeklyGoal > 0 ? Math.min((totalFocusHours / weeklyGoal) * 100, 100) : 0,
        completed: totalFocusHours >= weeklyGoal,
        icon: '🏆',
        points: 25
      },
      {
        name: 'Task Master',
        description: 'Complete 10 tasks this week',
        progress: Math.min((totalTasksCompleted / 10) * 100, 100),
        completed: totalTasksCompleted >= 10,
        icon: '✅',
        points: 20
      },
      {
        name: 'Consistency King',
        description: 'Maintain a 7-day focus streak',
        progress: Math.min((streak / 7) * 100, 100),
        completed: streak >= 7,
        icon: '👑',
        points: 30
      }
    ];
    
    res.json({ achievements });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});



// Update focus stats
router.post('/me/focus-stats', auth, async (req, res) => {
  try {
    const { date, updates } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update focus stats
    await user.updateFocusStats(date, updates);
    
    res.json({ success: true, focusStats: user.focusStats });
  } catch (error) {
    console.error('Error updating focus stats:', error);
    res.status(500).json({ error: 'Failed to update focus stats' });
  }
});

// Get category statistics

// Update category time
router.post('/me/category-time', auth, async (req, res) => {
  try {
    const { categoryId, minutes } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Initialize categoryStats if it doesn't exist
    if (!user.categoryStats) {
      user.categoryStats = new Map();
    }
    
    // Convert Map to object for easier manipulation
    const categoryStats = user.categoryStats.toObject();
    
    if (!categoryStats[categoryId]) {
      categoryStats[categoryId] = {
        totalMinutes: 0,
        tasksCompleted: 0
      };
    }
    
    categoryStats[categoryId].totalMinutes += minutes;
    categoryStats[categoryId].tasksCompleted += 1;
    
    // Convert back to Map
    user.categoryStats = new Map(Object.entries(categoryStats));
    
    await user.save();
    
    res.json({ success: true, categoryStats: categoryStats[categoryId] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove category time
router.post('/me/remove-category-time', auth, async (req, res) => {
  try {
    const { categoryId, minutes } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.categoryStats) {
      return res.json({ success: true, message: 'No category stats to update' });
    }
    
    // Convert Map to object for easier manipulation
    const categoryStats = user.categoryStats.toObject();
    
    if (categoryStats[categoryId]) {
      categoryStats[categoryId].totalMinutes = Math.max(0, categoryStats[categoryId].totalMinutes - minutes);
      categoryStats[categoryId].tasksCompleted = Math.max(0, categoryStats[categoryId].tasksCompleted - 1);
      
      // Convert back to Map
      user.categoryStats = new Map(Object.entries(categoryStats));
      
      await user.save();
    }
    
    res.json({ success: true, categoryStats: categoryStats[categoryId] || {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get category stats
router.get('/me/category-stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ categoryStats: user.categoryStats ? Object.fromEntries(user.categoryStats) : {} });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});






module.exports = router;






