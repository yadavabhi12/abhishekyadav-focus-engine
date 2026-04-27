import { useState, useEffect } from 'react';
import { MessageCircle, Search, Plus, Sparkles } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';

const ChatSidebar = ({ onSelectChat, selectedChat, onNewChat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { chats, loading } = useChat();
  const { user } = useAuth();

  const filteredChats = chats.filter(chat => {
    if (!searchTerm) return true;
    
    if (chat.isGroup) {
      return chat.groupName.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      const otherParticipant = chat.participants.find(p => p._id !== user._id);
      return otherParticipant?.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getChatName = (chat) => {
    if (chat.isGroup) return chat.groupName;
    const otherParticipant = chat.participants.find(p => p._id !== user._id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getLastMessage = (chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    if (chat.lastMessage.messageType === 'image') return '📷 Image';
    if (chat.lastMessage.messageType === 'file') return '📄 File';
    
    const content = chat.lastMessage.message || '';
    const isFromMe = chat.lastMessage.senderId._id === user._id;
    const prefix = isFromMe ? 'You: ' : '';
    
    return content.length > 30 
      ? prefix + content.substring(0, 30) + '...' 
      : prefix + content;
  };

  const getUserAvatar = (userData, size = 'h-12 w-12') => {
    if (userData.photoUrl) {
      return (
        <img
          src={`http://localhost:5000${userData.photoUrl}`}
          alt={userData.name}
          className={`${size} rounded-full object-cover`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center`}>
        <span className="text-white font-semibold text-lg">
          {userData.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-emerald-200 dark:border-emerald-800 h-full">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-8 bg-emerald-200 dark:bg-emerald-800 rounded mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-emerald-200 dark:bg-emerald-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-r border-emerald-200 dark:border-emerald-800 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
            Messages
          </h2>
          <button
            onClick={onNewChat}
            className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-emerald-200 dark:border-emerald-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-emerald-500 dark:text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm ? 'No chats found' : 'No conversations yet'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? 'Try a different search term' : 'Start a new conversation to get started'}
            </p>
            {!searchTerm && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Start Chatting
              </button>
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredChats.map(chat => (
              <div
                key={chat._id}
                onClick={() => onSelectChat(chat)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                  selectedChat?._id === chat._id
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-600 shadow-md'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getUserAvatar(
                    chat.isGroup 
                      ? { name: chat.groupName, photoUrl: chat.groupImage } 
                      : chat.participants?.find(p => p._id !== user._id) || { name: getChatName(chat) }
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {getChatName(chat)}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                          {formatTime(chat.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {getLastMessage(chat)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;



