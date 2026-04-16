import { Server } from 'socket.io';
import { SOCKET_EVENTS } from './socket.events.js';
import {
  handleUserOnline,
  handleUserOffline,
  handleJoinChat,
  handleLeaveChat,
  handleSendMessage,
  handleTyping,
  handleMarkRead,
  cleanup
} from './socket.handlers.js';

let io = null;
let isShuttingDown = false;

export const initializeSocket = (server) => {
  if (io) {
    console.log('Socket already initialized');
    return io;
  }
  
  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    pingTimeout: 60000,
    pingInterval: 25000,
    transports: ['websocket', 'polling']
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    console.log('New client connected:', socket.id);

    // User online
    socket.on(SOCKET_EVENTS.USER_ONLINE, (userId) => {
      handleUserOnline(io, socket, userId);
    });

    // Join chat room
    socket.on(SOCKET_EVENTS.JOIN_CHAT, (chatId) => {
      handleJoinChat(socket, chatId);
    });

    // Leave chat room
    socket.on(SOCKET_EVENTS.LEAVE_CHAT, (chatId) => {
      handleLeaveChat(socket, chatId);
    });

    // Send message with rate limiting
    socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
      const now = Date.now();
      const lastMessage = socket.lastMessageTime || 0;
      if (now - lastMessage < 100) {
        return;
      }
      socket.lastMessageTime = now;
      handleSendMessage(io, socket, data);
    });

    // User typing
    socket.on(SOCKET_EVENTS.TYPING, (data) => {
      handleTyping(io, socket, data);
    });

    // Mark messages as read
    socket.on(SOCKET_EVENTS.MARK_READ, (data) => {
      handleMarkRead(io, socket, data);
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      if (!isShuttingDown) {
        handleUserOffline(io, socket);
      }
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

export const closeSocket = async () => {
  isShuttingDown = true;
  if (io) {
    cleanup();
    await io.close();
    io = null;
    console.log('Socket server closed');
  }
};