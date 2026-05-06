import { Router } from "express";
import {
  addApplicantNote,
  archiveApplicant,
  archiveJobPosting,
  createApplicant,
  createJobPosting,
  listApplicants,
  listJobPostings,
  updateApplicant,
  updateApplicantStage,
  updateJobPosting,
} from "../controllers/hrController";

export const hrRouter = Router();

hrRouter.get("/jobs", listJobPostings);
hrRouter.post("/jobs", createJobPosting);
hrRouter.put("/jobs/:id", updateJobPosting);
hrRouter.patch("/jobs/:id/archive", archiveJobPosting);
hrRouter.get("/applicants", listApplicants);
hrRouter.post("/applicants", createApplicant);
hrRouter.put("/applicants/:id", updateApplicant);
hrRouter.patch("/applicants/:id/stage", updateApplicantStage);
hrRouter.post("/applicants/:id/notes", addApplicantNote);
hrRouter.patch("/applicants/:id/archive", archiveApplicant);
