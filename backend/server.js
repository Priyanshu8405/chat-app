const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'WhatsApp Lite API is running' });
});

// ────────────────────────────────────────────
// Socket.io Real-Time Logic
// ────────────────────────────────────────────
const onlineUsers = new Map(); // userId -> socketId

io.on('connection', (socket) => {
  console.log(`⚡ Socket connected: ${socket.id}`);

  // User comes online
  socket.on('user-online', async (userId) => {
    onlineUsers.set(userId, socket.id);
    try {
      await User.findByIdAndUpdate(userId, { online: true });
    } catch (err) {
      console.error('Error updating online status:', err.message);
    }
    // Broadcast online users list to everyone
    io.emit('online-users', Array.from(onlineUsers.keys()));
    console.log(`✅ User online: ${userId}`);
  });

  // Real-time message
  socket.on('send-message', (data) => {
    const { receiverId } = data;
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('receive-message', data);
    }
  });

  // Typing indicators
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { senderId });
    }
  });

  socket.on('stop-typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { senderId });
    }
  });

  // Disconnect
  socket.on('disconnect', async () => {
    let disconnectedUserId = null;
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        onlineUsers.delete(userId);
        break;
      }
    }
    if (disconnectedUserId) {
      try {
        await User.findByIdAndUpdate(disconnectedUserId, {
          online: false,
          lastSeen: new Date(),
        });
      } catch (err) {
        console.error('Error updating offline status:', err.message);
      }
      io.emit('online-users', Array.from(onlineUsers.keys()));
      console.log(`❌ User offline: ${disconnectedUserId}`);
    }
  });
});

// ────────────────────────────────────────────
// Serve Frontend in Production
// ────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// ────────────────────────────────────────────
// MongoDB Connection & Server Start
// ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/chatapp';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('📦 MongoDB connected successfully');
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
