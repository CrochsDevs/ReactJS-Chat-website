import { createChat, getUserChats, getChatById, saveMessage, getMessages } from "./chat.models.js";
import { findUserById } from "../users/users.models.js";

export const getUserChatsController = async (req, res) => {
    try {
        const userId = req.userId;
        const chats = await getUserChats(userId);
        
        const formattedChats = chats.map(chat => {
            const otherParticipant = chat.participants_info.find(p => p._id.toString() !== userId);
            return {
                _id: chat._id,
                name: otherParticipant?.fullName || "Unknown",
                username: otherParticipant?.username,
                avatar: otherParticipant?.profilePicture,
                isOnline: otherParticipant?.isOnline || false,
                lastMessage: chat.lastMessage || "No messages yet",
                lastMessageTime: chat.lastMessageTime,
                unreadCount: 0
            };
        });
        
        res.json(formattedChats);
    } catch (error) {
        console.error("Error in getUserChatsController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const createChatController = async (req, res) => {
    try {
        const userId = req.userId;
        const { userId: otherUserId } = req.body;
        
        const chat = await createChat(userId, otherUserId);
        
        const otherParticipant = await findUserById(otherUserId);
        
        res.json({
            _id: chat._id,
            name: otherParticipant?.fullName || "Unknown",
            username: otherParticipant?.username,
            avatar: otherParticipant?.profilePicture,
            isOnline: otherParticipant?.isOnline || false,
            lastMessage: null,
            lastMessageTime: null,
            unreadCount: 0
        });
    } catch (error) {
        console.error("Error in createChatController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getChatController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const chat = await getChatById(chatId);
        
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }
        
        const userId = req.userId;
        const otherParticipant = chat.participants_info.find(p => p._id.toString() !== userId);
        
        const formattedChat = {
            _id: chat._id,
            userId: otherParticipant?._id,
            name: otherParticipant?.fullName || "Unknown",
            username: otherParticipant?.username,
            avatar: otherParticipant?.profilePicture,
            isOnline: otherParticipant?.isOnline || false,
            lastMessage: chat.lastMessage
        };
        
        res.json(formattedChat);
    } catch (error) {
        console.error("Error in getChatController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const sendMessageController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.userId;
        const { content } = req.body;
        
        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Message content is required" });
        }
        
        const message = await saveMessage(chatId, userId, content);
        
        res.json({
            _id: message._id,
            content: message.content,
            isOwn: true,
            createdAt: message.createdAt
        });
    } catch (error) {
        console.error("Error in sendMessageController:", error);
        res.status(500).json({ error: error.message });
    }
};

export const getMessagesController = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await getMessages(chatId);
        
        const userId = req.userId;
        const formattedMessages = messages.map(msg => ({
            _id: msg._id,
            content: msg.content,
            isOwn: msg.senderId.toString() === userId,
            createdAt: msg.createdAt
        }));
        
        res.json(formattedMessages);
    } catch (error) {
        console.error("Error in getMessagesController:", error);
        res.status(500).json({ error: error.message });
    }
};