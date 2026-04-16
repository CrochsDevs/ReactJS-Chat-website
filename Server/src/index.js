import app, { initSocket } from './app.js';
import connectDB from '../config/db.js';
import http from 'http';

const PORT = 3000;

const startServer = async () => {
    try {
        await connectDB();
        console.log('✅ Database connected');
        
        const server = http.createServer(app);
        
        // Initialize Socket.io
        initSocket(server);
        console.log('✅ Socket.io initialized');
        
        server.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
};

startServer();