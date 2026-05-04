import { Router } from "express";
import { createTeam, listTeams, updateTeam } from "../controllers/teamController";

export const teamRouter = Router();

teamRouter.get("/", listTeams);
teamRouter.post("/", createTeam);
teamRouter.put("/:id", updateTeam);
