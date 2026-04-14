import connectDB from "../../config/db.js";
import { ObjectId } from "mongodb";

export const createChat = async (userId, otherUserId) => {
    try {
        const db = await connectDB();
        
        const existingChat = await db.collection("chats").findOne({
            participants: { $all: [new ObjectId(userId), new ObjectId(otherUserId)] }
        });
        
        if (existingChat) {
            return existingChat;
        }
        
        const chat = {
            participants: [new ObjectId(userId), new ObjectId(otherUserId)],
            lastMessage: null,
            lastMessageTime: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection("chats").insertOne(chat);
        return { _id: result.insertedId, ...chat };
    } catch (error) {
        console.error("Error in createChat:", error);
        throw error;
    }
};

export const getUserChats = async (userId) => {
    try {
        const db = await connectDB();
        const chats = await db.collection("chats").aggregate([
            { $match: { participants: new ObjectId(userId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participants_info"
                }
            },
            { $sort: { updatedAt: -1 } }
        ]).toArray();
        
        return chats;
    } catch (error) {
        console.error("Error in getUserChats:", error);
        throw error;
    }
};

export const getChatById = async (chatId) => {
    try {
        const db = await connectDB();
        const chat = await db.collection("chats").aggregate([
            { $match: { _id: new ObjectId(chatId) } },
            {
                $lookup: {
                    from: "users",
                    localField: "participants",
                    foreignField: "_id",
                    as: "participants_info"
                }
            }
        ]).toArray();
        
        return chat[0];
    } catch (error) {
        console.error("Error in getChatById:", error);
        throw error;
    }
};

export const saveMessage = async (chatId, senderId, content) => {
    try {
        const db = await connectDB();
        const message = {
            chatId: new ObjectId(chatId),
            senderId: new ObjectId(senderId),
            content: content,
            isRead: false,
            createdAt: new Date()
        };
        
        const result = await db.collection("messages").insertOne(message);
        
        await db.collection("chats").updateOne(
            { _id: new ObjectId(chatId) },
            { 
                $set: { 
                    lastMessage: content,
                    lastMessageTime: new Date(),
                    updatedAt: new Date()
                } 
            }
        );
        
        return { _id: result.insertedId, ...message };
    } catch (error) {
        console.error("Error in saveMessage:", error);
        throw error;
    }
};

export const getMessages = async (chatId) => {
    try {
        const db = await connectDB();
        const messages = await db.collection("messages")
            .find({ chatId: new ObjectId(chatId) })
            .sort({ createdAt: 1 })
            .toArray();
        return messages;
    } catch (error) {
        console.error("Error in getMessages:", error);
        throw error;
    }
};