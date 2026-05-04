import { Router } from "express";
import {
  archiveLead,
  createLead,
  importPlacesAsLeads,
  listLeads,
  searchPlacesForLeads,
  updateLead,
} from "../controllers/leadController";

export const leadRouter = Router();

leadRouter.get("/", listLeads);
leadRouter.post("/", createLead);
leadRouter.put("/:id", updateLead);
leadRouter.patch("/:id/archive", archiveLead);
leadRouter.post("/google-places/search", searchPlacesForLeads);
leadRouter.post("/google-places/import", importPlacesAsLeads);
