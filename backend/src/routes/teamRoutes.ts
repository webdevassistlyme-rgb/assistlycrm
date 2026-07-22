import { Router } from "express";
import { archiveTeam, createTeam, listTeams, updateTeam } from "../controllers/teamController";

export const teamRouter = Router();

teamRouter.get("/", listTeams);
teamRouter.post("/", createTeam);
teamRouter.put("/:id", updateTeam);
teamRouter.patch("/:id/archive", archiveTeam);
