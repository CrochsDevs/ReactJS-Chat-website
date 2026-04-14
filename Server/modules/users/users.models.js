import connectDB from "../../config/db.js";
import { ObjectId } from "mongodb";

export const createUser = async (userData) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").insertOne(userData);
        return result;
    } catch (error) {
        console.error("Error in createUser:", error);
        throw error;
    }
};

export const findUserByEmail = async (email) => {
    try {
        const db = await connectDB();
        const user = await db.collection("users").findOne({ email });
        return user;
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

export const updateUser = async (userId, updateData) => {
    try {
        const db = await connectDB();
        const result = await db.collection("users").updateOne(
            { _id: new ObjectId(userId) },
            { $set: { ...updateData, updatedAt: new Date() } }
        );
        return result;
    } catch (error) {
        console.error("Error in updateUser:", error);
        throw error;
    }
};

export const getAllUsersFromDB = async () => {
    try {
        const db = await connectDB();
        const users = await db.collection("users").find({}).toArray();
        return users;
    } catch (error) {
        console.error("Error in getAllUsersFromDB:", error);
        throw error;
    }
};