import { useState, useRef, useEffect } from 'react';
import { 
  Send, Image, Paperclip, Smile, ArrowLeft, MoreVertical, 
  Trash2, UserPlus, Users, X, Download, Mic, Loader, Info,
  User, Search, Plus
} from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const ChatWindow = ({ chat, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showDeleteGroup, setShowDeleteGroup] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { user, token } = useAuth();
  const { sendMessage, sendImageMessage, deleteMessage, addParticipants, removeParticipant, deleteChat } = useChat();

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || sending) return;

    setSending(true);
    try {
      if (selectedImage) {
        await sendImageMessage(chat._id, selectedImage);
        setSelectedImage(null);
        setImagePreview(null);
      } else {
        await sendMessage(chat._id, newMessage.trim());
        setNewMessage('');
      }
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please select a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      e.target.value = '';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      // Here you would typically emit a typing event to the server
      setTimeout(() => setIsTyping(false), 2000);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage(chat._id, messageId);
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const handleAddMembers = async (userIds) => {
    try {
      await addParticipants(chat._id, userIds);
      setShowAddMembers(false);
      toast.success('Members added successfully');
    } catch (error) {
      toast.error('Failed to add members');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await removeParticipant(chat._id, userId);
      toast.success('Member removed');
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all messages in this chat?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/v1/chat/${chat._id}/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to clear chat');

      const data = await response.json();
      if (data.success) {
        toast.success('Chat cleared successfully');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      await deleteChat(chat._id);
      setShowDeleteGroup(false);
      toast.success('Group deleted successfully');
      onBack();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Failed to delete group');
    }
  };

  const downloadFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000${fileUrl}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    const today = new Date();
    const messageDate = new Date(timestamp);
    const diffDays = Math.floor((today - messageDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return messageDate.toLocaleDateString();
  };

  const isSameSender = (messages, currentIndex) => {
    if (currentIndex === 0) return false;
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    return currentMessage.senderId._id === previousMessage.senderId._id;
  };

  const isSameDay = (messages, currentIndex) => {
    if (currentIndex === 0) return false;
    const currentMessage = messages[currentIndex];
    const previousMessage = messages[currentIndex - 1];
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    return currentDate === previousDate;
  };

  const canDeleteMessage = (message) => {
    if (!chat) return false;
    return message.senderId._id === user.id || 
           (chat.isGroup && chat.groupAdmin?._id === user.id);
  };

  const getChatName = () => {
    if (chat.isGroup) return chat.groupName;
    const otherParticipant = chat.participants?.find(p => p._id !== user.id);
    return otherParticipant?.name || 'Unknown User';
  };

  const getUserAvatar = (userData, size = 'h-8 w-8') => {
    if (userData.photoUrl) {
      return (
        <img
          src={`http://localhost:5000${userData.photoUrl}`}
          alt={userData.name}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white shadow-sm`}>
        <span className="text-white font-semibold text-xs">
          {userData.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  const isGroupAdmin = () => {
    return chat.isGroup && chat.groupAdmin?._id === user.id;
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Welcome to Messages
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Select a chat to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-emerald-100 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-800 shadow-sm">
        <div className="flex items-center space-x-3">
          
          <button 
            onClick={onBack} 
            className="lg:hidden p-2 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </button>
          
          {getUserAvatar(
            chat.isGroup 
              ? { name: chat.groupName, photoUrl: chat.groupImage } 
              : chat.participants?.find(p => p._id !== user.id) || { name: getChatName() },
            'h-10 w-10'
          )}
          
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 dark:text-white">
              {getChatName()}
            </h3>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {chat.isGroup ? `${chat.participants?.length || 0} participants` : 'Online • Last seen recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {isTyping && (
            <div className="bg-emerald-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Typing...</p>
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowOptions(!showOptions)}
              className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            
            {showOptions && (
              <div className="absolute right-0 top-12 bg-white dark:bg-gray-800 border border-emerald-100 dark:border-gray-700 rounded-xl shadow-lg z-10 w-48 overflow-hidden">
                {chat.isGroup && (
                  <>
                    <button
                      onClick={() => { setShowAddMembers(true); setShowOptions(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 flex items-center transition-colors"
                    >
                      <UserPlus className="h-4 w-4 mr-2 text-emerald-600" />
                      Add Members
                    </button>
                    <button
                      onClick={() => { setShowGroupInfo(true); setShowOptions(false); }}
                      className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700 flex items-center transition-colors"
                    >
                      <Info className="h-4 w-4 mr-2 text-emerald-600" />
                      Group Info
                    </button>
                    {isGroupAdmin() && (
                      <button
                        onClick={() => { setShowDeleteGroup(true); setShowOptions(false); }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => { handleClearChat(); setShowOptions(false); }}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-white to-emerald-50/50 dark:from-gray-900 dark:to-gray-800/50">
        {chat.messages && chat.messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="text-4xl">👋</div>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Start a conversation
            </h3>
            <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
              Send your first message to get started. You can share text, images, and files.
            </p>
          </div>
        ) : (
          chat.messages && chat.messages.map((message, index) => {
            const isMe = message.senderId._id === user.id;
            const showAvatar = !isMe && !isSameSender(chat.messages, index);
            const showDate = !isSameDay(chat.messages, index);
            
            return (
              <div key={message._id || index}>
                {showDate && (
                  <div className="flex justify-center my-6">
                    <div className="bg-emerald-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1`}>
                  <div className={`flex max-w-xs lg:max-w-md ${isMe ? 'flex-row-reverse' : ''}`}>
                    {/* Avatar - Only show for first message or when sender changes */}
                    {showAvatar && (
                      <div className="flex items-end">
                        {getUserAvatar(message.senderId)}
                      </div>
                    )}
                    
                    {!showAvatar && !isMe && <div className="w-8"></div>}
                     
                    {/* Message Bubble */}
                    <div className={`${isMe ? 'mr-2' : 'ml-2'}`}>
                      {showAvatar && !isMe && (
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 ml-2">
                          {message.senderId.name}
                        </div>
                      )}
                      
                      <div className="group relative">
                        <div
                          className={`px-4 py-3 rounded-2xl transition-all duration-200 ${
                            isMe
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-br-md shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-md border border-emerald-100 dark:border-gray-700 shadow-sm'
                          }`}
                        >
                          {message.messageType === 'image' ? (
                            <div className="cursor-pointer group/image" onClick={() => window.open(`http://localhost:5000${message.fileUrl}`, '_blank')}>
                              <div className="overflow-hidden rounded-lg">
                                <img
                                  src={`http://localhost:5000${message.fileUrl}`}
                                  alt="Shared image"
                                  className="max-w-full h-auto max-h-64 object-cover transition-transform duration-300 group-hover/image:scale-105"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'block';
                                  }}
                                />
                              </div>
                              <div className="mt-2 text-center text-emerald-600 dark:text-emerald-400 flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity">
                                <Download className="h-4 w-4 mr-1" />
                                <span className="text-xs">View Image</span>
                              </div>
                            </div>
                          ) : message.messageType === 'file' ? (
                            <div className="flex items-center space-x-3 p-2 bg-emerald-50 dark:bg-gray-700 rounded-lg">
                              <div className="bg-emerald-100 dark:bg-gray-600 p-2 rounded-lg">
                                <Paperclip className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{message.fileName}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {Math.round(message.fileSize / 1024)} KB
                                </p>
                              </div>
                              <button
                                onClick={() => downloadFile(message.fileUrl, message.fileName)}
                                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm">{message.message}</p>
                          )}
                          
                          <div className={`text-xs mt-2 ${isMe ? 'text-emerald-100 text-right' : 'text-gray-500 dark:text-gray-400 text-right'}`}>
                            {formatTime(message.createdAt)}
                          </div>
                        </div>

                        {canDeleteMessage(message) && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                            title="Delete message"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="p-4 border-t border-emerald-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-lg border-2 border-emerald-100 shadow-sm"
              />
              <button
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-white">
                {selectedImage?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(selectedImage?.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t border-emerald-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={uploadingImage}
            title="Send image"
          >
            {uploadingImage ? (
              <Loader className="h-5 w-5 animate-spin" />
            ) : (
              <Image className="h-5 w-5" />
            )}
          </button>

          <button className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <Smile className="h-5 w-5" />
          </button>

          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 border border-emerald-200 dark:border-gray-600 rounded-full bg-emerald-50 dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12 transition-all duration-200"
              disabled={sending || uploadingImage}
            />
          </div>

          <button
            onClick={handleSendMessage}
            disabled={(!newMessage.trim() && !selectedImage) || sending || uploadingImage}
            className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md flex items-center justify-center"
            title="Send message"
          >
            {sending || uploadingImage ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <AddMembersModal
          chat={chat}
          onClose={() => setShowAddMembers(false)}
          onAddMembers={handleAddMembers}
          onRemoveMember={handleRemoveMember}
        />
      )}

      {/* Group Info Modal */}
      {showGroupInfo && (
        <GroupInfoModal
          chat={chat}
          onClose={() => setShowGroupInfo(false)}
          onRemoveMember={handleRemoveMember}
          onDeleteGroup={() => setShowDeleteGroup(true)}
          isAdmin={isGroupAdmin()}
        />
      )}

      {/* Delete Group Confirmation Modal */}
      {showDeleteGroup && (
        <Modal isOpen={true} onClose={() => setShowDeleteGroup(false)} title="Delete Group" size="sm">
          <div className="space-y-4">
            <div className="bg-red-100 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500 rounded-full mx-auto mb-3">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <p className="text-center text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this group? This action cannot be undone and all messages will be permanently deleted.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button onClick={() => setShowDeleteGroup(false)} variant="secondary" className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleDeleteGroup} variant="danger" className="flex-1">
                Delete Group
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// Add Members Modal Component
const AddMembersModal = ({ chat, onClose, onAddMembers, onRemoveMember }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user, token } = useAuth();

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/v1/chat/users/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to search users');
      
      const data = await response.json();
      if (data.success) {
        const filteredUsers = data.users.filter(
          u => !chat.participants.some(p => p._id === u._id) && u._id !== user.id
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search users');
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length >= 2) {
      searchUsers(query);
    } else {
      setSearchResults([]);
    }
  };

  const toggleUserSelection = (user) => {
    if (selectedUsers.some(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleAdd = () => {
    if (selectedUsers.length === 0) return;
    onAddMembers(selectedUsers.map(u => u._id));
    setSelectedUsers([]);
    setSearchQuery('');
  };

  const getUserAvatar = (userData, size = 'h-10 w-10') => {
    if (userData.photoUrl) {
      return (
        <img
          src={`http://localhost:5000${userData.photoUrl}`}
          alt={userData.name}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white shadow-sm`}>
        <span className="text-white font-semibold text-sm">
          {userData.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Manage Group Members" size="md">
      <div className="space-y-4">
        {/* Current Members */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-white mb-3">Current Members</h4>
          <div className="space-y-2">
            {chat.participants.map(participant => (
              <div key={participant._id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getUserAvatar(participant, 'h-10 w-10')}
                  <div>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{participant.name}</span>
                    {chat.groupAdmin?._id === participant._id && (
                      <span className="block text-xs text-emerald-600 dark:text-emerald-400">Admin</span>
                    )}
                  </div>
                </div>
                {chat.groupAdmin?._id === user.id && participant._id !== user.id && (
                  <button
                    onClick={() => onRemoveMember(participant._id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New Members */}
        <div>
          <h4 className="font-medium text-gray-800 dark:text-white mb-3">Add New Members</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-emerald-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          {selectedUsers.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <div key={user._id} className="flex items-center bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">{user.name}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="ml-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 max-h-40 overflow-y-auto">
            {searchResults.map(user => (
              <div
                key={user._id}
                onClick={() => toggleUserSelection(user)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedUsers.some(u => u._id === user._id)
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700'
                    : 'hover:bg-emerald-50 dark:hover:bg-gray-700'
                }`}
              >
                {getUserAvatar(user, 'h-10 w-10')}
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-800 dark:text-white">{user.name}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{user.email}</div>
                </div>
                {selectedUsers.some(u => u._id === user._id) && (
                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}

            {searchQuery && searchResults.length === 0 && (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No users found</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex space-x-3 pt-4 border-t border-emerald-100 dark:border-gray-700">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleAdd} 
            disabled={selectedUsers.length === 0}
            className="flex-1"
          >
            Add Members
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Group Info Modal Component
const GroupInfoModal = ({ chat, onClose, onRemoveMember, onDeleteGroup, isAdmin }) => {
  const { user } = useAuth();

  const getUserAvatar = (userData, size = 'h-10 w-10') => {
    if (userData.photoUrl) {
      return (
        <img
          src={`http://localhost:5000${userData.photoUrl}`}
          alt={userData.name}
          className={`${size} rounded-full object-cover border-2 border-white shadow-sm`}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      );
    }
    
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center border-2 border-white shadow-sm`}>
        <span className="text-white font-semibold text-sm">
          {userData.name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Group Information" size="md">
      <div className="space-y-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
            <span className="text-white font-bold text-2xl">
              {chat.groupName.charAt(0).toUpperCase()}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{chat.groupName}</h3>
          {chat.groupDescription && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">{chat.groupDescription}</p>
          )}
          <div className="mt-3 inline-flex items-center bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
            <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mr-1" />
            <span className="text-sm text-emerald-700 dark:text-emerald-300">
              {chat.participants.length} members
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-800 dark:text-white mb-3">Group Members</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {chat.participants.map(participant => (
              <div key={participant._id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getUserAvatar(participant, 'h-10 w-10')}
                  <div>
                    <div className="text-sm font-medium text-gray-800 dark:text-white">
                      {participant.name}
                      {participant._id === chat.groupAdmin._id && (
                        <span className="ml-2 text-xs text-emerald-600 dark:text-emerald-400">(Admin)</span>
                      )}
                      {participant._id === user.id && (
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(You)</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">{participant.email}</div>
                  </div>
                </div>
                
                {isAdmin && participant._id !== user.id && (
                  <button
                    onClick={() => onRemoveMember(participant._id)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                    title="Remove from group"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {isAdmin && (
          <Button onClick={onDeleteGroup} variant="danger" className="w-full">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Group
          </Button>
        )}

        <Button onClick={onClose} className="w-full">
          Close
        </Button>
      </div>
    </Modal>
  );
};

// Simple Check icon component
const Check = ({ className = "h-4 w-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default ChatWindow;






