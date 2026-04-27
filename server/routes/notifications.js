const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all notifications for user
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const user = await User.findById(req.user._id);
    
    // Sort notifications by createdAt descending and paginate
    const notifications = user.notifications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice((page - 1) * limit, page * limit);
    
    res.json({ 
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: user.notifications.length,
        pages: Math.ceil(user.notifications.length / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notification = user.notifications.id(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    notification.read = true;
    await user.save();
    
    res.json({ 
      message: 'Notification marked as read',
      notification 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.notifications.forEach(notification => {
      notification.read = true;
    });
    
    await user.save();
    
    res.json({ 
      message: 'All notifications marked as read',
      count: user.notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete single notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const notification = user.notifications.id(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    user.notifications.pull({ _id: req.params.id });
    await user.save();
    
    res.json({ 
      message: 'Notification deleted successfully',
      deletedId: req.params.id
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all notifications
router.delete('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const deletedCount = user.notifications.length;
    
    user.notifications = [];
    await user.save();
    
    res.json({ 
      message: 'All notifications deleted successfully',
      count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const unreadCount = user.notifications.filter(n => !n.read).length;
    
    res.json({ 
      count: unreadCount,
      total: user.notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear expired notifications (older than 30 days)
router.post('/clear-expired', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const initialCount = user.notifications.length;
    user.notifications = user.notifications.filter(
      notification => new Date(notification.createdAt) > thirtyDaysAgo
    );
    
    await user.save();
    
    res.json({ 
      message: 'Expired notifications cleared',
      cleared: initialCount - user.notifications.length,
      remaining: user.notifications.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;











