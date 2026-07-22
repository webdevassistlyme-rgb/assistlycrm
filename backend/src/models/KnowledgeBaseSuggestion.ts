import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";
import type { KnowledgeBaseEntryType } from "./KnowledgeBaseEntry";

export type KnowledgeBaseSuggestionStatus = "Pending" | "Approved" | "Rejected";

export type KnowledgeBaseSuggestionDocument = {
  entry: Types.ObjectId;
  entryType: KnowledgeBaseEntryType;
  comment: string;
  title: string;
  category: string;
  description: string;
  scope: string;
  question: string;
  answer: string;
  submittedById: string;
  submittedByName: string;
  status: KnowledgeBaseSuggestionStatus;
  reviewedAt?: Date;
};

const knowledgeBaseSuggestionSchema = new Schema<KnowledgeBaseSuggestionDocument>(
  {
    entry: { type: Schema.Types.ObjectId, ref: "KnowledgeBaseEntry", required: true },
    entryType: { type: String, enum: ["Product", "FAQ", "Article"], required: true },
    comment: { type: String, trim: true, default: "" },
    title: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    scope: { type: String, trim: true, default: "" },
    question: { type: String, trim: true, default: "" },
    answer: { type: String, trim: true, default: "" },
    submittedById: { type: String, trim: true, default: "" },
    submittedByName: { type: String, trim: true, default: "Employee" },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const KnowledgeBaseSuggestion = tenantModel<KnowledgeBaseSuggestionDocument>(
  "KnowledgeBaseSuggestion",
  knowledgeBaseSuggestionSchema
);
