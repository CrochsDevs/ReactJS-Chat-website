import connectDB from "../../config/db.js";
import { ObjectId } from "mongodb";
import bcrypt from 'bcryptjs';

// ==================== USER CREATION ====================
export const createUser = async (userData) => {
    try {
        const db = await connectDB();

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        // 1. USERS collection - profile info only (NO email, NO password)
        const userProfile = {
            fullName: userData.fullName,
            username: userData.username,
            phoneNumber: userData.phoneNumber || '',
            bio: userData.bio || '',
            profilePicture: userData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.fullName)}&background=random&color=fff&bold=true`,
            coverPhoto: "",
            location: "",
            website: "",
            birthDate: null,
            gender: "",
            occupation: "",
            education: "",
            socialLinks: { facebook: "", twitter: "", instagram: "", linkedin: "" },
            friends: [],
            friendRequests: [],
            blockedUsers: [],
            isActive: true,
            isOnline: false,
            lastSeen: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const profileResult = await db.collection("users").insertOne(userProfile);
        const userId = profileResult.insertedId;

        // 2. AUTH collection - credentials only (email, password)
        const authEntry = {
            userId: userId,
            email: userData.email,
            password: hashedPassword,
            role: "user",
            isVerified: false,
            lastLogin: null,
            loginAttempts: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        await db.collection("auth").insertOne(authEntry);

        return { userId, profileResult };
    } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
    }
};

// ==================== FIND USERS ====================
export const findUserByEmail = async (email) => {
    try {
        const db = await connectDB();
        const user = await db.collection("auth").aggregate([
            { $match: { email: email } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "profile"
                }
            },
            { $unwind: "$profile" }
        ]).toArray();

        return user[0];
    } catch (error) {
        console.error("Error in findUserByEmail:", error);
        throw error;
    }
};

export const findUserByUsername = async (username) => {
    try {
        const db = await connectDB();
        const user = await db.collection("users").findOne({ username });
        return user;
    } catch (error) {
        console.error("Error in findUserByUsername:", error);
        throw error;
    }
};

export const findUserById = async (userId) => {
    try {
        const db = await connectDB();
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
        return user;
    } catch (error) {
        console.error("Error in findUserById:", error);
        throw error;
    }
};

export const getCompleteUser = async (userId) => {
    try {
        const db = await connectDB();
        const user = await db.collection("auth").aggregate([
            { $match: { userId: new ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "profile"
                }
            },
            { $unwind: "$profile" },
            { $project: { password: 0 } }
        ]).toArray();

        return user[0];
    } catch (error) {
        console.error("Error in getCompleteUser:", error);
        throw error;
    }
};

// ==================== GET ALL USERS ====================
export const getAllUsers = async () => {
    try {
        const db = await connectDB();
        const users = await db.collection("users").find({}).toArray();
        return users;
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        throw error;
    }
};

// ==================== UPDATE FUNCTIONS ====================
export const updateUserProfile = async (userId, updateData) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return result;
    } catch (error) {
        console.error("Error in updateUserProfile:", error);
        throw error;
    }
};

export const updateAuthInfo = async (userId, updateData) => {
    try {
        const db = await connectDB();
        const result = await db.collection("auth").updateOne(
            { userId: new ObjectId(userId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return result;
    } catch (error) {
        console.error("Error in updateAuthInfo:", error);
        throw error;
    }
};

export const updateOnlineStatus = async (userId, isOnline) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            {
                $set: {
                    isOnline: isOnline,
                    lastSeen: new Date(),
                    updatedAt: new Date()
                }
            }
        );
        return result;
    } catch (error) {
        console.error("Error in updateOnlineStatus:", error);
        throw error;
    }
};

// ==================== DELETE USER ====================
export const deleteUser = async (userId) => {
    try {
        const db = await connectDB();
        await db.collection("auth").deleteOne({ userId: new ObjectId(userId) });
        await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
        return { success: true };
    } catch (error) {
        console.error("Error in deleteUser:", error);
        throw error;
    }
};

// ==================== FRIEND FUNCTIONS ====================
export const addFriend = async (userId, friendId) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { friends: new ObjectId(friendId) } }
        );
        return result;
    } catch (error) {
        console.error("Error in addFriend:", error);
        throw error;
    }
};

export const removeFriend = async (userId, friendId) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { friends: new ObjectId(friendId) } }
        );
        return result;
    } catch (error) {
        console.error("Error in removeFriend:", error);
        throw error;
    }
};

export const sendFriendRequest = async (userId, targetId) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(targetId) },
            { $addToSet: { friendRequests: new ObjectId(userId) } }
        );
        return result;
    } catch (error) {
        console.error("Error in sendFriendRequest:", error);
        throw error;
    }
};

export const acceptFriendRequest = async (userId, requesterId) => {
    try {
        const db = await connectDB();
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $pull: { friendRequests: new ObjectId(requesterId) } }
        );
        await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $addToSet: { friends: new ObjectId(requesterId) } }
        );
        await db.collection("users").updateOne(
            { _id: new ObjectId(requesterId) },
            { $addToSet: { friends: new ObjectId(userId) } }
        );
        return { success: true };
    } catch (error) {
        console.error("Error in acceptFriendRequest:", error);
        throw error;
    }
};