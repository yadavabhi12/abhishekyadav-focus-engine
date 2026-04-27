const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const distractionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['phone', 'email', 'social', 'noise', 'other'],
    required: true
  },
  description: String,
  time: { type: Date, default: Date.now }
});

const focusSessionSchema = new mongoose.Schema({
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  type: {
    type: String,
    enum: ['work', 'break', 'longBreak'],
    required: true
  },
  completed: { type: Boolean, default: true },
  distractions: [distractionSchema]
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  },
  tags: [{ type: String, trim: true }],
  date: {
    type: String,
    required: true
  },
  startTime: String,
  endTime: String,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  estimatedMinutes: { type: Number, default: 0 },
  actualMinutes: { type: Number, default: 0 },
  focusSessions: [focusSessionSchema],
  recurring: {
    rule: String,
    until: Date,
    seriesId: String
  },
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  subtasks: [subtaskSchema],
  completed: { type: Boolean, default: false },
  completedAt: Date,
  color: { type: String, default: '#3B82F6' },

  // 🔔 Enhanced Alarm fields
  alarm: {
    enabled: { type: Boolean, default: false },
    time: String,
    snoozedUntil: Date,
    lastTriggered: Date,
    count: { type: Number, default: 0 },
    sound: { type: String, default: 'default' },
    vibration: { type: Boolean, default: true },
    repeat: {
      enabled: { type: Boolean, default: false },
      days: [{ type: Number, min: 0, max: 6 }] // 0 = Sunday, 6 = Saturday
    }
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  sharedWith: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['viewer', 'commenter', 'editor'],
      default: 'viewer'
    }
  }],
  focusMode: {
    enabled: { type: Boolean, default: false },
    pomodoro: {
      workTime: { type: Number, default: 25 },
      breakTime: { type: Number, default: 5 },
      longBreakTime: { type: Number, default: 15 },
      sessions: { type: Number, default: 4 }
    },
    distractionsBlocked: { type: Boolean, default: false }
  },
  
  // Track time spent manually (without focus timer)
  manualTimeSpent: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Indexes
taskSchema.index({ ownerId: 1, date: 1 });
taskSchema.index({ ownerId: 1, completed: 1 });
taskSchema.index({ ownerId: 1, category: 1 });
taskSchema.index({ ownerId: 1, priority: 1 });
taskSchema.index({ assignedTo: 1, date: 1 });
taskSchema.index({ 'sharedWith.userId': 1 });
taskSchema.index({ 'focusSessions.startTime': 1 });
taskSchema.index({ 'alarm.enabled': 1 });
taskSchema.index({ 'alarm.time': 1 });
taskSchema.index({ 'alarm.snoozedUntil': 1 });

// Virtuals
taskSchema.virtual('totalFocusTime').get(function () {
  return this.focusSessions.reduce((total, session) => total + (session.duration || 0), 0);
});

taskSchema.virtual('totalTimeSpent').get(function () {
  return this.actualMinutes + this.manualTimeSpent;
});

taskSchema.virtual('isAlarmActive').get(function () {
  return this.alarm.enabled && !this.completed;
});

taskSchema.virtual('nextAlarmTime').get(function () {
  if (!this.alarm.enabled || !this.alarm.time) return null;
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const alarmDate = new Date(this.date === today ? now : this.date);
  
  let [hours, minutes] = this.alarm.time.split(':');
  
  // Handle 12-hour format with AM/PM
  if (this.alarm.time.includes('AM') || this.alarm.time.includes('PM')) {
    const [time, period] = this.alarm.time.split(' ');
    [hours, minutes] = time.split(':');
    
    if (period.toUpperCase() === 'PM' && hours < 12) {
      hours = parseInt(hours, 10) + 12;
    } else if (period.toUpperCase() === 'AM' && hours == 12) {
      hours = 0;
    }
  }
  
  alarmDate.setHours(parseInt(hours, 10));
  alarmDate.setMinutes(parseInt(minutes, 10));
  alarmDate.setSeconds(0);
  alarmDate.setMilliseconds(0);
  
  // If alarm is for past time and not repeating, return null
  if (alarmDate < now && !this.alarm.repeat.enabled) {
    return null;
  }
  
  return alarmDate;
});

// Methods
taskSchema.methods.addFocusSession = function (sessionData) {
  this.focusSessions.push(sessionData);
  this.actualMinutes += sessionData.duration || 0;
  return this.save();
};

taskSchema.methods.addManualTime = function (minutes) {
  this.manualTimeSpent += minutes;
  return this.save();
};

