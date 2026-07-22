import { Router } from "express";
import { archiveMediaAsset, listMediaAssets, serveMediaAssetFile, uploadMediaAsset } from "../controllers/mediaController";

export const mediaRouter = Router();

mediaRouter.get("/", listMediaAssets);
mediaRouter.post("/", uploadMediaAsset);
mediaRouter.get("/file/:fileName", serveMediaAssetFile);
mediaRouter.patch("/:id/archive", archiveMediaAsset);
