import { createUser, findUserByEmail, findUserByUsername, updateUser, getAllUsersFromDB } from "./users.models.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from "../../config/db.js";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_this';

export const register = async (req, res) => {
    console.log("Register request received:", req.body);
    try {
        const { fullName, username, email, password, phoneNumber, bio } = req.body;

        // Check if user exists
        const existingEmail = await findUserByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const existingUsername = await findUserByUsername(username);
        if (existingUsername) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            fullName,
            username,
            email,
            password: hashedPassword,
            phoneNumber: phoneNumber || '',
            bio: bio || '',
            profilePicture: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random&color=fff&bold=true`,
            friends: [],
            friendRequests: [],
            blockedUsers: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isOnline: false,
            lastSeen: new Date()
        };

        console.log("Attempting to create user:", { ...newUser, password: '[HIDDEN]' });
        
        const result = await createUser(newUser);
        console.log("User created successfully with ID:", result.insertedId);
        
        // Generate token
        const token = jwt.sign(
            { userId: result.insertedId, email, username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: result.insertedId,
                fullName,
                username,
                email,
                bio,
                profilePicture: newUser.profilePicture
            }
        });
    } catch (error) {
        console.error("Error in register:", error);
        res.status(500).json({ message: "Error registering user", error: error.message });
    }
};

export const login = async (req, res) => {
    console.log("Login request received:", req.body.email);
    try {
        const { email, password } = req.body;

        // Find user
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Update last seen and online status
        await updateUser(user._id, { lastSeen: new Date(), isOnline: true });

        // Generate token
        const token = jwt.sign(
            { userId: user._id, email: user.email, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                username: user.username,
                email: user.email,
                bio: user.bio,
                profilePicture: user.profilePicture,
                isOnline: true
            }
        });
    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ message: "Error logging in", error: error.message });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await getAllUsersFromDB();
        const usersWithoutPassword = users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        res.status(200).json(usersWithoutPassword);
    } catch (error) {
        console.error("Error in getUsers:", error);
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.userId;
        const db = await connectDB();
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error("Error in getCurrentUser:", error);
        res.status(500).json({ message: "Error fetching user" });
    }
};