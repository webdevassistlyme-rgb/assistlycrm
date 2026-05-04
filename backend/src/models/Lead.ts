import { Schema, model, Types } from "mongoose";

export type LeadStatus =
  | "NEW"
  | "Follow up"
  | "Ongoing comms"
  | "Qualified"
  | "Ongoing Negotiation"
  | "Dead"
  | "Archived";

export type LeadDocument = {
  leadName: string;
  position: string;
  businessName: string;
  businessAddress: string;
  email: string;
  phone: string;
  website: string;
  source: string;
  status: LeadStatus;
  assignedAgent: Types.ObjectId | null;
  assignedTeam: Types.ObjectId | null;
  googlePlaceId: string;
  notes: string;
};

const leadSchema = new Schema<LeadDocument>(
  {
    leadName: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    businessName: { type: String, required: true, trim: true },
    businessAddress: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    website: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "Manual" },
    status: {
      type: String,
      enum: ["NEW", "Follow up", "Ongoing comms", "Qualified", "Ongoing Negotiation", "Dead", "Archived"],
      default: "NEW",
    },
    assignedAgent: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedTeam: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    googlePlaceId: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

export const Lead = model<LeadDocument>("Lead", leadSchema);
