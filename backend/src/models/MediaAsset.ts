import { Schema, model } from "mongoose";

export type MediaAssetType = "Image" | "Video";

export type MediaAssetDocument = {
  name: string;
  url: string;
  mimeType: string;
  assetType: MediaAssetType;
  size: number;
  isArchived: boolean;
};

const mediaAssetSchema = new Schema<MediaAssetDocument>(
  {
    name: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    mimeType: { type: String, required: true, trim: true },
    assetType: { type: String, enum: ["Image", "Video"], required: true },
    size: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const MediaAsset = model<MediaAssetDocument>("MediaAsset", mediaAssetSchema);
