import { Schema, model, Types } from "mongoose";

export type TaskStatus = "Todo" | "In Progress" | "Done" | "Blocked";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type TaskDocument = {
  title: string;
  description: string;
  relatedLead: Types.ObjectId | null;
  assignedTo: Types.ObjectId | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: Date | null;
  completedAt: Date | null;
  isArchived: boolean;
};

const taskSchema = new Schema<TaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    relatedLead: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    assignedTo: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
    status: { type: String, enum: ["Todo", "In Progress", "Done", "Blocked"], default: "Todo" },
    priority: { type: String, enum: ["Low", "Medium", "High", "Urgent"], default: "Medium" },
    dueAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1, dueAt: 1, isArchived: 1 });

export const Task = model<TaskDocument>("Task", taskSchema);
