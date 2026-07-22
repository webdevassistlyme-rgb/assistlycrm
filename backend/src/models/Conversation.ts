import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type ConversationType = "direct" | "team";

export type ConversationDocument = {
  type: ConversationType;
  title: string;
  participants: Types.ObjectId[];
  includeAdmin: boolean;
  team: Types.ObjectId | null;
  lastMessage: string;
  lastMessageAt: Date | null;
};

const conversationSchema = new Schema<ConversationDocument>(
  {
    type: { type: String, enum: ["direct", "team"], required: true },
    title: { type: String, trim: true, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    includeAdmin: { type: Boolean, default: false },
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    lastMessage: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Conversation = tenantModel<ConversationDocument>("Conversation", conversationSchema);
