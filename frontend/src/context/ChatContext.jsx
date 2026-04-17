import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socketRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Connect to Socket.io when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io('http://localhost:5000', {
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      socket.emit('user-online', user._id);
    });

    socket.on('online-users', (users) => {
      setOnlineUsers(users);
    });

    socket.on('receive-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-typing', ({ senderId }) => {
      setTypingUsers((prev) =>
        prev.includes(senderId) ? prev : [...prev, senderId]
      );
    });

    socket.on('user-stop-typing', ({ senderId }) => {
      setTypingUsers((prev) => prev.filter((id) => id !== senderId));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, user]);

  // Fetch user list
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        setUsers(res.data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, [isAuthenticated]);

  // Fetch messages when active chat changes
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setLoadingMessages(true);
      try {
        const res = await axios.get(`/api/messages/${activeChat._id}`);
        setMessages(res.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [activeChat]);

  // Send message
  const sendMessage = useCallback(
    async (content, messageType = 'text', fileUrl = '', fileName = '') => {
      if (!activeChat) return;

      try {
        const res = await axios.post('/api/messages', {
          receiverId: activeChat._id,
          content,
          messageType,
          fileUrl,
          fileName,
        });

        const newMessage = res.data;
        setMessages((prev) => [...prev, newMessage]);

        // Emit via socket
        if (socketRef.current) {
          socketRef.current.emit('send-message', {
            ...newMessage,
            receiverId: activeChat._id,
          });
        }

        // Stop typing
        emitStopTyping();

        return newMessage;
      } catch (error) {
        console.error('Error sending message:', error);
        throw error;
      }
    },
    [activeChat]
  );

  // Upload file
  const uploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }, []);

  // Typing events
  const emitTyping = useCallback(() => {
    if (!activeChat || !socketRef.current) return;

    socketRef.current.emit('typing', {
      senderId: user._id,
      receiverId: activeChat._id,
    });

    // Auto stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping();
    }, 3000);
  }, [activeChat, user]);

  const emitStopTyping = useCallback(() => {
    if (!activeChat || !socketRef.current) return;

    socketRef.current.emit('stop-typing', {
      senderId: user._id,
      receiverId: activeChat._id,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [activeChat, user]);

  // Search users
  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      const res = await axios.get('/api/users');
      setUsers(res.data);
      return;
    }

    try {
      const res = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
      setUsers(res.data);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  }, []);

  return (
    <ChatContext.Provider
      value={{
        users,
        activeChat,
        setActiveChat,
        messages,
        onlineUsers,
        typingUsers,
        loadingMessages,
        sendMessage,
        uploadFile,
        emitTyping,
        emitStopTyping,
        searchUsers,
        isUserOnline: (userId) => onlineUsers.includes(userId),
        isUserTyping: (userId) => typingUsers.includes(userId),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
