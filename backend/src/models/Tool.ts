import { Schema, model } from "mongoose";

export type ToolDocument = {
  name: string;
  link: string;
  branches: string[];
  isArchived: boolean;
};

const toolSchema = new Schema<ToolDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    link: { type: String, trim: true, default: "" },
    branches: { type: [String], default: [] },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Tool = model<ToolDocument>("Tool", toolSchema);
