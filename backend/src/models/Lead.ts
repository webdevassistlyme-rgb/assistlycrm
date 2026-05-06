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
  category: string;
  status: LeadStatus;
  assignedAgent: Types.ObjectId | null;
  assignedTeam: Types.ObjectId | null;
  googlePlaceId: string;
  notes: string;
  comments: {
    authorName: string;
    authorType: "admin" | "employee";
    body: string;
    createdAt: Date;
  }[];
  followUpAt: Date | null;
  followUpNote: string;
  followUpPriority: number;
  aiScore: number;
  aiScoreReason: string;
  aiScoreSource: string;
  aiScoredAt: Date | null;
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
    category: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["NEW", "Follow up", "Ongoing comms", "Qualified", "Ongoing Negotiation", "Dead", "Archived"],
      default: "NEW",
    },
    assignedAgent: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    assignedTeam: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    googlePlaceId: { type: String, trim: true, default: "" },
    notes: { type: String, trim: true, default: "" },
    comments: {
      type: [
        {
          authorName: { type: String, trim: true, default: "Employee" },
          authorType: { type: String, enum: ["admin", "employee"], default: "employee" },
          body: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    followUpAt: { type: Date, default: null },
    followUpNote: { type: String, trim: true, default: "" },
    followUpPriority: { type: Number, min: 0, max: 100, default: 0 },
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    aiScoreReason: { type: String, trim: true, default: "" },
    aiScoreSource: { type: String, trim: true, default: "" },
    aiScoredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Lead = model<LeadDocument>("Lead", leadSchema);
