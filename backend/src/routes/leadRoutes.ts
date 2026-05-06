import { Router } from "express";
import {
  archiveLead,
  addLeadComment,
  autoSearchPlacesForProduct,
  autoAssignLead,
  createLead,
  importPlacesAsLeads,
  listLeads,
  scoreLeadsByHighestPotential,
  scheduleLeadFollowUp,
  searchAndImportPlacesAsLeads,
  searchPlacesForLeads,
  updateLead,
  updateLeadStatus,
} from "../controllers/leadController";

export const leadRouter = Router();

leadRouter.get("/", listLeads);
leadRouter.post("/", createLead);
leadRouter.post("/ai-score", scoreLeadsByHighestPotential);
leadRouter.put("/:id", updateLead);
leadRouter.patch("/:id/archive", archiveLead);
leadRouter.post("/:id/comments", addLeadComment);
leadRouter.patch("/:id/status", updateLeadStatus);
leadRouter.patch("/:id/follow-up", scheduleLeadFollowUp);
leadRouter.patch("/:id/auto-assign", autoAssignLead);
leadRouter.post("/google-places/search", searchPlacesForLeads);
leadRouter.post("/google-places/search-import", searchAndImportPlacesAsLeads);
leadRouter.post("/google-places/auto-search", autoSearchPlacesForProduct);
leadRouter.post("/google-places/import", importPlacesAsLeads);
