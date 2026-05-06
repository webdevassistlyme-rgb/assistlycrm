import { Router } from "express";
import { readSystemSettings, updateSystemSettings } from "../controllers/systemSettingsController";

export const systemSettingsRouter = Router();

systemSettingsRouter.get("/", readSystemSettings);
systemSettingsRouter.put("/", updateSystemSettings);
