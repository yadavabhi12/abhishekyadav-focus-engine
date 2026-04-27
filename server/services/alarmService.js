const cron = require('node-cron');
const parser = require('cron-parser');
const Task = require('../models/Task');
const User = require('../models/User');
const notificationService = require('./notificationService');

class AlarmService {
  constructor() {
    this.activeAlarms = new Map();
    this.snoozedAlarms = new Map();
    this.schedulers = [];
    this.isRunning = false;
  }

 // services/alarmService.js - Enhanced checkAlarms method
async checkAlarms(io) {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const today = now.toISOString().split('T')[0];

    console.log(`🔔 Checking alarms for ${today} at ${currentTime}, day: ${currentDay}`);

    // Find all tasks with active alarms
    const tasksWithAlarms = await Task.find({
      'alarm.enabled': true,
      completed: false,
      $or: [
        { 'alarm.snoozedUntil': { $exists: false } },
        { 'alarm.snoozedUntil': null },
        { 'alarm.snoozedUntil': { $lte: now } }
      ]
    })
    .populate('ownerId', 'name email settings notifications')
    .populate('assignedTo', 'name email settings');

    for (const task of tasksWithAlarms) {
      try {
        // Check if alarm should trigger now
        const shouldTrigger = task.shouldTriggerAlarm(currentTime, currentDay);
        
        if (!shouldTrigger) {
          continue;
        }

        // Prevent duplicate triggers within 1 minute
        const alarmKey = `${task._id}_${task.alarm.time}`;
        const lastTriggered = this.activeAlarms.get(alarmKey);
        if (lastTriggered && (now - lastTriggered) < 60000) {
          continue;
        }

        // Mark as triggered
        this.activeAlarms.set(alarmKey, now);

        // Update task alarm state
        await task.triggerAlarm();

        // Notify owner
        if (task.ownerId?.settings?.notifications) {
          await this.sendAlarmNotification(task, task.ownerId, io);
        }

        // Notify assigned user if different from owner
        if (
          task.assignedTo &&
          task.assignedTo._id.toString() !== task.ownerId._id.toString() &&
          task.assignedTo.settings?.notifications
        ) {
          await this.sendAlarmNotification(task, task.assignedTo, io);
        }

        console.log(`✅ Alarm triggered for task: ${task.title}`);
      } catch (taskError) {
        console.error(`Error processing alarm for task ${task._id}:`, taskError);
      }
    }

    // Check for snoozed alarms that need to trigger again
    await this.checkSnoozedAlarms(io);

    // Cleanup old alarms
    this.cleanupOldAlarms();
  } catch (error) {
    console.error('Error checking alarms:', error);
  }
}
  async checkSnoozedAlarms(io) {
    const now = new Date();

    for (const [alarmKey, snoozeTime] of this.snoozedAlarms.entries()) {
      if (now >= snoozeTime) {
        const [taskId] = alarmKey.split('_');

        try {
          const task = await Task.findById(taskId)
            .populate('ownerId', 'name email settings notifications')
            .populate('assignedTo', 'name email settings');

          if (task && task.alarm.enabled) {
            if (task.ownerId?.settings?.notifications) {
              await this.sendAlarmNotification(task, task.ownerId, io, true);
            }

            if (
              task.assignedTo &&
              task.assignedTo._id.toString() !== task.ownerId._id.toString() &&
              task.assignedTo.settings?.notifications
            ) {
              await this.sendAlarmNotification(task, task.assignedTo, io, true);
            }

            console.log(`✅ Snoozed alarm triggered for task: ${task.title}`);
          }

          this.snoozedAlarms.delete(alarmKey);
        } catch (error) {
          console.error(`Error processing snoozed alarm for task ${taskId}:`, error);
          this.snoozedAlarms.delete(alarmKey);
        }
      }
    }
  }

  async sendAlarmNotification(task, user, io, isSnoozed = false) {
    const message = isSnoozed
      ? `"${task.title}" - Snoozed alarm!`
      : `"${task.title}" is scheduled for now`;

    try {
      const notification = await notificationService.sendNotification({
        userId: user._id,
        title: isSnoozed ? 'Snoozed Alarm' : 'Task Reminder',
        message,
        type: 'alarm',
        taskId: task._id,
        data: {
          alarmId: task._id.toString(),
          action: 'alarm',
          sound: task.alarm.sound,
          vibration: task.alarm.vibration,
          isSnoozed
        }
      });

      if (io?.to) {
        io.to(user._id.toString()).emit('alarm_triggered', {
          alarmId: task._id.toString(),
          taskId: task._id,
          taskTitle: task.title,
          message,
          time: task.alarm.time,
          sound: task.alarm.sound,
          vibration: task.alarm.vibration,
          isSnoozed,
          notificationId: notification ? notification._id : null
        });
      }
    } catch (error) {
      console.error('Error sending alarm notification:', error);
    }
  }

  addSnoozedAlarm(taskId, alarmTime, snoozeMinutes) {
    const alarmKey = `${taskId}_${alarmTime}`;
    const snoozeTime = new Date();
    snoozeTime.setMinutes(snoozeTime.getMinutes() + snoozeMinutes);
    this.snoozedAlarms.set(alarmKey, snoozeTime);

    setTimeout(() => {
      if (this.snoozedAlarms.has(alarmKey)) {
        this.snoozedAlarms.delete(alarmKey);
      }
    }, snoozeMinutes * 60 * 1000 * 2);
  }

  cleanupOldAlarms() {
    const now = Date.now();
    for (const [key, timestamp] of this.activeAlarms.entries()) {
      if (now - timestamp > 300000) {
        this.activeAlarms.delete(key);
      }
    }
  }

  startScheduler(io) {
    if (this.isRunning) {
      console.log('Alarm service already running');
      return;
    }

    // Every minute
    const alarmExpr = '* * * * *';
    const alarmScheduler = cron.schedule(alarmExpr, () => this.checkAlarms(io));
    this.schedulers.push(alarmScheduler);

    // Every 30s for snoozes
    const snoozeExpr = '*/30 * * * * *';
    const snoozeScheduler = cron.schedule(snoozeExpr, () => this.checkSnoozedAlarms(io));
    this.schedulers.push(snoozeScheduler);

    this.isRunning = true;
    console.log('✅ Alarm scheduler started');

    // Show next 3 alarm checks
    try {
      const interval = parser.parseExpression(alarmExpr);
      console.log('📅 Next 3 alarm checks:');
      for (let i = 0; i < 3; i++) {
        console.log('-', interval.next().toDate().toLocaleString());
      }
    } catch (err) {
      console.error('❌ Error parsing cron expression:', err.message);
    }
  }

  stopScheduler() {
    this.schedulers.forEach(scheduler => scheduler.stop());
    this.schedulers = [];
    this.isRunning = false;
    console.log('⏹️ Alarm scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      activeAlarms: this.activeAlarms.size,
      snoozedAlarms: this.snoozedAlarms.size,
      nextCheck: new Date(Date.now() + 60000)
    };
  }

  async triggerTestAlarm(io, taskId) {
    try {
      const task = await Task.findById(taskId)
        .populate('ownerId', 'name email settings notifications')
        .populate('assignedTo', 'name email settings');

      if (!task) {
        return { success: false, error: 'Task not found' };
      }

      if (!task.alarm.enabled) {
        return { success: false, error: 'Alarm not enabled for this task' };
      }

      if (task.ownerId?.settings?.notifications) {
        await this.sendAlarmNotification(task, task.ownerId, io, false);
      }

      if (
        task.assignedTo &&
        task.assignedTo._id.toString() !== task.ownerId._id.toString() &&
        task.assignedTo.settings?.notifications
      ) {
        await this.sendAlarmNotification(task, task.assignedTo, io, false);
      }

      console.log(`✅ Test alarm triggered for task: ${task.title}`);
      return { success: true, message: 'Test alarm triggered' };
    } catch (error) {
      console.error('Error triggering test alarm:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AlarmService();
















