import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type FeatureKey =
  | "dashboard"
  | "leads"
  | "lead-search"
  | "lead-add"
  | "lead-categories"
  | "tasks"
  | "tracking"
  | "knowledge-base"
  | "teams"
  | "sales"
  | "calendar"
  | "attendance"
  | "profile"
  | "settings"
  | "messages"
  | "employees"
  | "hr"
  | "media"
  | "payroll"
  | "credentials";

export type FeatureFlagDocument = {
  key: FeatureKey;
  label: string;
  description: string;
  adminEnabled: boolean;
  employeeEnabled: boolean;
};

const featureFlagSchema = new Schema<FeatureFlagDocument>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    label: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    adminEnabled: { type: Boolean, default: true },
    employeeEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const FeatureFlag = tenantModel<FeatureFlagDocument>("FeatureFlag", featureFlagSchema);
