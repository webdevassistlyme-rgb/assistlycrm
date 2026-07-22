import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

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

export const Branch = tenantModel<BranchDocument>("Branch", branchSchema);
