import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type CredentialStatus = "Active" | "Review" | "Archived";

export type CredentialDocument = {
  accountName: string;
  username: string;
  password: string;
  platform: string;
  company: string;
  team: string;
  status: CredentialStatus;
};

const credentialSchema = new Schema<CredentialDocument>(
  {
    accountName: { type: String, trim: true, default: "" },
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    platform: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true, default: "General" },
    team: { type: String, trim: true, default: "All teams" },
    status: { type: String, enum: ["Active", "Review", "Archived"], default: "Active" },
  },
  { timestamps: true }
);

export const Credential = tenantModel<CredentialDocument>("Credential", credentialSchema);
