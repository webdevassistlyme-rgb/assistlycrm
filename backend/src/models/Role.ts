import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type RoleDocument = {
  name: string;
  department: string;
  branch: string;
  description: string;
  isArchived: boolean;
};

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    department: { type: String, trim: true, default: "General" },
    branch: { type: String, trim: true, default: "All branches" },
    description: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = tenantModel<RoleDocument>("Role", roleSchema);
