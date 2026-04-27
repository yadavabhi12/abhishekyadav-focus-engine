// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const notificationSchema = new mongoose.Schema({
  title: String,
  message: String,
  type: {
    type: String,
    enum: ['alarm', 'reminder', 'assignment', 'comment', 'motivation', 'focus']
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const focusStatSchema = new mongoose.Schema({
  date: { type: String, required: true },
  totalFocusMinutes: { type: Number, default: 0 },
  completedSessions: { type: Number, default: 0 },
  distractions: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  photoUrl: {
    type: String,
    default: ''
  },
  coverUrl: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 500,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    default: ''
  },
  education: {
    type: String,
    default: ''
  },
  roles: [{
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }],
  quotes: [{
    text: String,
    author: String,
    createdAt: { type: Date, default: Date.now }
  }],
  categoryStats: {
    type: Map,
    of: {
      totalMinutes: { type: Number, default: 0 },
      tasksCompleted: { type: Number, default: 0 }
    },
    default: {}
  },
  settings: {
    darkMode: { type: Boolean, default: false },
    sounds: { type: Boolean, default: true },
    snoozeMinutes: { type: Number, default: 5 },
    notifications: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: false },
    focusMode: {
      pomodoro: {
        workTime: { type: Number, default: 25 },
        breakTime: { type: Number, default: 5 },
        longBreakTime: { type: Number, default: 15 },
        sessions: { type: Number, default: 4 }
      },
      blockDistractions: { type: Boolean, default: false }
    },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '17:00' },
      days: [{ type: Number, default: [1, 2, 3, 4, 5] }]
    }
  },
  achievements: [{
    name: String,
    description: String,
    icon: String,
    unlockedAt: Date,
    points: Number
  }],
  stats: {
    level: { type: Number, default: 1 },
    points: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastActive: Date,
    totalFocusHours: { type: Number, default: 0 },
    totalTasksCompleted: { type: Number, default: 0 },
    productivityScore: { type: Number, default: 0 },
    weeklyGoal: { type: Number, default: 20 }
  },
  notifications: [notificationSchema],
  focusStats: [focusStatSchema],
  defaultView: { type: String, enum: ['day', 'week', 'month'], default: 'week' }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.passwordHash);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Update Focus Stats
 */
// Add to your User schema methods:
userSchema.methods.updateCategoryTime = async function(categoryId, minutes, taskCompleted = false) {
  try {
    if (!this.categoryStats) {
      this.categoryStats = new Map();
    }

    const categoryIdStr = categoryId.toString();
    
    if (!this.categoryStats.has(categoryIdStr)) {
      this.categoryStats.set(categoryIdStr, {
        totalMinutes: 0,
        tasksCompleted: 0
      });
    }

    const categoryData = this.categoryStats.get(categoryIdStr);
    categoryData.totalMinutes += minutes;

    if (taskCompleted) {
      categoryData.tasksCompleted += 1;
    }

    this.categoryStats.set(categoryIdStr, categoryData);
    await this.save();
    return this;
  } catch (error) {
    console.error('Error in updateCategoryTime:', error);
    throw error;
  }
};

userSchema.methods.removeCategoryTime = async function(categoryId, minutes) {
  try {
    if (!this.categoryStats) {
      return this;
    }

    const categoryIdStr = categoryId.toString();
    
    if (this.categoryStats.has(categoryIdStr)) {
      const categoryData = this.categoryStats.get(categoryIdStr);
      categoryData.totalMinutes = Math.max(0, categoryData.totalMinutes - minutes);
      
      this.categoryStats.set(categoryIdStr, categoryData);
      await this.save();
    }
    
    return this;
  } catch (error) {
    console.error('Error in removeCategoryTime:', error);
    throw error;
  }
};



