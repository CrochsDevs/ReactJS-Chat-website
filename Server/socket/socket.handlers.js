import { SOCKET_EVENTS } from './socket.events.js';

const onlineUsers = new Map();
const userRooms = new Map();
const typingTimeouts = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of onlineUsers.entries()) {
    if (now - data.connectedAt > 24 * 60 * 60 * 1000) {
      onlineUsers.delete(userId);
    }
  }
}, 60 * 60 * 1000);

export const handleUserOnline = (io, socket, userId) => {
  const existing = onlineUsers.get(userId);
  if (existing && existing.socketId === socket.id) {
    return;
  }
  
  onlineUsers.set(userId, {
    socketId: socket.id,
    connectedAt: Date.now()
  });
  
  io.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, { userId, status: 'online' });
  console.log(`User ${userId} is online`);
};

export const handleUserOffline = (io, socket) => {
  let disconnectedUserId = null;
  
  for (const [userId, data] of onlineUsers.entries()) {
    if (data.socketId === socket.id) {
      disconnectedUserId = userId;
      onlineUsers.delete(userId);
      break;
    }
  }
  
  if (disconnectedUserId) {
    const rooms = userRooms.get(socket.id);
    if (rooms) {
      rooms.forEach(roomId => {
        socket.leave(roomId);
      });
      userRooms.delete(socket.id);
    }
    
    io.emit(SOCKET_EVENTS.USER_STATUS_CHANGE, { 
      userId: disconnectedUserId, 
      status: 'offline' 
    });
    console.log(`User ${disconnectedUserId} went offline`);
  }
};

export const handleJoinChat = (socket, chatId) => {
  if (socket.rooms.has(chatId)) {
    return;
  }
  
  socket.join(chatId);
  
  if (!userRooms.has(socket.id)) {
    userRooms.set(socket.id, new Set());
  }
  userRooms.get(socket.id).add(chatId);
  
  console.log(`Socket ${socket.id} joined chat ${chatId}`);
};

export const handleLeaveChat = (socket, chatId) => {
  if (!socket.rooms.has(chatId)) {
    return;
  }
  
  socket.leave(chatId);
  
  const rooms = userRooms.get(socket.id);
  if (rooms) {
    rooms.delete(chatId);
    if (rooms.size === 0) {
      userRooms.delete(socket.id);
    }
  }
  
  console.log(`Socket ${socket.id} left chat ${chatId}`);
};

export const handleSendMessage = (io, socket, data) => {
  const { chatId, message, senderId, receiverId } = data;
  
  if (!chatId || !message || !senderId) {
    console.error('Invalid message data');
    return;
  }
  
  if (!message.content || message.content.trim() === '') {
    return;
  }
  
  const messageData = {
    chatId,
    message: {
      _id: Date.now().toString(),
      content: message.content.trim(),
      senderId,
      createdAt: new Date()
    },
    senderId,
    createdAt: new Date()
  };
  
  socket.to(chatId).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, messageData);
  socket.emit(SOCKET_EVENTS.MESSAGE_SENT, messageData);
  
  const receiverData = onlineUsers.get(receiverId);
  if (receiverData && receiverData.socketId !== socket.id) {
    io.to(receiverData.socketId).emit(SOCKET_EVENTS.NEW_MESSAGE_NOTIFICATION, {
      chatId,
      message: message.content,
      senderId,
      timestamp: new Date()
    });
  }
};

export const handleTyping = (io, socket, data) => {
  const { chatId, userId, isTyping } = data;
  
  const existingTimeout = typingTimeouts.get(chatId);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }
  
  if (isTyping) {
    const timeout = setTimeout(() => {
      socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, { userId, isTyping: false });
      typingTimeouts.delete(chatId);
    }, 3000);
    
    typingTimeouts.set(chatId, timeout);
  }
  
  socket.to(chatId).emit(SOCKET_EVENTS.USER_TYPING, { userId, isTyping });
};

export const handleMarkRead = (io, socket, data) => {
  const { chatId, userId, messageIds } = data;
  
  if (!chatId || !userId) {
    return;
  }
  
  if (socket.rooms.has(chatId)) {
    socket.to(chatId).emit(SOCKET_EVENTS.MESSAGES_READ, { 
      chatId, 
      userId,
      messageIds: messageIds || [],
      timestamp: new Date()
    });
  }
};

export const cleanup = () => {
  for (const timeout of typingTimeouts.values()) {
    clearTimeout(timeout);
  }
  typingTimeouts.clear();
  onlineUsers.clear();
  userRooms.clear();
  console.log('Socket handlers cleaned up');
};