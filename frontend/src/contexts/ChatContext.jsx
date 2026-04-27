import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chat';
import { toast } from 'react-hot-toast';
import { listenToEvent, removeListener } from '../services/websocket';

export const ChatContext = createContext();

const chatReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_CHATS':
      return { ...state, chats: action.payload, loading: false };
    case 'ADD_CHAT':
      return { ...state, chats: [action.payload, ...state.chats] };
    case 'UPDATE_CHAT':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat._id === action.payload._id ? action.payload : chat
        )
      };
    case 'REMOVE_CHAT':
      return {
        ...state,
        chats: state.chats.filter(chat => chat._id !== action.payload)
      };
    case 'SET_ACTIVE_CHAT':
      return { ...state, activeChat: action.payload };
    case 'ADD_MESSAGE':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat._id === action.payload.chatId
            ? { ...chat, lastMessage: action.payload.message, updatedAt: new Date() }
            : chat
        ),
        activeChat: state.activeChat?._id === action.payload.chatId
          ? {
              ...state.activeChat,
              messages: [...(state.activeChat.messages || []), action.payload.message]
            }
          : state.activeChat
      };
    case 'REMOVE_MESSAGE':
      return {
        ...state,
        activeChat: state.activeChat
          ? {
              ...state.activeChat,
              messages: state.activeChat.messages.filter(m => m._id !== action.payload)
            }
          : state.activeChat
      };
    case 'SET_MESSAGES':
      return {
        ...state,
        activeChat: state.activeChat
          ? { ...state.activeChat, messages: action.payload }
          : state.activeChat
      };
    case 'UPDATE_CHAT_PARTICIPANTS':
      return {
        ...state,
        chats: state.chats.map(chat =>
          chat._id === action.payload.chatId
            ? { ...chat, participants: action.payload.participants }
            : chat
        ),
        activeChat: state.activeChat?._id === action.payload.chatId
          ? { ...state.activeChat, participants: action.payload.participants }
          : state.activeChat
      };
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    default:
      return state;
  }
};

const initialState = {
  chats: [],
  activeChat: null,
  loading: true,
  unreadCount: 0
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, token } = useAuth();

  // Setup WebSocket listeners
  const setupWebSocketListeners = useCallback(() => {
    listenToEvent('new_message', (data) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: { chatId: data.chatId, message: data.message }
      });
    });

    listenToEvent('message_deleted', (data) => {
      dispatch({
        type: 'REMOVE_MESSAGE',
        payload: data.messageId
      });
    });

    listenToEvent('participants_added', (data) => {
      dispatch({
        type: 'UPDATE_CHAT_PARTICIPANTS',
        payload: {
          chatId: data.chatId,
          participants: data.participants
        }
      });
    });

    listenToEvent('participant_removed', (data) => {
      dispatch({
        type: 'UPDATE_CHAT_PARTICIPANTS',
        payload: {
          chatId: data.chatId,
          participants: data.participants
        }
      });
    });
  }, []);

  // Load chats
  const loadChats = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const response = await chatService.getChats();
      if (response.success) {
        dispatch({ type: 'SET_CHATS', payload: response.chats });
      }
    } catch (error) {
      console.error('Error loading chats:', error);
      toast.error('Failed to load chats');
    }
  }, []);



  // Load messages - FIXED VERSION
