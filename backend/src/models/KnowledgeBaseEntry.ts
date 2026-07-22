import { Schema } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type KnowledgeBaseEntryType = "Product" | "FAQ" | "Article";
export type KnowledgeBaseStatus = "Active" | "Draft" | "Archived";

export type KnowledgeBaseEntryDocument = {
  entryType: KnowledgeBaseEntryType;
  title: string;
  category: string;
  description: string;
  scope: string;
  photoUrls: string[];
  documents: {
    name: string;
    url: string;
    mimeType: string;
  }[];
  question: string;
  answer: string;
  comments: {
    comment: string;
    submittedByName: string;
    submittedById: string;
    createdAt: Date;
  }[];
  status: KnowledgeBaseStatus;
};

const knowledgeBaseEntrySchema = new Schema<KnowledgeBaseEntryDocument>(
  {
    entryType: { type: String, enum: ["Product", "FAQ", "Article"], required: true },
    title: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    scope: { type: String, trim: true, default: "" },
    photoUrls: { type: [String], default: [] },
    documents: {
      type: [
        {
          name: { type: String, trim: true, required: true },
          url: { type: String, trim: true, required: true },
          mimeType: { type: String, trim: true, default: "application/octet-stream" },
        },
      ],
      default: [],
    },
    question: { type: String, trim: true, default: "" },
    answer: { type: String, trim: true, default: "" },
    comments: {
      type: [
        {
          comment: { type: String, trim: true, required: true },
          submittedByName: { type: String, trim: true, default: "Employee" },
          submittedById: { type: String, trim: true, default: "" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    status: { type: String, enum: ["Active", "Draft", "Archived"], default: "Active" },
  },
  { timestamps: true }
);

export const KnowledgeBaseEntry = tenantModel<KnowledgeBaseEntryDocument>("KnowledgeBaseEntry", knowledgeBaseEntrySchema);
