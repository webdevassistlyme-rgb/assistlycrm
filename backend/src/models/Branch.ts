import { Schema, model } from "mongoose";

export type BranchDocument = {
  name: string;
  company: string;
  location: string;
  isArchived: boolean;
};

const branchSchema = new Schema<BranchDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    company: { type: String, trim: true, default: "Assistly" },
    location: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Branch = model<BranchDocument>("Branch", branchSchema);
