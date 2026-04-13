import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoutes from '../modules/users/users.routes.js';

const app = express();

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.send('🚀 BeChat API is running...');
});

app.use('/api/users', userRoutes);

export default app;