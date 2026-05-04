import { Schema, model, Types } from "mongoose";

export type NoticeDocument = {
  employee: Types.ObjectId;
  title: string;
  message: string;
  severity: "Info" | "Warning" | "Critical";
  issuedBy: string;
};

const noticeSchema = new Schema<NoticeDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: ["Info", "Warning", "Critical"], default: "Info" },
    issuedBy: { type: String, trim: true, default: "Admin" },
  },
  { timestamps: true }
);

export const Notice = model<NoticeDocument>("Notice", noticeSchema);
