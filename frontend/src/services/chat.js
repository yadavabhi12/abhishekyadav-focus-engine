



import api from './api'

export const chatService = {
  getChats: async () => {
    const response = await api.get('/chat') // This will become http://localhost:5000/api/v1/chat
    return response.data
  },

  getChat: async (chatId) => {
    const response = await api.get(`/chat/${chatId}`)
    return response.data
  },

  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await api.get(`/chat/${chatId}/messages`, {
      params: { page, limit }
    })
    return response.data
  },

  sendMessage: async (chatId, message) => {
    const response = await api.post(`/chat/${chatId}/messages/text`, {
      content: message
    })
    return response.data
  },
sendImageMessage: async (chatId, imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await api.post(`/chat/${chatId}/messages/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
  ,

  createChat: async (participantIds, isGroup = false, groupData = {}) => {
    const response = await api.post('/chat', {
      participantIds,
      isGroup,
      ...groupData
    })
    return response.data
  },

  searchUsers: async (query) => {
    const response = await api.get('/chat/users/search', {
      params: { query }
    })
    return response.data
  },

  markMessagesRead: async (chatId) => {
    const response = await api.post(`/chat/${chatId}/messages/read`)
    return response.data
  },

  deleteChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`)
    return response.data
  },

  deleteMessage: async (chatId, messageId) => {
    const response = await api.delete(`/chat/${chatId}/messages/${messageId}`)
    return response.data
  },

  addParticipants: async (chatId, userIds) => {
    const response = await api.post(`/chat/${chatId}/participants`, {
      userIds
    })
    return response.data
  },

  removeParticipant: async (chatId, userId) => {
    const response = await api.delete(`/chat/${chatId}/participants/${userId}`)
    return response.data
  },

  clearChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}/clear`)
    return response.data
  }
  , 
  addParticipants: async (chatId, userIds) => {
    const response = await api.post(`/chat/${chatId}/participants`, {
      userIds
    });
    return response.data;
  },

  removeParticipant: async (chatId, userId) => {
    const response = await api.delete(`/chat/${chatId}/participants/${userId}`);
    return response.data;
  },

  deleteChat: async (chatId) => {
    const response = await api.delete(`/chat/${chatId}`);
    return response.data;
  }
}





