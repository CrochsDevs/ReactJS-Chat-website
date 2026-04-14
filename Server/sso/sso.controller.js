import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { findUserByEmail, updateOnlineStatus, findUserById } from '../modules/auth/auth.models.js';
import { createSSOSession, findSSOSession, deleteSSOSession, getUserSSOSessions, updateSSOSession } from './sso.models.js';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'B3Ch4t_Sup3r_S3cr3t_K3y_2024';

// Generate SSO token
const generateSSOToken = (userData, service) => {
    return jwt.sign(
        { 
            userId: userData.userId, 
            email: userData.email,
            username: userData.username,
            service: service,
            sessionId: uuidv4()
        },
        JWT_SECRET,
        { expiresIn: '30d' }
    );
};

// SSO Login - Main authentication
export const ssoLogin = async (req, res) => {
    try {
        const { email, password, service = 'bechat-web', deviceInfo } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;

        // Validate user credentials
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate SSO token
        const ssoToken = generateSSOToken(
            { 
                userId: user.userId, 
                email: user.email, 
                username: user.profile.username 
            },
            service
        );

        // Create SSO session in database
        await createSSOSession(user.userId, {
            sessionToken: ssoToken,
            deviceInfo: deviceInfo || { userAgent: req.headers['user-agent'] },
            ipAddress: ipAddress,
            services: [service]
        });

        // Update online status
        await updateOnlineStatus(user.userId, true);

        // Set cookie for main domain
        res.cookie('bechat_sso', ssoToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        res.json({
            success: true,
            message: "SSO login successful",
            token: ssoToken,
            user: {
                id: user.userId,
                name: user.profile.fullName,
                email: user.email,
                username: user.profile.username,
                profilePicture: user.profile.profilePicture
            }
        });
    } catch (error) {
        console.error("SSO Login error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// Verify SSO token for any service
export const verifySSO = async (req, res) => {
    try {
        const token = req.cookies.bechat_sso || req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ authenticated: false, message: "No token provided" });
        }

        // Verify JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Check if session exists in database
        const session = await findSSOSession(token);
        if (!session) {
            return res.status(401).json({ authenticated: false, message: "Session expired" });
        }

        // Get fresh user data
        const user = await findUserById(decoded.userId);
        
        res.json({
            authenticated: true,
            session: {
                id: decoded.sessionId,
                service: decoded.service
            },
            user: {
                id: decoded.userId,
                name: user.fullName,
                email: decoded.email,
                username: user.username,
                profilePicture: user.profilePicture
            }
        });
    } catch (error) {
        console.error("SSO Verify error:", error);
        res.status(401).json({ authenticated: false, error: error.message });
    }
};

// SSO Logout - clears all service sessions
export const ssoLogout = async (req, res) => {
    try {
        const token = req.cookies.bechat_sso;
        
        if (token) {
            // Delete session from database
            await deleteSSOSession(token);
        }
        
        // Clear cookie
        res.clearCookie('bechat_sso');
        
        res.json({ 
            success: true, 
            message: "Logged out from all services" 
        });
    } catch (error) {
        console.error("SSO Logout error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Get all active sessions for a user
export const getUserSessions = async (req, res) => {
    try {
        const userId = req.userId;
        const sessions = await getUserSSOSessions(userId);
        
        res.json({
            success: true,
            sessions: sessions.map(s => ({
                id: s._id,
                deviceInfo: s.deviceInfo,
                ipAddress: s.ipAddress,
                services: s.services,
                lastActivity: s.lastActivity,
                createdAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error("Get user sessions error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Revoke a specific session
export const revokeSession = async (req, res) => {
    try {
        const { sessionToken } = req.params;
        const userId = req.userId;
        
        const session = await findSSOSession(sessionToken);
        if (!session || session.userId.toString() !== userId) {
            return res.status(404).json({ message: "Session not found" });
        }
        
        await deleteSSOSession(sessionToken);
        
        res.json({
            success: true,
            message: "Session revoked successfully"
        });
    } catch (error) {
        console.error("Revoke session error:", error);
        res.status(500).json({ error: error.message });
    }
};

// Service-to-service authentication
export const serviceAuth = async (req, res) => {
    try {
        const { apiKey, serviceName } = req.body;
        
        // This would validate API keys for microservices
        // For now, simple implementation
        if (!apiKey || apiKey !== process.env.SERVICE_API_KEY) {
            return res.status(401).json({ error: "Invalid API key" });
        }
        
        const serviceToken = jwt.sign(
            { serviceName, type: 'service' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        res.json({
            success: true,
            serviceToken
        });
    } catch (error) {
        console.error("Service auth error:", error);
        res.status(500).json({ error: error.message });
    }
};