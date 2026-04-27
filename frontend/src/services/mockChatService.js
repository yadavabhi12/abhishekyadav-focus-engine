// src/services/mockChatService.js
// Mock data for development when backend is not available
export const mockChatService = {
  getChats: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockChats = [
      {
        _id: '1',
        isGroup: false,
        participants: [
          { _id: 'user1', name: 'Abhishek', email: 'abhishek@example.com', photoUrl: null },
          { _id: 'current-user', name: 'You', email: 'you@example.com', photoUrl: null }
        ],
        lastMessage: {
          _id: 'm1',
          senderId: { _id: 'user1', name: 'Abhishek' },
          message: 'aur kaya chal raha hai',
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          messageType: 'text'
        },
        updatedAt: new Date().toISOString()
      },
      {
        _id: '2',
        isGroup: false,
        participants: [
          { _id: 'user2', name: 'Abhishek', email: 'abhishek2@example.com', photoUrl: null },
          { _id: 'current-user', name: 'You', email: 'you@example.com', photoUrl: null }
        ],
        lastMessage: {
          _id: 'm2',
          senderId: { _id: 'user2', name: 'Abhishek' },
          message: 'Hello there!',
          createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          messageType: 'text'
        },
        updatedAt: new Date().toISOString()
      }
    ];
    
    return { success: true, chats: mockChats };
  },

  getMessages: async (chatId) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockMessages = [
      {
        _id: 'm1',
        senderId: { _id: 'user1', name: 'Abhishek', photoUrl: null },
        message: 'Hi there!',
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        messageType: 'text'
      },
      {
        _id: 'm2',
        senderId: { _id: 'current-user', name: 'You', photoUrl: null },
        message: 'Hello! How are you?',
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        messageType: 'text'
      },
      {
        _id: 'm3',
        senderId: { _id: 'user1', name: 'Abhishek', photoUrl: null },
        message: 'I am good, thanks! aur kaya chal raha hai',
        createdAt: new Date().toISOString(),
        messageType: 'text'
      }
    ];
    
    return { success: true, messages: mockMessages };
  }
};

// Update chat service to use mock data in development
export const getChatService = () => {
  // Use mock service in development if API fails
  if (import.meta.env.DEV) {
    const originalChatService = { ...chatService };
    
    return {
      ...originalChatService,
      getChats: async () => {
        try {
          const result = await originalChatService.getChats();
          return result;
        } catch (error) {
          console.log('Falling back to mock data for chats');
          return mockChatService.getChats();
        }
      },
      getMessages: async (chatId) => {
        try {
          const result = await originalChatService.getMessages(chatId);
          return result;
        } catch (error) {
          console.log('Falling back to mock data for messages');
          return mockChatService.getMessages(chatId);
        }
      }
    };
  }
  
  return chatService;
};