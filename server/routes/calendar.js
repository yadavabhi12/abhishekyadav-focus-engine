const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/:view', auth, async (req, res) => {
  try {
    const { view } = req.params;
    const { date, category, priority } = req.query;
    
    let startDate, endDate;
    const referenceDate = date ? new Date(date) : new Date();
    
    switch (view) {
      case 'day':
        startDate = referenceDate.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'week':
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endDate = endOfWeek.toISOString().split('T')[0];
        break;
      case 'month':
        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        startDate = startOfMonth.toISOString().split('T')[0];
        
        const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        endDate = endOfMonth.toISOString().split('T')[0];
        break;
      default:
        return res.status(400).json({ error: 'Invalid view type. Use day, week, or month.' });
    }
    
    let query = {
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ],
      date: { $gte: startDate, $lte: endDate }
    };
    
    if (category) query.category = category;
    if (priority) query.priority = priority;
    
    const tasks = await Task.find(query)
      .populate('ownerId', 'name photoUrl')
      .populate('assignedTo', 'name photoUrl')
      .populate('sharedWith.userId', 'name photoUrl')
      .sort({ date: 1, startTime: 1 });
    
    const tasksByDate = {};
    tasks.forEach(task => {
      if (!tasksByDate[task.date]) {
        tasksByDate[task.date] = [];
      }
      tasksByDate[task.date].push(task);
    });
    
    res.json({
      view,
      period: { start: startDate, end: endDate },
      tasks: tasksByDate,
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/timeline/:range', auth, async (req, res) => {
  try {
    const { range } = req.params;
    const { date } = req.query;
    
    const referenceDate = date ? new Date(date) : new Date();
    let startDate, endDate;
    
    switch (range) {
      case 'day':
        startDate = referenceDate.toISOString().split('T')[0];
        endDate = startDate;
        break;
      case 'week':
        const startOfWeek = new Date(referenceDate);
        startOfWeek.setDate(referenceDate.getDate() - referenceDate.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endDate = endOfWeek.toISOString().split('T')[0];
        break;
      case 'month':
        const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        startDate = startOfMonth.toISOString().split('T')[0];
        
        const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0);
        endDate = endOfMonth.toISOString().split('T')[0];
        break;
      default:
        return res.status(400).json({ error: 'Invalid range. Use day, week, or month.' });
    }
    
    const tasks = await Task.find({
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ],
      date: { $gte: startDate, $lte: endDate },
      $or: [
        { startTime: { $exists: true, $ne: null } },
        { endTime: { $exists: true, $ne: null } }
      ]
    })
    .populate('ownerId', 'name photoUrl')
    .populate('assignedTo', 'name photoUrl')
    .sort({ date: 1, startTime: 1 });
    
    let timeline = [];
    
    if (range === 'day') {
      for (let hour = 0; hour < 24; hour++) {
        const hourStr = hour.toString().padStart(2, '0');
        timeline.push({
          time: `${hourStr}:00`,
          tasks: tasks.filter(task => {
            if (!task.startTime) return false;
            const taskHour = parseInt(task.startTime.split(':')[0]);
            return taskHour === hour;
          })
        });
      }
    } else {
      const currentDate = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      while (currentDate <= endDateObj) {
        const dateStr = currentDate.toISOString().split('T')[0];
        timeline.push({
          date: dateStr,
          tasks: tasks.filter(task => task.date === dateStr)
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    
    res.json({
      range,
      period: { start: startDate, end: endDate },
      timeline,
      total: tasks.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;



