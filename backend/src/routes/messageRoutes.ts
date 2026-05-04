import { Router } from "express";
import {
  createDirectConversation,
  createTeamConversation,
  listConversations,
  listMessages,
} from "../controllers/messageController";

export const messageRouter = Router();

messageRouter.get("/conversations", listConversations);
messageRouter.post("/conversations/direct", createDirectConversation);
messageRouter.post("/conversations/team", createTeamConversation);
messageRouter.get("/conversations/:conversationId/messages", listMessages);