const loadMessages = useCallback(async (chatId) => {
  try {
    console.log('Loading messages for chat:', chatId);
    
    const response = await chatService.getMessages(chatId);
    if (response.success) {
      console.log('Messages loaded successfully:', response.messages.length);
      dispatch({ type: 'SET_MESSAGES', payload: response.messages });
    }
  } catch (error) {
    console.error('Error loading messages:', error);
    
    // Don't show toast for 404 errors (chat might not have messages yet)
    if (error.response?.status !== 404) {
      toast.error('Failed to load messages');
    }
  }
}, []);

  // Send text message
  const sendMessage = useCallback(async (chatId, content) => {
    try {
      const response = await chatService.sendMessage(chatId, content);
      if (response.success) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { chatId, message: response.message }
        });
        return response.message;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  }, []);

  // Send image message
  const sendImageMessage = useCallback(async (chatId, imageFile) => {
    try {
      const response = await chatService.sendImageMessage(chatId, imageFile);
      if (response.success) {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: { chatId, message: response.message }
        });
        return response.message;
      }
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image');
      throw error;
    }
  }, []);

  // Delete message
  const deleteMessage = useCallback(async (chatId, messageId) => {
    try {
      const response = await chatService.deleteMessage(chatId, messageId);
      if (response.success) {
        dispatch({ type: 'REMOVE_MESSAGE', payload: messageId });
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
      throw error;
    }
  }, []);

  // Add participants to group
  const addParticipants = useCallback(async (chatId, userIds) => {
    try {
      const response = await chatService.addParticipants(chatId, userIds);
      if (response.success) {
        dispatch({
          type: 'UPDATE_CHAT_PARTICIPANTS',
          payload: {
            chatId,
            participants: response.chat.participants
          }
        });
        return response.chat;
      }
    } catch (error) {
      console.error('Error adding participants:', error);
      toast.error(error.response?.data?.error || 'Failed to add participants');
      throw error;
    }
  }, []);

  // Remove participant from group
  const removeParticipant = useCallback(async (chatId, userId) => {
    try {
      const response = await chatService.removeParticipant(chatId, userId);
      if (response.success) {
        // If user removed themselves, remove the chat from the list
        if (user && userId === user._id) {
          dispatch({ type: 'REMOVE_CHAT', payload: chatId });
          dispatch({ type: 'SET_ACTIVE_CHAT', payload: null });
        } else {
          // Update the chat with new participants list
          dispatch({
            type: 'UPDATE_CHAT_PARTICIPANTS',
            payload: {
              chatId,
              participants: response.chat.participants
            }
          });
        }
        return response.chat;
      }
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error(error.response?.data?.error || 'Failed to remove participant');
      throw error;
    }
  }, [user]);

  // Clear chat history
  const clearChat = useCallback(async (chatId) => {
    try {
      const response = await chatService.clearChat(chatId);
      if (response.success) {
        // Reload chats to reflect the cleared chat
        await loadChats();
        toast.success('Chat cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
      throw error;
    }
  }, [loadChats]);

  // Delete chat
  const deleteChat = useCallback(async (chatId) => {
    try {
      const response = await chatService.deleteChat(chatId);
      if (response.success) {
        dispatch({ type: 'REMOVE_CHAT', payload: chatId });
        return true;
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.data?.error || 'Failed to delete chat');
      throw error;
    }
  }, []);



// Create new chat - FIXED VERSION
const createChat = useCallback(async (participantIds, isGroup = false, groupData = {}) => {
  try {
    console.log('Creating chat with:', { participantIds, isGroup, groupData });
    
    // Ensure participantIds are strings (not MongoDB objects)
    const stringParticipantIds = participantIds.map(id => id.toString ? id.toString() : id);
    
    const response = await chatService.createChat(stringParticipantIds, isGroup, groupData);
    
    if (response.success) {
      console.log('Chat created successfully:', response.chat);
      
      // If it's a direct chat and one already exists, return the existing chat
      if (!isGroup && response.existing) {
        return response.chat;
      }
      
      dispatch({ type: 'ADD_CHAT', payload: response.chat });
      return response.chat;
    } else {
      throw new Error(response.error || 'Failed to create chat');
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    
    // Extract meaningful error message
    let errorMessage = 'Failed to create chat';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.error || error.response.statusText;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'Network error - please check your connection';
    } else {
      // Something else happened
      errorMessage = error.message;
    }
    
    toast.error(errorMessage);
    throw new Error(errorMessage);
  }
}, []);

  

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (chatId) => {
    try {
      await chatService.markMessagesRead(chatId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Set active chat
  const setActiveChat = useCallback((chat) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: chat });
    if (chat) {
      loadMessages(chat._id);
      markMessagesAsRead(chat._id);
    }
  }, [loadMessages, markMessagesAsRead]);

  useEffect(() => {
    // Only load chats if user is authenticated
    if (user && token) {
      loadChats();
      setupWebSocketListeners();
    } else {
      // If user is not authenticated, clear chats and set loading to false
      dispatch({ type: 'SET_CHATS', payload: [] });
      dispatch({ type: 'SET_LOADING', payload: false });
    }

    return () => {
      removeListener('new_message');
      removeListener('message_deleted');
      removeListener('participants_added');
      removeListener('participant_removed');
    };
  }, [user, token, loadChats, setupWebSocketListeners]);






  const value = {
    chats: state.chats,
    activeChat: state.activeChat,
    loading: state.loading,
    unreadCount: state.unreadCount,
    loadChats,
    sendMessage,
    sendImageMessage,
    deleteMessage,
    addParticipants,
    removeParticipant,
    clearChat,
    deleteChat,
    createChat,
    setActiveChat,
    markMessagesAsRead
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};