taskSchema.methods.getFocusStats = function () {
  const totalSessions = this.focusSessions.length;
  const completedSessions = this.focusSessions.filter(session => session.completed).length;
  const totalFocusTime = this.focusSessions.reduce((total, session) => total + (session.duration || 0), 0);
  const totalDistractions = this.focusSessions.reduce((total, session) => total + (session.distractions.length || 0), 0);

  return {
    totalSessions,
    completedSessions,
    totalFocusTime,
    totalDistractions,
    totalTimeSpent: this.totalTimeSpent,
    completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
  };
};

taskSchema.methods.getRecentSessions = function (limit = 10) {
  return this.focusSessions
    .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
    .slice(0, limit);
};

// 🔔 Enhanced Alarm methods
taskSchema.methods.triggerAlarm = function () {
  this.alarm.lastTriggered = new Date();
  this.alarm.count += 1;
  return this.save();
};

taskSchema.methods.snoozeAlarm = function (minutes = 5) {
  const snoozeTime = new Date();
  snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes);
  this.alarm.snoozedUntil = snoozeTime;
  return this.save();
};

taskSchema.methods.disableAlarm = function () {
  this.alarm.enabled = false;
  this.alarm.snoozedUntil = null;
  return this.save();
};

taskSchema.methods.rescheduleAlarm = function (newTime) {
  this.alarm.time = newTime;
  this.alarm.snoozedUntil = null;
  return this.save();
};

taskSchema.methods.setAlarm = function(alarmData) {
  if (alarmData.enabled && !alarmData.time) {
    throw new Error('Alarm time is required when enabling alarm');
  }

  this.alarm = {
    ...this.alarm,
    ...alarmData,
    // Reset snooze when alarm is modified
    snoozedUntil: alarmData.enabled ? null : this.alarm.snoozedUntil
  };

  return this.save();
};

taskSchema.methods.validateAlarmTime = function(timeString) {
  if (!timeString) return false;
  
  // HH:MM format (24-hour)
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
    return true;
  }
  
  // HH:MM AM/PM format (12-hour)
  if (/^([0-9]{1,2}):([0-5][0-9])\s*(AM|PM)$/i.test(timeString)) {
    return true;
  }
  
  return false;
};

taskSchema.methods.shouldTriggerAlarm = function(currentTime, currentDay) {
  if (!this.alarm.enabled || this.completed || !this.alarm.time) {
    return false;
  }

  // Check if alarm is snoozed
  if (this.alarm.snoozedUntil && new Date(this.alarm.snoozedUntil) > new Date()) {
    return false;
  }

  // Check if alarm time matches current time
  const alarmTime = this.normalizeTime(this.alarm.time);
  const currentTimeNormalized = this.normalizeTime(currentTime);
  
  if (alarmTime !== currentTimeNormalized) {
    return false;
  }

  // Check if alarm repeats and if today is a repeat day
  if (this.alarm.repeat.enabled && this.alarm.repeat.days.length > 0) {
    return this.alarm.repeat.days.includes(currentDay);
  }

  // For non-repeating alarms, check if it's the correct date
  const today = new Date().toISOString().split('T')[0];
  return this.date === today;
};

taskSchema.methods.normalizeTime = function(timeString) {
  if (!timeString) return '';
  
  // If time is already in HH:MM format, return as is
  if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString)) {
    return timeString;
  }
  
  // If time is in 12h format with AM/PM, convert to 24h
  if (/([0-9]{1,2}):([0-9]{2})\s*(AM|PM)/i.test(timeString)) {
    const [_, hours, minutes, period] = timeString.match(/([0-9]{1,2}):([0-9]{2})\s*(AM|PM)/i);
    let hourInt = parseInt(hours, 10);
    
    if (period.toUpperCase() === 'PM' && hourInt < 12) {
      hourInt += 12;
    } else if (period.toUpperCase() === 'AM' && hourInt === 12) {
      hourInt = 0;
    }
    
    return `${hourInt.toString().padStart(2, '0')}:${minutes}`;
  }
  
  return timeString;
};

// Statics
taskSchema.statics.getTasksWithFocusTime = function (userId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        ownerId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $project: {
        title: 1,
        completed: 1,
        estimatedMinutes: 1,
        actualMinutes: 1,
        manualTimeSpent: 1,
        focusSessions: 1,
        totalFocusTime: { $sum: '$focusSessions.duration' },
        totalTimeSpent: { $add: ['$actualMinutes', '$manualTimeSpent'] }
      }
    },
    {
      $sort: { totalTimeSpent: -1 }
    }
  ]);
};

taskSchema.statics.getUpcomingAlarms = function(userId, limit = 10) {
  return this.find({
    ownerId: userId,
    'alarm.enabled': true,
    completed: false,
    $or: [
      { 'alarm.snoozedUntil': { $exists: false } },
      { 'alarm.snoozedUntil': null },
      { 'alarm.snoozedUntil': { $lte: new Date() } }
    ]
  })
  .select('title date alarm.time alarm.snoozedUntil alarm.repeat')
  .sort({ date: 1, 'alarm.time': 1 })
  .limit(limit);
};

