import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

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

export const Tool = tenantModel<ToolDocument>("Tool", toolSchema);
