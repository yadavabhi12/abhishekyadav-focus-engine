const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Chat').Message;
const Chat = require('./models/Chat').Chat;

let io = null;

const initWebSocket = (server) => {
  console.log('Setting up WebSocket server...');
  
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:5174", "http://localhost:5175"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      const user = await User.findById(decoded.id).select('-passwordHash');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      console.log('WebSocket authentication successful for user:', user.email);
      next();
    } catch (error) {
      console.error('WebSocket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.userId, socket.user.email);

    socket.join(socket.userId);

    socket.on('join_chat', async (data) => {
      try {
        const { chatId } = data;
        
        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId,
          deletedBy: { $ne: socket.userId }
        });

        if (!chat) {
          socket.emit('error', { message: 'Access denied to chat room' });
          return;
        }

        socket.join(`chat_${chatId}`);
        console.log(`User ${socket.user.email} joined chat ${chatId}`);
        
        socket.to(`chat_${chatId}`).emit('user_joined', {
          userId: socket.userId,
          userName: socket.user.name,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('leave_chat', (data) => {
      const { chatId } = data;
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.user.email} left chat ${chatId}`);
    });

    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, messageType = 'text' } = data;
        
        console.log('Message received from', socket.user.email, ':', content);

        const chat = await Chat.findOne({
          _id: chatId,
          participants: socket.userId,
          deletedBy: { $ne: socket.userId }
        });

        if (!chat) {
          socket.emit('error', { message: 'Cannot send message to this chat' });
          return;
        }

        const message = new Message({
          chatId,
          senderId: socket.userId,
          message: content,
          messageType,
          readBy: [{ userId: socket.userId }]
        });

        await message.save();

        chat.lastMessage = message._id;
        chat.updatedAt = new Date();
        await chat.save();

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'name photoUrl')
          .populate('reactions.userId', 'name');

        io.to(`chat_${chatId}`).emit('new_message', {
          chatId,
          message: populatedMessage
        });

        console.log(`Message broadcast to chat ${chatId} from ${socket.user.email}`);
        
        chat.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId && !io.sockets.adapter.rooms.get(`chat_${chatId}`)?.has(participantId.toString())) {
            // Send notification to offline users
            io.to(participantId.toString()).emit('notification', {
              type: 'NEW_MESSAGE',
              chatId,
              message: `New message in ${chat.isGroup ? chat.groupName : 'chat'}`,
              timestamp: new Date()
            });
          }
        });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('mark_messages_read', async (data) => {
      try {
        const { chatId } = data;
        
        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: socket.userId },
            'readBy.userId': { $ne: socket.userId }
          },
          {
            $push: {
              readBy: {
                userId: socket.userId,
                readAt: new Date()
              }
            }
          }
        );

        socket.to(`chat_${chatId}`).emit('messages_read', {
          chatId,
          userId: socket.userId,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('typing_start', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        typing: true
      });
    });

    socket.on('typing_stop', (data) => {
      const { chatId } = data;
      socket.to(`chat_${chatId}`).emit('user_typing', {
        chatId,
        userId: socket.userId,
        userName: socket.user.name,
        typing: false
      });
    });

    // Add the delete_message event handler inside the connection
    socket.on('delete_message', async (data) => {
      try {
        const { chatId, messageId } = data;
        
        // Verify user can delete this message
        const message = await Message.findById(messageId);
        const chat = await Chat.findById(chatId);
        
        if (!message || !chat) {
          socket.emit('error', { message: 'Message or chat not found' });
          return;
        }

        const canDelete = message.senderId.toString() === socket.userId.toString() || 
                         (chat.isGroup && chat.groupAdmin.toString() === socket.userId.toString());

        if (!canDelete) {
          socket.emit('error', { message: 'Not authorized to delete this message' });
          return;
        }

        // Delete the message
        await Message.deleteOne({ _id: messageId });

        // Update last message if needed
        if (chat.lastMessage && chat.lastMessage.toString() === messageId) {
          const lastMessage = await Message.findOne({ chatId })
            .sort({ createdAt: -1 });
          chat.lastMessage = lastMessage ? lastMessage._id : null;
          await chat.save();
        }

        // Broadcast deletion to all chat participants
        chat.participants.forEach(participantId => {
          io.to(participantId.toString()).emit('message_deleted', {
            chatId,
            messageId
          });
        });

        console.log(`Message ${messageId} deleted by user ${socket.user.email}`);

      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('User disconnected:', socket.user.email, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error for user', socket.userId, ':', error);
    });
  });

  console.log('✅ WebSocket server setup completed');
  return io;
};

const sendToUser = (userId, data) => {
  if (!io) return;
  io.to(userId).emit('notification', data);
};

const broadcastToRoom = (roomId, data) => {
  if (!io) return;
  io.to(roomId).emit('chat_event', data);
};

const getIo = () => {
  return io;
};

module.exports = {
  initWebSocket,
  sendToUser,
  broadcastToRoom,
  getIo
};