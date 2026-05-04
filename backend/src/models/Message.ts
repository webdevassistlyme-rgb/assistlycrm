import { Schema, model, Types } from "mongoose";

export type MessageDocument = {
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  body: string;
};

const messageSchema = new Schema<MessageDocument>(
  {
    conversation: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Message = model<MessageDocument>("Message", messageSchema);
