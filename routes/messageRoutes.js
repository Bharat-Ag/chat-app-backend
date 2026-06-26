import express from "express"
import { protectRoute } from "../middleware/auth.js";
import { clearMessagesImmediately, clearMessagesOlderThan24Hours, deleteMessage, getLastMessagesForSidebar, getMessage, getUserForSidebar, markMsgSeen, sendMessage } from "../controllers/messageController.js";
import { getDeleteChatRule, setDeleteChatRule } from "../controllers/chatRuleController.js";

const msgRoute = express.Router()

msgRoute.get("/users", protectRoute, getUserForSidebar)
msgRoute.get("/last-messages", protectRoute, getLastMessagesForSidebar)
msgRoute.get("/:id", protectRoute, getMessage)
msgRoute.put("/mark/:id", protectRoute, markMsgSeen)
msgRoute.post("/send/:id", protectRoute, sendMessage)
// msgRoute.post("/send-notification", protectRoute, sendPushNotification)
msgRoute.delete("/delete/:messageId", protectRoute, deleteMessage);
msgRoute.delete("/clear-immediate", protectRoute, clearMessagesImmediately)
msgRoute.delete("/clear-24hours", protectRoute, clearMessagesOlderThan24Hours)

msgRoute.post("/chat-rule/:withUserId", protectRoute, setDeleteChatRule);
msgRoute.get("/chat-rule/:withUserId", protectRoute, getDeleteChatRule);



export default msgRoute;