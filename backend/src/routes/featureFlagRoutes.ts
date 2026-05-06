import { Router } from "express";
import { listFeatureFlags, updateFeatureFlag } from "../controllers/featureFlagController";

export const featureFlagRouter = Router();

featureFlagRouter.get("/", listFeatureFlags);
featureFlagRouter.put("/:key", updateFeatureFlag);
