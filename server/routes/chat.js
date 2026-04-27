const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Message = require('../models/Chat').Message;
const Chat = require('../models/Chat').Chat;
const User = require('../models/User');
const auth = require('../middleware/auth');
const {upload , chatImageUpload } = require('../utils/uploadConfig');
const router = express.Router();

const userRoutes = require('./users');


// Middleware to verify user can access chat
const verifyChatAccess = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id,
      deletedBy: { $ne: req.user._id }
    });

    
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    req.chat = chat;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Search users
router.get('/users/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.user._id }
    }).select('name email photoUrl').limit(10);

    res.json({ success: true, users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Failed to search users' });
  }
});

// Get all chats
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      deletedBy: { $ne: req.user._id }
    })
    .populate('participants', 'name email photoUrl')
    .populate('lastMessage')
    .populate('groupAdmin', 'name')
    .sort({ updatedAt: -1 });

    res.json({ success: true, chats });
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ success: false, error: 'Failed to load chats' });
  }
});

// Get specific chat
router.get('/:chatId', auth, verifyChatAccess, async (req, res) => {
  try {
    const chat = await Chat.findById(req.chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name')
      .populate('lastMessage');

    res.json({ success: true, chat });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to get chat' });
  }
});


// Create new chat - FIXED VERSION
router.post('/', auth, async (req, res) => {
  try {
    const { participantIds, isGroup, groupName, groupDescription } = req.body;
    const userId = req.user._id;

    
    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid participant IDs. Must be an array.' 
      });
    }

    // Convert string IDs to ObjectId and check if they're valid
    const validObjectIds = participantIds.filter(id => {
      try {
        return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
      } catch (error) {
        return false;
      }
    });

    if (validObjectIds.length !== participantIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'One or more participant IDs are invalid.' 
      });
    }

    // Check if users exist
    const existingUsers = await User.find({
      _id: { $in: validObjectIds }
    }).select('_id');

    if (existingUsers.length !== validObjectIds.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'One or more users not found.' 
      });
    }

    // For direct chats, check if chat already exists
    if (!isGroup && participantIds.length === 1) {
      const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { 
          $all: [userId, participantIds[0]], 
          $size: 2 
        },
        deletedBy: { $ne: userId }
      })
      .populate('participants', 'name email photoUrl')
      .populate('lastMessage');

      if (existingChat) {
      
        return res.json({ 
          success: true, 
          chat: existingChat,
          existing: true 
        });
      }
    }

    // Create new chat
    const chatData = {
      participants: [userId, ...participantIds],
      isGroup: isGroup || false
    };

    if (isGroup) {
      if (!groupName || groupName.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Group name is required' 
        });
      }
      
      chatData.groupName = groupName.trim();
      chatData.groupDescription = groupDescription ? groupDescription.trim() : '';
      chatData.groupAdmin = userId;
    }

    
    const chat = new Chat(chatData);
    await chat.save();

    // Populate the chat with user details
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name')
      .populate('lastMessage');

   
    res.status(201).json({ 
      success: true, 
      chat: populatedChat,
      existing: false 
    });
  } catch (error) {
    console.error('Create chat error:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: errors.join(', ') 
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create chat: ' + error.message 
    });
  }
});

router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user._id;

    

    // Verify user has access to the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!chat) {
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found or access denied' 
      });
    }

    const messages = await Message.find({ chatId })
      .populate('senderId', 'name photoUrl')
      .populate('reactions.userId', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({ 
      success: true, 
      messages: messages.reverse(),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get messages: ' + error.message 
    });
  }
});

// Send text message
router.post('/:chatId/messages/text', auth, verifyChatAccess, async (req, res) => {
  try {
    const { content } = req.body;
    const { chatId } = req.params;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    const message = new Message({
      chatId,
      senderId: req.user._id,
      message: content.trim(),
      messageType: 'text',
      readBy: [{ userId: req.user._id }]
    });

    await message.save();

    // Update chat's last message
    req.chat.lastMessage = message._id;
    req.chat.updatedAt = new Date();
    await req.chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name photoUrl')
      .populate('reactions.userId', 'name');

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message: populatedMessage
      });
    }

    res.json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});



