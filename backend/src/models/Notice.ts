import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type NoticeDocument = {
  employee: Types.ObjectId;
  title: string;
  message: string;
  severity: "Info" | "Warning" | "Critical";
  issuedBy: string;
  isRead: boolean;
  href?: string;
  source?: string;
  sourceId?: string;
  acknowledgedAt?: Date;
  replies: {
    message: string;
    createdAt: Date;
  }[];
};

const noticeSchema = new Schema<NoticeDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["Info", "Warning", "Critical"], default: "Info" },
    issuedBy: { type: String, trim: true, default: "Admin" },
    isRead: { type: Boolean, default: false },
    href: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "AdminNotice" },
    sourceId: { type: String, trim: true, default: "" },
    acknowledgedAt: { type: Date },
    replies: {
      type: [
        {
          message: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

export const Notice = tenantModel<NoticeDocument>("Notice", noticeSchema);
