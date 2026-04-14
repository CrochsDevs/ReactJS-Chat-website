import connectDB from "../config/db.js";
import { ObjectId } from "mongodb";

// Store SSO sessions
export const createSSOSession = async (userId, sessionData) => {
    try {
        const db = await connectDB();
        const session = {
            userId: new ObjectId(userId),
            sessionToken: sessionData.sessionToken,
            deviceInfo: sessionData.deviceInfo || {},
            ipAddress: sessionData.ipAddress,
            services: sessionData.services || [],
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            lastActivity: new Date()
        };
        
        const result = await db.collection("sso_sessions").insertOne(session);
        return result;
    } catch (error) {
        console.error("Error in createSSOSession:", error);
        throw error;
    }
};

export const findSSOSession = async (sessionToken) => {
    try {
        const db = await connectDB();
        const session = await db.collection("sso_sessions").findOne({ 
            sessionToken: sessionToken,
            expiresAt: { $gt: new Date() }
        });
        return session;
    } catch (error) {
        console.error("Error in findSSOSession:", error);
        throw error;
    }
};

export const updateSSOSession = async (sessionToken, updateData) => {
    try {
        const db = await connectDB();
        const result = await db.collection("sso_sessions").updateOne(
            { sessionToken: sessionToken },
            { $set: { ...updateData, lastActivity: new Date() } }
        );
        return result;
    } catch (error) {
        console.error("Error in updateSSOSession:", error);
        throw error;
    }
};

export const deleteSSOSession = async (sessionToken) => {
    try {
        const db = await connectDB();
        const result = await db.collection("sso_sessions").deleteOne({ sessionToken: sessionToken });
        return result;
    } catch (error) {
        console.error("Error in deleteSSOSession:", error);
        throw error;
    }
};

export const getUserSSOSessions = async (userId) => {
    try {
        const db = await connectDB();
        const sessions = await db.collection("sso_sessions")
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();
        return sessions;
    } catch (error) {
        console.error("Error in getUserSSOSessions:", error);
        throw error;
    }
};

// Register connected service
export const registerService = async (serviceData) => {
    try {
        const db = await connectDB();
        const service = {
            serviceName: serviceData.serviceName,
            serviceUrl: serviceData.serviceUrl,
            apiKey: serviceData.apiKey,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        const result = await db.collection("sso_services").insertOne(service);
        return result;
    } catch (error) {
        console.error("Error in registerService:", error);
        throw error;
    }
};

export const getServiceByApiKey = async (apiKey) => {
    try {
        const db = await connectDB();
        const service = await db.collection("sso_services").findOne({ apiKey: apiKey });
        return service;
    } catch (error) {
        console.error("Error in getServiceByApiKey:", error);
        throw error;
    }
};