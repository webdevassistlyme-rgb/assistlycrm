import { Schema, model, Types } from "mongoose";

export type ConversationType = "direct" | "team";

export type ConversationDocument = {
  type: ConversationType;
  title: string;
  participants: Types.ObjectId[];
  team: Types.ObjectId | null;
  lastMessage: string;
  lastMessageAt: Date | null;
};

const conversationSchema = new Schema<ConversationDocument>(
  {
    type: { type: String, enum: ["direct", "team"], required: true },
    title: { type: String, trim: true, default: "" },
    participants: [{ type: Schema.Types.ObjectId, ref: "Employee" }],
    team: { type: Schema.Types.ObjectId, ref: "Team", default: null },
    lastMessage: { type: String, trim: true, default: "" },
    lastMessageAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Conversation = model<ConversationDocument>("Conversation", conversationSchema);
