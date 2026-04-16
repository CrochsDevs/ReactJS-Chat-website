import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import http from 'http';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/users.routes.js';
import ssoRoutes from '../sso/sso.routes.js';
import chatRoutes from '../modules/chats/chat.routes.js';
import { Server } from 'socket.io';

const app = express();

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

// Request logging
let requestCount = 0;
app.use((req, res, next) => {
    if (requestCount % 100 === 0) {
        console.log(`${req.method} ${req.url}`);
    }
    requestCount++;
    next();
});

app.get('/', (req, res) => {
    res.send('🚀 BeChat API is running...');
});

app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date()
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sso', ssoRoutes);
app.use('/api/chats', chatRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(err.status || 500).json({ 
        error: err.message || 'Internal server error' 
    });
});

// Socket.io setup
let io = null;
const onlineUsers = new Map();

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST']
        },
        allowEIO3: true,
        transports: ['polling', 'websocket']
    });

    io.on('connection', (socket) => {
        console.log('🟢 New client connected:', socket.id);

        socket.on('user-online', (userId) => {
            console.log('📡 User online event received:', userId);
            onlineUsers.set(userId, socket.id);
            io.emit('user-status-change', { userId, status: 'online' });
        });

        socket.on('join-chat', (chatId) => {
            console.log('📡 Join chat event:', chatId);
            socket.join(chatId);
        });

        socket.on('leave-chat', (chatId) => {
            console.log('📡 Leave chat event:', chatId);
            socket.leave(chatId);
        });

        socket.on('send-message', (data) => {
            console.log('📡 Send message event received:', data);
            const { chatId, message, senderId, receiverId } = data;
            
            // Broadcast to room
            io.to(chatId).emit('receive-message', {
                chatId,
                message,
                senderId,
                createdAt: new Date()
            });
            
            // Notify receiver
            const receiverSocketId = onlineUsers.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('new-message-notification', {
                    chatId,
                    message: message.content,
                    senderId
                });
            }
        });

        socket.on('typing', (data) => {
            const { chatId, userId, isTyping } = data;
            socket.to(chatId).emit('user-typing', { userId, isTyping });
        });

        socket.on('mark-read', (data) => {
            const { chatId, userId } = data;
            socket.to(chatId).emit('messages-read', { chatId, userId });
        });

        socket.on('disconnect', () => {
            let disconnectedUserId = null;
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    onlineUsers.delete(userId);
                    break;
                }
            }
            if (disconnectedUserId) {
                io.emit('user-status-change', { userId: disconnectedUserId, status: 'offline' });
            }
            console.log('🔴 Client disconnected:', socket.id);
        });
    });

    return io;
};

export const getIO = () => io;

export default app;