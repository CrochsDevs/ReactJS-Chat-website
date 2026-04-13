import { getAllUsersFromDB } from "./users.models.js";

export const getUsers = async (req, res) => {
    try {
        const users = await getAllUsersFromDB();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error in getUsers:", error);
        res.status(500).json({ 
            message: "Error fetching users", 
            error: error.message 
        });
    }
};