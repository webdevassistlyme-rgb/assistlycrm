import { Schema, model } from "mongoose";

export type CredentialStatus = "Active" | "Review" | "Archived";

export type CredentialDocument = {
  username: string;
  password: string;
  platform: string;
  company: string;
  status: CredentialStatus;
};

const credentialSchema = new Schema<CredentialDocument>(
  {
    username: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    platform: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true, default: "General" },
    status: { type: String, enum: ["Active", "Review", "Archived"], default: "Active" },
  },
  { timestamps: true }
);

export const Credential = model<CredentialDocument>("Credential", credentialSchema);
