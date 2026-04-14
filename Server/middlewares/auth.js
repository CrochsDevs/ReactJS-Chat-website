import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
    // Get token from cookie
    const token = req.cookies?.token;

    console.log("Auth check - Cookies received:", req.cookies);
    console.log("Token present:", !!token);

    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.log("Token verification failed:", err.message);
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        console.log("Token verified for user:", user.email);
        req.userId = user.userId;
        req.userEmail = user.email;
        next();
    });
};