import express from "express";
import { authenticateToken } from "../../middlewares/auth.js";
import {
    getUserChatsController,
    createChatController,
    getChatController,
    sendMessageController,
    getMessagesController
} from "./chat.controllers.js";

const router = express.Router();

router.get("/", authenticateToken, getUserChatsController);
router.post("/", authenticateToken, createChatController);
router.get("/:chatId", authenticateToken, getChatController);
router.post("/:chatId/messages", authenticateToken, sendMessageController);
router.get("/:chatId/messages", authenticateToken, getMessagesController);

export default router;