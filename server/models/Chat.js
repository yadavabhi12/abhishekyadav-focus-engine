const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  fileUrl: String,
  fileName: String,
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const chatSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: String,
  groupDescription: String,
  groupImage: String,
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

chatSchema.index({ participants: 1, updatedAt: -1 });
chatSchema.index({ isGroup: 1, updatedAt: -1 });
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });

chatSchema.statics.findOrCreateDirectChat = async function(user1Id, user2Id) {
  let chat = await this.findOne({
    isGroup: false,
    participants: { $all: [user1Id, user2Id], $size: 2 }
  }).populate('participants', 'name email photoUrl');

  if (!chat) {
    chat = new this({
      participants: [user1Id, user2Id],
      isGroup: false
    });
    await chat.save();
    chat = await this.findById(chat._id).populate('participants', 'name email photoUrl');
  }

  return chat;
};

module.exports = {
  Message: mongoose.model('Message', messageSchema),
  Chat: mongoose.model('Chat', chatSchema)
};




