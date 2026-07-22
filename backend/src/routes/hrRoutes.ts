import { Router } from "express";
import {
  addApplicantNote,
  archiveApplicant,
  archiveJobPosting,
  createApplicant,
  createJobPosting,
  listApplicants,
  listJobPostings,
  permanentlyDeleteApplicant,
  permanentlyDeleteJobPosting,
  updateApplicant,
  updateApplicantStage,
  updateJobPosting,
} from "../controllers/hrController";

export const hrRouter = Router();

hrRouter.get("/jobs", listJobPostings);
hrRouter.post("/jobs", createJobPosting);
hrRouter.put("/jobs/:id", updateJobPosting);
hrRouter.patch("/jobs/:id/archive", archiveJobPosting);
hrRouter.delete("/jobs/:id/permanent", permanentlyDeleteJobPosting);
hrRouter.get("/applicants", listApplicants);
hrRouter.post("/applicants", createApplicant);
hrRouter.put("/applicants/:id", updateApplicant);
hrRouter.patch("/applicants/:id/stage", updateApplicantStage);
hrRouter.post("/applicants/:id/notes", addApplicantNote);
hrRouter.patch("/applicants/:id/archive", archiveApplicant);
hrRouter.delete("/applicants/:id/permanent", permanentlyDeleteApplicant);
hrRouter.delete("/applicants/:id", archiveApplicant);
