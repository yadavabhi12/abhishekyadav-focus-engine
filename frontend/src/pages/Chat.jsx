
import { useState, useEffect } from 'react';
import { useChat } from '../contexts/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';

const Chat = () => {
  const { activeChat, setActiveChat } = useChat();
  const [showNewChat, setShowNewChat] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
  };

  const handleBack = () => {
    setActiveChat(null);
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className={`${activeChat && isMobile ? 'hidden' : 'block'} w-full lg:w-80 lg:block`}>
        <ChatSidebar
          onSelectChat={handleSelectChat}
          selectedChat={activeChat}
          onNewChat={() => setShowNewChat(true)}
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${!activeChat && isMobile ? 'hidden' : 'block'}`}>
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            onBack={handleBack}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to Messages
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select a chat to start messaging or create a new one
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onChatCreated={(chat) => {
            setActiveChat(chat);
            setShowNewChat(false);
          }}
        />
      )}
    </div>
  );
};

export default Chat;

