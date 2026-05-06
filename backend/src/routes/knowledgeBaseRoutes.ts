import { Router } from "express";
import {
  archiveKnowledgeBaseEntry,
  approveKnowledgeBaseSuggestion,
  createKnowledgeBaseEntry,
  createKnowledgeBaseSuggestion,
  listKnowledgeBaseEntries,
  listKnowledgeBaseSuggestions,
  rejectKnowledgeBaseSuggestion,
  uploadKnowledgeBaseDocument,
  uploadKnowledgeBasePhoto,
  updateKnowledgeBaseEntry,
} from "../controllers/knowledgeBaseController";

export const knowledgeBaseRouter = Router();

knowledgeBaseRouter.get("/", listKnowledgeBaseEntries);
knowledgeBaseRouter.get("/suggestions", listKnowledgeBaseSuggestions);
knowledgeBaseRouter.post("/", createKnowledgeBaseEntry);
knowledgeBaseRouter.post("/documents", uploadKnowledgeBaseDocument);
knowledgeBaseRouter.post("/photos", uploadKnowledgeBasePhoto);
knowledgeBaseRouter.post("/suggestions", createKnowledgeBaseSuggestion);
knowledgeBaseRouter.patch("/suggestions/:id/approve", approveKnowledgeBaseSuggestion);
knowledgeBaseRouter.patch("/suggestions/:id/reject", rejectKnowledgeBaseSuggestion);
knowledgeBaseRouter.put("/:id", updateKnowledgeBaseEntry);
knowledgeBaseRouter.patch("/:id/archive", archiveKnowledgeBaseEntry);
