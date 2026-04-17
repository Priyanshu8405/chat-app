import { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import UserAvatar from './UserAvatar';
import Message from './Message';
import MessageInput from './MessageInput';

const ChatWindow = ({ onBack }) => {
  const { activeChat, messages, isUserOnline, isUserTyping, loadingMessages } = useChat();
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Empty state
  if (!activeChat) {
    return (
      <div className="chat-window">
        <div className="chat-empty">
          <div className="chat-empty-icon">💬</div>
          <h3>WhatsApp Lite</h3>
          <p>
            Send and receive messages in real-time. Select a user from the
            sidebar to start chatting.
          </p>
        </div>
      </div>
    );
  }

  const online = isUserOnline(activeChat._id);
  const typing = isUserTyping(activeChat._id);

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <button
          className="icon-btn mobile-back-btn"
          onClick={onBack}
          style={{ display: 'none' }}
        >
          ←
        </button>
        <UserAvatar name={activeChat.name} online={online} />
        <div className="chat-header-info">
          <div className="chat-header-name">{activeChat.name}</div>
          <div
            className={`chat-header-status ${typing ? 'typing' : online ? 'online' : ''}`}
          >
            {typing ? 'typing...' : online ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {loadingMessages ? (
          <div className="loading-container" style={{ height: 'auto', padding: '40px' }}>
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="chat-empty" style={{ padding: '40px' }}>
            <div className="chat-empty-icon" style={{ fontSize: '48px' }}>👋</div>
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <Message key={msg._id || index} message={msg} />
          ))
        )}

        {/* Typing indicator */}
        {typing && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span>{activeChat.name} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput />
    </div>
  );
};

export default ChatWindow;
