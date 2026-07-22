import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type AttendanceSource = "Login" | "Logout" | "Time In" | "Time Out" | "Break Out" | "Break In" | "Lunch Break Out" | "Lunch Break In";
export type AttendanceStatus = "On time" | "Late" | "";

export type AttendanceDocument = {
  employee: Types.ObjectId;
  timeIn: Date;
  source: AttendanceSource;
  attendanceStatus: AttendanceStatus;
  isArchived: boolean;
};

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    timeIn: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ["Login", "Logout", "Time In", "Time Out", "Break Out", "Break In", "Lunch Break Out", "Lunch Break In"], default: "Time In" },
    attendanceStatus: { type: String, enum: ["On time", "Late", ""], default: "" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Attendance = tenantModel<AttendanceDocument>("Attendance", attendanceSchema);