// Image upload endpoint - FIXED VERSION
router.post('/:chatId/messages/image', auth, chatImageUpload.single('image'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;
    
   

    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No image file provided' 
      });
    }

    // Verify user has access to the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
      deletedBy: { $ne: userId }
    });

    if (!chat) {
      // Delete the uploaded file if chat not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ 
        success: false, 
        error: 'Chat not found or access denied' 
      });
    }

    const fileUrl = `/uploads/chat/${req.file.filename}`;

    // Create image message
    const message = new Message({
      chatId,
      senderId: userId,
      message: '📷 Image', // Default message for images
      messageType: 'image',
      fileUrl: fileUrl,
      fileName: req.file.originalname,
      readBy: [{ userId: userId }]
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate the message with sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name photoUrl')
      .populate('reactions.userId', 'name');

   

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${chatId}`).emit('new_message', {
        chatId,
        message: populatedMessage
      });
    }

    res.json({ 
      success: true, 
      message: populatedMessage 
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload image: ' + error.message 
    });
  }
});



// Add participants to group
router.post('/:chatId/participants', auth, verifyChatAccess, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // Check if chat is a group
    if (!req.chat.isGroup) {
      return res.status(400).json({ error: 'Cannot add participants to a direct chat' });
    }

    // Check if user is group admin
    if (req.chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only group admin can add participants' });
    }

    // Find users to add
    const usersToAdd = await User.find({ 
      _id: { $in: userIds } 
    }).select('_id name email photoUrl');

    if (usersToAdd.length === 0) {
      return res.status(400).json({ error: 'No valid users found to add' });
    }

    // Add users to participants list (avoid duplicates)
    const newParticipantIds = usersToAdd.map(user => user._id);
    const existingParticipantIds = req.chat.participants.map(p => p.toString());
    
    const uniqueNewParticipants = newParticipantIds.filter(
      id => !existingParticipantIds.includes(id.toString())
    );

    if (uniqueNewParticipants.length === 0) {
      return res.status(400).json({ error: 'All users are already in the group' });
    }

    req.chat.participants.push(...uniqueNewParticipants);
    await req.chat.save();

    // Populate the updated chat
    const updatedChat = await Chat.findById(req.chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name');

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.chat._id}`).emit('participants_added', {
        chatId: req.chat._id,
        participants: usersToAdd
      });
    }

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove participant from group
router.delete('/:chatId/participants/:userId', auth, verifyChatAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if chat is a group
    if (!req.chat.isGroup) {
      return res.status(400).json({ error: 'Cannot remove participants from a direct chat' });
    }

    // Check permissions - admin or self-removal
    const isAdmin = req.chat.groupAdmin.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Only admin can remove other participants' });
    }

    // Cannot remove admin
    if (userId === req.chat.groupAdmin.toString()) {
      return res.status(400).json({ error: 'Cannot remove group admin' });
    }

    // Remove user from participants
    req.chat.participants = req.chat.participants.filter(
      participantId => participantId.toString() !== userId
    );

    await req.chat.save();

    // Populate the updated chat
    const updatedChat = await Chat.findById(req.chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name');

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.chat._id}`).emit('participant_removed', {
        chatId: req.chat._id,
        userId
      });

      // If user removed themselves, notify them
      if (isSelf) {
        io.to(userId).emit('removed_from_group', {
          chatId: req.chat._id,
          chatName: req.chat.groupName
        });
      }
    }

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as read
router.post('/:chatId/messages/read', auth, verifyChatAccess, async (req, res) => {
  try {
    await Message.updateMany(
      {
        chatId: req.chat._id,
        senderId: { $ne: req.user._id },
        'readBy.userId': { $ne: req.user._id }
      },
      {
        $push: {
          readBy: {
            userId: req.user._id,
            readAt: new Date()
          }
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark messages as read' });
  }
});

// Delete message
router.delete('/:chatId/messages/:messageId', auth, verifyChatAccess, async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findOne({
      _id: messageId,
      chatId: req.chat._id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Check permissions - only sender or group admin can delete
    const canDelete = message.senderId.toString() === req.user._id.toString() || 
                     (req.chat.isGroup && req.chat.groupAdmin.toString() === req.user._id.toString());

    if (!canDelete) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Delete file from server if message is an image
    if (message.messageType === 'image' && message.fileUrl) {
      const filePath = path.join(__dirname, '..', message.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Message.deleteOne({ _id: messageId });

    // Update last message if needed
    if (req.chat.lastMessage && req.chat.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({ chatId: req.chat._id })
        .sort({ createdAt: -1 });
      req.chat.lastMessage = lastMessage ? lastMessage._id : null;
      await req.chat.save();
    }

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.chat._id}`).emit('message_deleted', {
        chatId: req.chat._id,
        messageId
      });
    }

    res.json({ 
      success: true, 
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add participants to group
router.post('/:chatId/participants', auth, verifyChatAccess, async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    // Check if chat is a group
    if (!req.chat.isGroup) {
      return res.status(400).json({ error: 'Cannot add participants to a direct chat' });
    }

    // Check if user is group admin
    if (req.chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only group admin can add participants' });
    }

    // Find users to add
    const usersToAdd = await User.find({ 
      _id: { $in: userIds } 
    }).select('_id name email photoUrl');

    if (usersToAdd.length === 0) {
      return res.status(400).json({ error: 'No valid users found to add' });
    }

    // Add users to participants list (avoid duplicates)
    const newParticipantIds = usersToAdd.map(user => user._id);
    const existingParticipantIds = req.chat.participants.map(p => p.toString());
    
    const uniqueNewParticipants = newParticipantIds.filter(
      id => !existingParticipantIds.includes(id.toString())
    );

    if (uniqueNewParticipants.length === 0) {
      return res.status(400).json({ error: 'All users are already in the group' });
    }

    req.chat.participants.push(...uniqueNewParticipants);
    await req.chat.save();

    // Populate the updated chat
    const updatedChat = await Chat.findById(req.chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name');

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.chat._id}`).emit('participants_added', {
        chatId: req.chat._id,
        participants: usersToAdd
      });
    }

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove participant from group
router.delete('/:chatId/participants/:userId', auth, verifyChatAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if chat is a group
    if (!req.chat.isGroup) {
      return res.status(400).json({ error: 'Cannot remove participants from a direct chat' });
    }

    // Check permissions - admin or self-removal
    const isAdmin = req.chat.groupAdmin.toString() === req.user._id.toString();
    const isSelf = userId === req.user._id.toString();

    if (!isAdmin && !isSelf) {
      return res.status(403).json({ error: 'Only admin can remove other participants' });
    }

    // Cannot remove admin
    if (userId === req.chat.groupAdmin.toString()) {
      return res.status(400).json({ error: 'Cannot remove group admin' });
    }

    // Remove user from participants
    req.chat.participants = req.chat.participants.filter(
      participantId => participantId.toString() !== userId
    );

    await req.chat.save();

    // Populate the updated chat
    const updatedChat = await Chat.findById(req.chat._id)
      .populate('participants', 'name email photoUrl')
      .populate('groupAdmin', 'name');

    // WebSocket real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`chat_${req.chat._id}`).emit('participant_removed', {
        chatId: req.chat._id,
        userId
      });

      // If user removed themselves, notify them
      if (isSelf) {
        io.to(userId).emit('removed_from_group', {
          chatId: req.chat._id,
          chatName: req.chat.groupName
        });
      }
    }

    res.json({ success: true, chat: updatedChat });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear chat history
router.delete('/:chatId/clear', auth, verifyChatAccess, async (req, res) => {
  try {
    // Delete all messages in the chat
    await Message.deleteMany({ chatId: req.chat._id });
    
    // Reset last message
    req.chat.lastMessage = null;
    await req.chat.save();

    res.json({ success: true, message: 'Chat cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chat
router.delete('/:chatId', auth, verifyChatAccess, async (req, res) => {
  try {
    if (req.chat.isGroup && req.chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'Only group admin can delete the chat' });
    }

    if (!req.chat.isGroup) {
      // For direct chats, mark as deleted by user
      req.chat.deletedBy.push(req.user._id);
      await req.chat.save();
    } else {
      // For groups, delete all messages and the chat itself
      await Message.deleteMany({ chatId: req.chat._id });
      await Chat.findByIdAndDelete(req.chat._id);
    }

    res.json({ success: true, message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete chat' });
  }
});

module.exports = router;




