import { Router } from "express";
import { archiveBranch, createBranch, listBranches, updateBranch } from "../controllers/branchController";

export const branchRouter = Router();

branchRouter.get("/", listBranches);
branchRouter.post("/", createBranch);
branchRouter.put("/:id", updateBranch);
branchRouter.patch("/:id/archive", archiveBranch);
