import express from "express";
import { 
    register, 
    login, 
    getCurrentUser, 
    getUsers, 
    updateProfile, 
    logout 
} from "./auth.controllers.js";
import { authenticateToken } from "../../middlewares/auth.js";

const router = express.Router();

// Public routes (no token required)
router.post("/register", register);
router.post("/login", login);

// Protected routes (token required)
router.get("/me", authenticateToken, getCurrentUser);
router.get("/users", authenticateToken, getUsers);
router.put("/profile", authenticateToken, updateProfile);
router.post("/logout", authenticateToken, logout);

export default router;