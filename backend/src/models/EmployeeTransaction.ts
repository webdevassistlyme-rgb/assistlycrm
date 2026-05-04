import { Schema, model, Types } from "mongoose";

export type EmployeeTransactionDocument = {
  employee: Types.ObjectId;
  category: "Attendance" | "Notice" | "Lead" | "Message" | "System";
  title: string;
  description: string;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
};

const employeeTransactionSchema = new Schema<EmployeeTransactionDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    category: {
      type: String,
      enum: ["Attendance", "Notice", "Lead", "Message", "System"],
      default: "System",
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    occurredAt: { type: Date, required: true, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const EmployeeTransaction = model<EmployeeTransactionDocument>(
  "EmployeeTransaction",
  employeeTransactionSchema
);