// Hooks
taskSchema.pre('save', function (next) {
  if (this.isModified('focusSessions')) {
    this.actualMinutes = this.focusSessions.reduce((total, session) => {
      return total + (session.duration || 0);
    }, 0);
  }

  // Validate alarm time when enabled
  if (this.isModified('alarm') && this.alarm.enabled && this.alarm.time) {
    if (!this.validateAlarmTime(this.alarm.time)) {
      return next(new Error('Invalid alarm time format. Use HH:MM or HH:MM AM/PM'));
    }
  }

  // Handle category time tracking when task is completed/uncompleted
  if (this.isModified('completed') && this.category) {
    const Task = mongoose.model('Task');
    const User = mongoose.model('User');
    
    Task.findById(this._id).then(originalTask => {
      if (originalTask && originalTask.completed !== this.completed) {
        if (this.completed) {
          // Task was just completed - add time to category
          const timeToAdd = this.totalTimeSpent || this.manualTimeSpent || 0;
          
          if (timeToAdd > 0) {
            User.findByIdAndUpdate(this.ownerId, {
              $inc: {
                [`categoryStats.${this.category}.totalMinutes`]: timeToAdd,
                [`categoryStats.${this.category}.tasksCompleted`]: 1
              }
            }).catch(err => console.error('Error updating category time:', err));
          }
        } else {
          // Task was uncompleted - remove time from category
          const timeToRemove = this.totalTimeSpent || this.manualTimeSpent || 0;
          
          if (timeToRemove > 0) {
            User.findByIdAndUpdate(this.ownerId, {
              $inc: {
                [`categoryStats.${this.category}.totalMinutes`]: -timeToRemove,
                [`categoryStats.${this.category}.tasksCompleted`]: -1
              }
            }).catch(err => console.error('Error removing category time:', err));
          }
        }
      }
    }).catch(err => console.error('Error finding original task:', err));
  }

  next();
});

// Add to your Task schema methods:
taskSchema.methods.calculateTimeFromStartEnd = function() {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    let totalStartMinutes = startHours * 60 + startMinutes;
    let totalEndMinutes = endHours * 60 + endMinutes;
    
    if (totalEndMinutes < totalStartMinutes) {
      totalEndMinutes += 24 * 60;
    }
    
    this.manualTimeSpent = totalEndMinutes - totalStartMinutes;
  }
  return this;
};

// Update the pre-save hook to handle category time tracking
taskSchema.pre('save', async function(next) {
  if (this.isModified('completed') && this.category) {
    try {
      const User = mongoose.model('User');
      const originalTask = await this.constructor.findById(this._id);
      
      if (originalTask && originalTask.completed !== this.completed) {
        const timeToUpdate = this.manualTimeSpent || this.actualMinutes || 0;
        
        if (this.completed) {
          // Task completed - add time to category
          await User.findByIdAndUpdate(this.ownerId, {
            $inc: {
              [`categoryStats.${this.category}.totalMinutes`]: timeToUpdate,
              [`categoryStats.${this.category}.tasksCompleted`]: 1
            }
          });
        } else {
          // Task uncompleted - remove time from category
          await User.findByIdAndUpdate(this.ownerId, {
            $inc: {
              [`categoryStats.${this.category}.totalMinutes`]: -timeToUpdate,
              [`categoryStats.${this.category}.tasksCompleted`]: -1
            }
          });
        }
      }
    } catch (error) {
      console.error('Error updating category time:', error);
    }
  }
  next();
});
// Add instance method to calculate time between start and end time
taskSchema.methods.calculateManualTime = function() {
  if (this.startTime && this.endTime) {
    const [startHours, startMinutes] = this.startTime.split(':').map(Number);
    const [endHours, endMinutes] = this.endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    let timeDifference = endTotalMinutes - startTotalMinutes;
    
    // Handle case where end time is on the next day
    if (timeDifference < 0) {
      timeDifference += 24 * 60; // Add 24 hours in minutes
    }
    
    this.manualTimeSpent = timeDifference;
  }
  return this;
};

// Add static method to get category statistics
taskSchema.statics.getCategoryStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        ownerId: mongoose.Types.ObjectId(userId),
        completed: true,
        category: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$category',
        totalMinutes: { $sum: { $add: ['$actualMinutes', '$manualTimeSpent'] } },
        tasksCompleted: { $sum: 1 }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $project: {
        categoryName: '$categoryInfo.name',
        categoryColor: '$categoryInfo.color',
        totalMinutes: 1,
        tasksCompleted: 1
      }
    },
    {
      $sort: { totalMinutes: -1 }
    }
  ]);
};


module.exports = mongoose.model('Task', taskSchema);










