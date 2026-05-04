import { Schema, model } from "mongoose";

export type RoleDocument = {
  name: string;
  description: string;
  isArchived: boolean;
};

const roleSchema = new Schema<RoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = model<RoleDocument>("Role", roleSchema);
