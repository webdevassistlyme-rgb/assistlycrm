import { Router } from "express";
import { archiveCredential, createCredential, listCredentials, updateCredential } from "../controllers/credentialController";

export const credentialRouter = Router();

credentialRouter.get("/", listCredentials);
credentialRouter.post("/", createCredential);
credentialRouter.put("/:id", updateCredential);
credentialRouter.patch("/:id/archive", archiveCredential);
