const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { taskSchema, alarmSchema } = require('../utils/validation');

const router = express.Router();

// Get tasks with filtering
router.get('/', auth, async (req, res) => {
  try {
    const {
      date,
      range = '7',
      category,
      search,
      completed,
      priority,
      assignedToMe
    } = req.query;

    let query = {
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    };

    if (date) {
      if (range === '1') {
        query.date = date;
      } else {
        const startDate = new Date(date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + parseInt(range));
        
        query.date = {
          $gte: startDate.toISOString().split('T')[0],
          $lte: endDate.toISOString().split('T')[0]
        };
      }
    }

    if (category) query.category = category;
    if (completed !== undefined) query.completed = completed === 'true';
    if (priority) query.priority = priority;
    if (assignedToMe === 'true') query.assignedTo = req.user._id;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('ownerId', 'name photoUrl')
      .populate('assignedTo', 'name photoUrl')
      .populate('sharedWith.userId', 'name photoUrl')
      .populate('dependencies', 'title completed')
      .populate('category', 'name color icon')
      .sort({ date: 1, startTime: 1 });

    res.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new task
router.post('/', auth, async (req, res) => {
  try {
    const { error } = taskSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const taskData = {
      ...req.body,
      ownerId: req.user._id
    };

    if (req.body.recurring?.rule) {
      taskData.recurring.seriesId = new Date().toISOString();
    }

    const task = new Task(taskData);
    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('ownerId', 'name photoUrl')
      .populate('assignedTo', 'name photoUrl')
      .populate('category', 'name color icon');

    res.status(201).json({ task: populatedTask });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get single task
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    })
    .populate('ownerId', 'name photoUrl')
    .populate('assignedTo', 'name photoUrl')
    .populate('sharedWith.userId', 'name photoUrl')
    .populate('dependencies', 'title completed')
    .populate('category', 'name color icon');

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update task
// routes/tasks.js (Backend - Final fix with proper version handling)
// Update task
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { 'sharedWith': { $elemMatch: { userId: req.user._id, permission: 'editor' } } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or no permission to edit' });
    }

    // Check version conflict
    if (req.body.__v !== undefined && task.__v !== req.body.__v) {
      return res.status(409).json({ 
        error: 'Version conflict',
        message: 'This task has been modified by another process',
        currentVersion: task.__v
      });
    }

    // Remove version field from update data to prevent direct manipulation
    const { __v, ...updateData } = req.body;
    
    // Apply updates using mongoose's findOneAndUpdate to handle versioning atomically
    const updatedTask = await Task.findOneAndUpdate(
      { 
        _id: req.params.id,
        __v: task.__v // Ensure we're updating the expected version
      },
      updateData,
      { 
        new: true,
        runValidators: true
      }
    );

    if (!updatedTask) {
      return res.status(409).json({ 
        error: 'Version conflict',
        message: 'This task has been modified by another process',
        currentVersion: task.__v
      });
    }

    const populatedTask = await Task.findById(updatedTask._id)
      .populate('ownerId', 'name photoUrl')
      .populate('assignedTo', 'name photoUrl')
      .populate('category', 'name color icon');

    res.json({ task: populatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    
    if (error.name === 'VersionError') {
      return res.status(409).json({ 
        error: 'Version conflict',
        message: 'This task has been modified by another process'
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Toggle task completion
router.post('/:id/complete', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith': { $elemMatch: { userId: req.user._id, permission: { $in: ['editor', 'commenter'] } } } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.completed = !task.completed;
    task.completedAt = task.completed ? new Date() : null;
    await task.save();

    res.json({ task, completed: task.completed });
  } catch (error) {
    console.error('Error toggling task completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Set alarm for task
router.post('/:id/alarm', auth, async (req, res) => {
  try {
    const { error } = alarmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { time, enabled = true, sound = 'default', vibration = true } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { 'sharedWith': { $elemMatch: { userId: req.user._id, permission: 'editor' } } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or no permission to edit' });
    }

    task.alarm = {
      enabled,
      time,
      sound,
      vibration,
      snoozedUntil: null,
      lastTriggered: null,
      count: 0
    };

    await task.save();

    res.json({ 
      task, 
      message: enabled ? `Alarm set for ${time}` : 'Alarm disabled' 
    });
  } catch (error) {
    console.error('Error setting alarm:', error);
    res.status(400).json({ error: error.message });
  }
});

// Snooze alarm
router.post('/:id/snooze', auth, async (req, res) => {
  try {
    const { minutes = 5 } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.alarm.enabled || !task.alarm.time) {
      return res.status(400).json({ error: 'No active alarm to snooze' });
    }

    await task.snoozeAlarm(minutes);

    res.json({ 
      task, 
      message: `Alarm snoozed for ${minutes} minutes` 
    });
  } catch (error) {
    console.error('Error snoozing alarm:', error);
    res.status(400).json({ error: error.message });
  }
});

// Share task
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userEmail, permission } = req.body;
    
    const User = require('../models/User');
    const sharedUser = await User.findOne({ email: userEmail });
    
    if (!sharedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const existingShare = task.sharedWith.find(
      share => share.userId.toString() === sharedUser._id.toString()
    );

    if (existingShare) {
      existingShare.permission = permission;
    } else {
      task.sharedWith.push({
        userId: sharedUser._id,
        permission
      });
    }

    await task.save();
    res.json({ message: 'Task shared successfully' });
  } catch (error) {
    console.error('Error sharing task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete task
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get task statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { range = '30' } = req.query;
    const days = parseInt(range);
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const tasks = await Task.find({
      ownerId: req.user._id,
      date: { $gte: startDateStr, $lte: endDateStr }
    });

    const categoryStats = {};
    tasks.forEach(task => {
      const categoryId = task.category ? task.category.toString() : 'uncategorized';
      if (!categoryStats[categoryId]) {
        categoryStats[categoryId] = { total: 0, completed: 0 };
      }
      categoryStats[categoryId].total++;
      if (task.completed) categoryStats[categoryId].completed++;
    });

    const priorityStats = {};
    tasks.forEach(task => {
      if (!priorityStats[task.priority]) {
        priorityStats[task.priority] = { total: 0, completed: 0 };
      }
      priorityStats[task.priority].total++;
      if (task.completed) priorityStats[task.priority].completed++;
    });

    const completionTrend = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t => t.date === dateStr);
      const completed = dayTasks.filter(t => t.completed);

      completionTrend.push({
        date: dateStr,
        total: dayTasks.length,
        completed: completed.length,
        completionRate: dayTasks.length > 0 ? (completed.length / dayTasks.length) * 100 : 0
      });
    }

    const timeStats = {
      totalEstimated: tasks.reduce((sum, t) => sum + (t.estimatedMinutes || 0), 0),
      totalActual: tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0),
      tasksWithTime: tasks.filter(t => t.estimatedMinutes > 0 || t.actualMinutes > 0).length
    };

    res.json({
      period: { start: startDateStr, end: endDateStr },
      summary: {
        total: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        completionRate: tasks.length > 0 ? (tasks.filter(t => t.completed).length / tasks.length) * 100 : 0,
        overdue: tasks.filter(t => !t.completed && new Date(t.date) < new Date()).length
      },
      categories: categoryStats,
      priorities: priorityStats,
      trend: completionTrend,
      time: timeStats
    });
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: error.message });
  }
});


router.post('/:id/manual-time', auth, async (req, res) => {
  try {
    const { minutes } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.manualTimeSpent += minutes;
    await task.save();

    // Update category time if task has a category
    if (task.category) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          [`categoryStats.${task.category}.totalMinutes`]: minutes
        }
      });
    }

    res.json({ task, message: `Added ${minutes} minutes to task` });
  } catch (error) {
    console.error('Error adding manual time:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get category statistics for user
router.get('/category-stats', auth, async (req, res) => {
  try {
    const stats = await Task.getCategoryStats(req.user._id);
    res.json({ stats });
  } catch (error) {
    console.error('Error getting category stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Calculate time from start/end times
router.post('/:id/calculate-time', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.startTime || !task.endTime) {
      return res.status(400).json({ error: 'Start time and end time are required' });
    }

    const oldTime = task.manualTimeSpent;
    task.calculateManualTime();
    await task.save();

    const timeDifference = task.manualTimeSpent - oldTime;

    // Update category time if task has a category and time changed
    if (task.category && timeDifference !== 0) {
      await User.findByIdAndUpdate(req.user._id, {
        $inc: {
          [`categoryStats.${task.category}.totalMinutes`]: timeDifference
        }
      });
    }

    res.json({ 
      task, 
      timeAdded: timeDifference,
      message: `Calculated ${timeDifference} minutes from start/end times` 
    });
  } catch (error) {
    console.error('Error calculating time:', error);
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
















