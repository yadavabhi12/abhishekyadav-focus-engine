// routes/alarms.js
const express = require('express');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { alarmSchema, snoozeSchema } = require('../utils/validation');

const router = express.Router();

// Set alarm for task - UPDATED TO HANDLE REPEAT
router.post('/:taskId/alarm', auth, async (req, res) => {
  try {
    const { error } = alarmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { time, enabled = true, sound = 'default', vibration = true, repeat } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        { ownerId: req.user._id },
        { 'sharedWith': { $elemMatch: { userId: req.user._id, permission: 'editor' } } }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found or no permission to edit' });
    }

    // Validate alarm time format
    if (enabled && time && !task.validateAlarmTime(time)) {
      return res.status(400).json({ error: 'Invalid alarm time format. Use HH:MM or HH:MM AM/PM' });
    }

    // Prepare alarm data including repeat
    const alarmData = {
      enabled,
      time: enabled ? time : null,
      sound,
      vibration,
      snoozedUntil: null,
      lastTriggered: null,
      count: 0
    };

    // Add repeat if provided
    if (repeat) {
      alarmData.repeat = {
        enabled: repeat.enabled || false,
        days: repeat.days || []
      };
    }

    await task.setAlarm(alarmData);

    const nextAlarmTime = task.nextAlarmTime;

    res.json({ 
      task, 
      message: enabled ? `Alarm set for ${time}` : 'Alarm disabled',
      nextAlarmTime: nextAlarmTime ? nextAlarmTime.toISOString() : null
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get upcoming alarms for user
router.get('/upcoming', auth, async (req, res) => {
  try {
    const tasksWithAlarms = await Task.find({
      ownerId: req.user._id,
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
    .limit(10);

    const alarms = tasksWithAlarms.map(task => ({
      _id: task._id,
      taskId: task._id,
      taskTitle: task.title,
      time: task.alarm.time,
      date: task.date,
      snoozedUntil: task.alarm.snoozedUntil,
      repeat: task.alarm.repeat
    }));

    res.json({ alarms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active alarms
router.get('/active', auth, async (req, res) => {
  try {
    const tasksWithAlarms = await Task.find({
      ownerId: req.user._id,
      'alarm.enabled': true,
      completed: false
    })
    .select('title date alarm.time alarm.snoozedUntil alarm.repeat')
    .sort({ date: 1, 'alarm.time': 1 });

    const alarms = tasksWithAlarms.map(task => ({
      _id: task._id,
      taskId: task._id,
      taskTitle: task.title,
      time: task.alarm.time,
      date: task.date,
      snoozedUntil: task.alarm.snoozedUntil,
      repeat: task.alarm.repeat
    }));

    res.json({ alarms });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Snooze alarm
router.post('/:taskId/snooze', auth, async (req, res) => {
  try {
    const { error } = snoozeSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { minutes = 5 } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.taskId,
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

    // Add to snoozed alarms in the service
    const alarmService = require('../services/alarmService');
    alarmService.addSnoozedAlarm(task._id, task.alarm.time, minutes);

    res.json({ 
      task, 
      message: `Alarm snoozed for ${minutes} minutes`,
      snoozedUntil: task.alarm.snoozedUntil
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Dismiss alarm
router.post('/:taskId/dismiss', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      $or: [
        { ownerId: req.user._id },
        { assignedTo: req.user._id },
        { 'sharedWith.userId': req.user._id }
      ]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await task.disableAlarm();

    res.json({ 
      task, 
      message: 'Alarm dismissed successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete alarm
router.delete('/:alarmId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.alarmId,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    await task.disableAlarm();

    res.json({ 
      message: 'Alarm deleted successfully' 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get alarm by ID
router.get('/:alarmId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.alarmId,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    res.json({ 
      alarm: {
        _id: task._id,
        taskId: task._id,
        taskTitle: task.title,
        time: task.alarm.time,
        date: task.date,
        enabled: task.alarm.enabled,
        sound: task.alarm.sound,
        vibration: task.alarm.vibration,
        repeat: task.alarm.repeat,
        snoozedUntil: task.alarm.snoozedUntil
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update alarm
router.put('/:alarmId', auth, async (req, res) => {
  try {
    const { error } = alarmSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { time, enabled = true, sound = 'default', vibration = true, repeat } = req.body;
    
    const task = await Task.findOne({
      _id: req.params.alarmId,
      ownerId: req.user._id
    });

    if (!task) {
      return res.status(404).json({ error: 'Alarm not found' });
    }

    // Validate alarm time format
    if (enabled && time && !task.validateAlarmTime(time)) {
      return res.status(400).json({ error: 'Invalid alarm time format. Use HH:MM or HH:MM AM/PM' });
    }

    // Prepare alarm data including repeat
    const alarmData = {
      enabled,
      time: enabled ? time : null,
      sound,
      vibration,
      snoozedUntil: null,
      lastTriggered: null,
      count: 0
    };

    // Add repeat if provided
    if (repeat) {
      alarmData.repeat = {
        enabled: repeat.enabled || false,
        days: repeat.days || []
      };
    }

    await task.setAlarm(alarmData);

    res.json({ 
      task, 
      message: 'Alarm updated successfully'
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;














