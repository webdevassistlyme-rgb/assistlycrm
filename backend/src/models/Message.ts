import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type MessageDocument = {
  conversation: Types.ObjectId;
  sender: Types.ObjectId | null;
  senderName: string;
  senderType: "admin" | "employee";
  body: string;
};

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    senderName: { type: String, trim: true, default: "" },
    senderType: { type: String, enum: ["admin", "employee"], default: "employee" },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Message = tenantModel<MessageDocument>("Message", messageSchema);
