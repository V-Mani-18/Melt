const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const Message = require('./models/Message'); // Add this at the top

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Import routes (assuming auth routes exist)
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
app.use('/api/users', authRoutes);

app.use(require('express-session')({ secret: 'secret', resave: false, saveUninitialized: false }));

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Setup Socket.IO server
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'], // Your frontend URL
    methods: ['GET', 'POST'],
    credentials: true
  },
  connectionStateRecovery: true
});

// Store socketId -> username mapping
const socketUsernames = {};
let onlineUserIds = new Set();
let usersInChat = {}; // { userId: chatWithId }

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join room
  socket.on('join_room', async (userId, username) => {
    console.log('Socket joining user room:', userId);
    socket.join(userId);
    socketUsernames[socket.id] = username;
    onlineUserIds.add(userId);
    console.log(`Socket ${socket.id} joined user room ${userId}`);

    // Deliver undelivered messages for this user
    const undelivered = await Message.find({ receiverId: userId, delivered: false });
    undelivered.forEach(msg => {
      socket.emit('receive_message', msg);
    });

    // Mark as delivered
    await Message.updateMany({ receiverId: userId, delivered: false }, { $set: { delivered: true } });
    io.emit('online_users', Array.from(onlineUserIds));
  });

  // Leave room
  socket.on('leave_room', (roomId) => {
    socket.leave(roomId);
    console.log(`User left room: ${roomId}`);
  });

  // Send message and broadcast to room
  socket.on('send_message', (message, callback) => {
    try {
      // Check if both users are online
      const senderOnline = onlineUserIds.has(message.senderId.toString());
      const receiverOnline = onlineUserIds.has(message.receiverId.toString());
      if (senderOnline && receiverOnline) {
        io.to(message.roomId).emit('receive_message', message);
        console.log(`Broadcasted to room ${message.roomId}`);
        if (typeof callback === 'function') {
          callback({ status: 'ok' });
        }
      } else {
        // Optionally, save message to DB for later delivery
        if (typeof callback === 'function') {
          callback({ status: 'pending', error: 'Both users must be online.' });
        }
      }
    } catch (error) {
      console.error('Message handling error:', error);
      if (typeof callback === 'function') {
        callback({ status: 'error', error: error.message });
      }
    }
  });

  // Call user
  socket.on('callUser', ({ to, from, signal, callerName }) => {
    io.to(to).emit('incomingCall', { from, signal, callerName });
  });

  // Answer call
  socket.on('answerCall', ({ to, signal }) => {
    io.to(to).emit('callAccepted', signal);
  });

  // Reject call
  socket.on('rejectCall', ({ to }) => {
    io.to(to).emit('callRejected');
  });

  // End call (notify the other user)
  socket.on('endCall', ({ to }) => {
    io.to(to).emit('endCall');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  socket.on('disconnect', () => {
    // Remove user from onlineUserIds
    for (const id of onlineUserIds) {
      if (socket.rooms.has(id)) {
        onlineUserIds.delete(id);
      }
    }
    io.emit('online_users', Array.from(onlineUserIds));
    delete socketUsernames[socket.id];
    delete usersInChat[socketUsernames[socket.id]];
    io.emit('users_in_chat', usersInChat);
    console.log('❌ Client disconnected:', socket.id);
  });

  socket.on('in_chat', ({ userId, chatWith }) => {
    usersInChat[userId] = chatWith;
    io.emit('users_in_chat', usersInChat);
  });

  socket.on('left_chat', ({ userId }) => {
    delete usersInChat[userId];
    io.emit('users_in_chat', usersInChat);
  });
});

server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

