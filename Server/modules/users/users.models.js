import connectDB from "../../config/db.js";

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