import {
    createUser,
    findUserByEmail,
    findUserByUsername,
    updateUserProfile,
    getAllUsers,
    updateOnlineStatus,
    findUserById
} from "./auth.models.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Cookie options
const cookieOptions = {
    httpOnly: true,
    secure: false, // Set to true only in production with HTTPS
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/'
};

// ==================== REGISTER ====================
export const register = async (req, res) => {
    console.log("📝 Register request:", { email: req.body.email });

    try {
        const { fullName, username, email, password, phoneNumber, bio } = req.body;

        if (!fullName || !username || !email || !password) {
            return res.status(400).json({ message: "All required fields must be filled" });
        }

        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken" });
        }

        const result = await createUser({
            fullName, username, email, password, phoneNumber, bio
        });

        console.log("✅ User created. ID:", result.userId);

        const token = jwt.sign(
            { userId: result.userId, email, username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, cookieOptions);

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: result.userId,
                fullName,
                username,
                email,
                bio: bio || '',
                profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true`
            }
        });
    } catch (error) {
        console.error("❌ Register error:", error);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

// ==================== LOGIN ====================
export const login = async (req, res) => {
    console.log("🔐 Login request:", req.body.email);

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        await updateOnlineStatus(user.userId, true);

        const token = jwt.sign(
            { userId: user.userId, email: user.email, username: user.profile.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Set cookie
        res.cookie('token', token, cookieOptions);

        console.log("✅ Login successful, cookie set for:", email);

        res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.userId,
                fullName: user.profile.fullName,
                username: user.profile.username,
                email: user.email,
                bio: user.profile.bio,
                profilePicture: user.profile.profilePicture,
                isOnline: true
            }
        });
    } catch (error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

// ==================== LOGOUT ====================
export const logout = async (req, res) => {
    try {
        const userId = req.userId;
        if (userId) {
            await updateOnlineStatus(userId, false);
        }

        // Clear the cookie
        res.clearCookie('token', { path: '/' });

        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ message: "Error logging out", error: error.message });
    }
};

// ==================== GET CURRENT USER ====================
export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        console.log("Getting current user for ID:", userId);

        const user = await findUserById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({ message: "Error fetching user" });
    }
};

// ==================== GET ALL USERS ====================
export const getUsers = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsers:", error);
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// ==================== UPDATE PROFILE ====================
export const updateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { fullName, bio, phoneNumber, profilePicture } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (bio) updateData.bio = bio;
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (profilePicture) updateData.profilePicture = profilePicture;

        await updateUserProfile(userId, updateData);

        const updatedUser = await findUserById(userId);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error) {
        console.error("Error in updateProfile:", error);
        res.status(500).json({ message: "Error updating profile", error: error.message });
    }
};