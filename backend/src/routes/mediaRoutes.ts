import { Router } from "express";
import { archiveMediaAsset, listMediaAssets, uploadMediaAsset } from "../controllers/mediaController";

export const mediaRouter = Router();

mediaRouter.get("/", listMediaAssets);
mediaRouter.post("/", uploadMediaAsset);
mediaRouter.patch("/:id/archive", archiveMediaAsset);
