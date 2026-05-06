import { Schema, model } from "mongoose";

export type EmployeeStatus = "Active" | "Training" | "Paused" | "Archived";

export type EmployeeDocument = {
  name: string;
  employeeCode: string;
  role: string;
  team: string;
  email: string;
  phone: string;
  salary: number;
  status: EmployeeStatus;
};

const employeeSchema = new Schema<EmployeeDocument>(
  {
    name: { type: String, required: true, trim: true },
    employeeCode: { type: String, required: true, unique: true, trim: true },
    role: { type: String, required: true, trim: true },
    team: { type: String, required: true, default: "Unassigned", trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, default: "" },
    salary: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Training", "Paused", "Archived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export const Employee = model<EmployeeDocument>("Employee", employeeSchema);