userSchema.methods.updateFocusStats = async function(date, updates) {
  try {
    const today = date || new Date().toISOString().split('T')[0];
    const statIndex = this.focusStats.findIndex(stat => stat.date === today);

    if (statIndex === -1) {
      const newStat = {
        date: today,
        totalFocusMinutes: 0,
        completedSessions: 0,
        distractions: 0,
        tasksCompleted: 0,
        ...updates
      };
      this.focusStats.push(newStat);
    } else {
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'number') {
          const currentValue = this.focusStats[statIndex][key] || 0;
          this.focusStats[statIndex][key] = currentValue + updates[key];
        } else {
          this.focusStats[statIndex][key] = updates[key];
        }
      });
    }

    await this.save();
    return this.focusStats.find(stat => stat.date === today);
  } catch (error) {
    console.error('Error in updateFocusStats:', error);
    throw error;
  }
};


userSchema.methods.getTodayFocusStats = function() {
  const today = new Date().toISOString().split('T')[0];
  const todayStats = this.focusStats.find(stat => stat.date === today);

  if (todayStats) {
    return {
      date: today,
      totalFocusMinutes: todayStats.totalFocusMinutes || 0,
      completedSessions: todayStats.completedSessions || 0,
      distractions: todayStats.distractions || 0,
      tasksCompleted: todayStats.tasksCompleted || 0
    };
  }

  return {
    date: today,
    totalFocusMinutes: 0,
    completedSessions: 0,
    distractions: 0,
    tasksCompleted: 0
  };
};

userSchema.methods.getWeeklyFocusReport = function() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const weeklyStats = this.focusStats.filter(stat => {
    const statDate = new Date(stat.date);
    return statDate >= startDate && statDate <= endDate;
  });

  const totalFocus = weeklyStats.reduce((sum, stat) => sum + (stat.totalFocusMinutes || 0), 0);
  const totalSessions = weeklyStats.reduce((sum, stat) => sum + (stat.completedSessions || 0), 0);
  const totalDistractions = weeklyStats.reduce((sum, stat) => sum + (stat.distractions || 0), 0);
  const totalTasksCompleted = weeklyStats.reduce((sum, stat) => sum + (stat.tasksCompleted || 0), 0);

  const goal = this.stats.weeklyGoal * 60;
  const goalPercentage = goal > 0 ? Math.min((totalFocus / goal) * 100, 100) : 0;

  return {
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    },
    totalFocusMinutes: totalFocus,
    totalFocusHours: Math.round(totalFocus / 60 * 10) / 10,
    completedSessions: totalSessions,
    distractions: totalDistractions,
    tasksCompleted: totalTasksCompleted,
    goal: this.stats.weeklyGoal,
    goalPercentage: Math.round(goalPercentage),
    dailyStats: weeklyStats.map(stat => ({
      date: stat.date,
      totalFocusMinutes: stat.totalFocusMinutes || 0,
      completedSessions: stat.completedSessions || 0,
      distractions: stat.distractions || 0,
      tasksCompleted: stat.tasksCompleted || 0
    }))
  };
};

/**
 * Category Stats Methods
 */
userSchema.methods.updateCategoryStats = async function(categoryId, minutes, taskCompleted = false) {
  if (!this.categoryStats) {
    this.categoryStats = new Map();
  }

  if (!this.categoryStats.has(categoryId)) {
    this.categoryStats.set(categoryId, {
      totalMinutes: 0,
      tasksCompleted: 0
    });
  }

  const categoryData = this.categoryStats.get(categoryId);
  categoryData.totalMinutes += minutes;

  if (taskCompleted) {
    categoryData.tasksCompleted += 1;
  }

  this.categoryStats.set(categoryId, categoryData);
  return this.save();
};

userSchema.methods.getCategoryStats = function() {
  return Array.from(this.categoryStats.entries()).map(([categoryId, data]) => ({
    categoryId,
    totalMinutes: data.totalMinutes || 0,
    tasksCompleted: data.tasksCompleted || 0
  }));
};

module.exports = mongoose.model('User', userSchema);










