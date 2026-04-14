import express from "express";
import { getUsers } from "./users.controllers.js";
import { authenticateToken } from "../../middlewares/auth.js";

const router = express.Router();

// Get all users - no authentication needed for now
router.get("/", getUsers);

export default router;