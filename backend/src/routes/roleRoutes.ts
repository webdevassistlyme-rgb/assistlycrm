import { Router } from "express";
import { archiveRole, createRole, listRoles, updateRole } from "../controllers/roleController";

export const roleRouter = Router();

roleRouter.get("/", listRoles);
roleRouter.post("/", createRole);
roleRouter.put("/:id", updateRole);
roleRouter.patch("/:id/archive", archiveRole);
