





// src/components/chat/NewChatModal.jsx
import { useState } from 'react';
import { X, Search, UserPlus, Users, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { chatService } from '../../services/chat';
import { toast } from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const NewChatModal = ({ onClose, onChatCreated }) => {
  const [step, setStep] = useState('type');
  const [chatType, setChatType] = useState('direct');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { createChat } = useChat();

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await chatService.searchUsers(query);
      if (response.success) {
        const filteredUsers = response.users.filter(
          u => !selectedUsers.some(su => su._id === u._id) && u._id !== user.id
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
    if (selectedUsers.some(u => u._id === user.id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };
const handleCreateChat = async () => {
  if (chatType === 'direct' && selectedUsers.length !== 1) {
    toast.error('Select exactly one user for direct chat');
    return;
  }

  if (chatType === 'group' && selectedUsers.length < 1) {
    toast.error('Select at least one user for group chat');
    return;
  }

  if (chatType === 'group' && !groupName.trim()) {
    toast.error('Group name is required');
    return;
  }

  setLoading(true);
  try {
    // Extract just the user IDs (not the full user objects)
    const participantIds = selectedUsers.map(user => user._id);
    
    const chat = await createChat(
      participantIds,
      chatType === 'group',
      chatType === 'group' ? {
        groupName: groupName.trim(),
        groupDescription: groupDescription.trim()
      } : {}
    );

    toast.success(chatType === 'group' ? 'Group created successfully!' : 'Chat started!');
    onChatCreated(chat);
    onClose();
  } catch (error) {
    console.error('Create chat error:', error);
    // Error message is already handled in createChat function
  } finally {
    setLoading(false);
  }
};
  

  const renderStep = () => {
    switch (step) {
      case 'type':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
              Start New Chat
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setChatType('direct');
                  setStep('users');
                }}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center group"
              >
                <UserPlus className="h-12 w-12 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Direct Message</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Chat with one person
                </p>
              </button>

              <button
                onClick={() => {
                  setChatType('group');
                  setStep('users');
                }}
                className="p-6 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-green-500 dark:hover:border-green-500 transition-colors text-center group"
              >
                <Users className="h-12 w-12 text-green-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h4 className="font-semibold text-gray-900 dark:text-white">Group Chat</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Create a group conversation
                </p>
              </button>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('type')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Back
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {chatType === 'group' ? 'Add Group Members' : 'Select User'}
              </h3>
              <div className="w-6"></div>
            </div>

            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
              icon={Search}
            />

            {selectedUsers.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Selected {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm text-blue-800 dark:text-blue-200">
                        {user.name}
                      </span>
                      <button
                        onClick={() => toggleUserSelection(user)}
                        className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="max-h-60 overflow-y-auto">
              {searchResults.map(user => (
                <div
                  key={user.id}
                  onClick={() => toggleUserSelection(user)}
                  className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedUsers.some(u => u._id === user.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  {user.photoUrl ? (
                    <img
                      src={`http://localhost:5000${user.photoUrl}`}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                  {selectedUsers.some(u => u._id === user.id) && (
                    <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              ))}

              {searchQuery && searchResults.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users found
                </div>
              )}
            </div>

            <Button
              onClick={() => chatType === 'group' ? setStep('group-info') : handleCreateChat()}
              disabled={chatType === 'direct' ? selectedUsers.length !== 1 : selectedUsers.length === 0}
              className="w-full"
            >
              {chatType === 'group' ? 'Next →' : 'Start Chat'}
            </Button>
          </div>
        );

      case 'group-info':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('users')}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
              >
                ← Back
              </button>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Group Details
              </h3>
              <div className="w-6"></div>
            </div>

            <Input
              label="Group Name *"
              placeholder="Enter group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Group Description
              </label>
              <textarea
                placeholder="Optional group description"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Group Members ({selectedUsers.length + 1})
              </h4>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full">
                  <span className="text-sm text-blue-800 dark:text-blue-200">
                    {user.name} (You)
                  </span>
                </div>
                
                {selectedUsers.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center bg-gray-100 dark:bg-gray-600 px-3 py-1 rounded-full"
                  >
                    <span className="text-sm text-gray-800 dark:text-gray-200">
                      {user.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCreateChat}
              disabled={!groupName.trim() || loading}
              loading={loading}
              className="w-full"
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </Button>
          </div>
        );
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Chat" size="md">
      <div className="max-h-96 overflow-y-auto">
        {renderStep()}
      </div>
    </Modal>
  );
};

export default NewChatModal;





