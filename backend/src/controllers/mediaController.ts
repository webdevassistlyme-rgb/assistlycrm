import type { Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { MediaAsset } from "../models/MediaAsset";

export async function listMediaAssets(_request: Request, response: Response) {
  const assets = await MediaAsset.find({ isArchived: false }).sort({ createdAt: -1 });
  response.json(assets);
}

export async function uploadMediaAsset(request: Request, response: Response) {
  const dataUrl = String(request.body.dataUrl || "");
  const originalName = String(request.body.fileName || "media").replace(/[^a-zA-Z0-9._-]/g, "-");
  const branch = String(request.body.branch || "").trim();
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif)|video\/(?:mp4|webm|ogg|quicktime));base64,(.+)$/);

  if (!branch) {
    response.status(400).json({ message: "branch is required" });
    return;
  }

  if (!match) {
    response.status(400).json({ message: "Valid image or video dataUrl is required" });
    return;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const assetType = mimeType.startsWith("image/") ? "Image" : "Video";
  const extensionByMime: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogg",
    "video/quicktime": "mov",
  };
  const uploadDir = path.resolve("uploads", "media");
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${originalName}.${extensionByMime[mimeType] || "bin"}`;
  const bytes = Buffer.from(base64, "base64");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), bytes);

  const asset = await MediaAsset.create({
    name: originalName,
    url: `/uploads/media/${fileName}`,
    mimeType,
    assetType,
    branch,
    size: bytes.length,
  });

  response.status(201).json(asset);
}

export async function archiveMediaAsset(request: Request, response: Response) {
  const asset = await MediaAsset.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { new: true, runValidators: true }
  );

  if (!asset) {
    response.status(404).json({ message: "Media asset not found" });
    return;
  }

  response.json(asset);
}
