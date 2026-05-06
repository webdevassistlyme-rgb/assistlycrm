import { Router } from "express";
import { archiveTool, createTool, listTools, updateTool } from "../controllers/toolController";

export const toolRouter = Router();

toolRouter.get("/", listTools);
toolRouter.post("/", createTool);
toolRouter.put("/:id", updateTool);
toolRouter.patch("/:id/archive", archiveTool);
