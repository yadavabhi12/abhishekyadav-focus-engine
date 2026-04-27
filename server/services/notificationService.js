const User = require('../models/User');

class NotificationService {
  constructor() {
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  async sendNotification({ userId, title, message, type, taskId, data = {} }) {
    try {
      const notification = {
        title,
        message,
        type,
        taskId,
        data,
        read: false,
        createdAt: new Date()
      };

      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { notifications: { $each: [notification], $position: 0 } } },
        { new: true }
      );

      if (this.io) {
        this.io.to(userId.toString()).emit('notification', {
          type: 'NOTIFICATION',
          notification: {
            _id: Date.now().toString(),
            ...notification
          }
        });
      }

      console.log(`📨 Notification sent to user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  async sendAlarmNotification({ userId, title, message, taskId, alarmData }) {
    try {
      const notification = {
        title: title || 'Task Alarm',
        message: message || 'Your task alarm is ringing!',
        type: 'alarm',
        taskId,
        data: alarmData,
        read: false,
        createdAt: new Date()
      };

      const user = await User.findByIdAndUpdate(
        userId,
        { $push: { notifications: { $each: [notification], $position: 0 } } },
        { new: true }
      );

      if (this.io) {
        this.io.to(userId.toString()).emit('alarm_notification', {
          type: 'ALARM_NOTIFICATION',
          notification: {
            _id: Date.now().toString(),
            ...notification
          }
        });
      }

      console.log(`🔔 Alarm notification sent to user ${userId}`);
      return notification;
    } catch (error) {
      console.error('Error sending alarm notification:', error);
      throw error;
    }
  }

  async getNotifications(userId, limit = 50) {
    try {
      const user = await User.findById(userId).select('notifications');
      return user.notifications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markAsRead(userId, notificationId) {
    try {
      await User.updateOne(
        { _id: userId, 'notifications._id': notificationId },
        { $set: { 'notifications.$.read': true } }
      );
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  async markAllAsRead(userId) {
    try {
      await User.updateOne(
        { _id: userId },
        { $set: { 'notifications.$[].read': true } }
      );
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  async deleteNotification(userId, notificationId) {
    try {
      await User.updateOne(
        { _id: userId },
        { $pull: { notifications: { _id: notificationId } } }
      );
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  async deleteAllNotifications(userId) {
    try {
      await User.updateOne(
        { _id: userId },
        { $set: { notifications: [] } }
      );
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  }
}

module.exports = new NotificationService();













