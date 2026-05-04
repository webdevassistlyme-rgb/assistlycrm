import { Schema, model, Types } from "mongoose";

export type AttendanceDocument = {
  employee: Types.ObjectId;
  timeIn: Date;
  source: "Login";
};

const attendanceSchema = new Schema<AttendanceDocument>(
  {
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    timeIn: { type: Date, required: true, default: Date.now },
    source: { type: String, enum: ["Login"], default: "Login" },
  },
  { timestamps: true }
);

export const Attendance = model<AttendanceDocument>("Attendance", attendanceSchema);
