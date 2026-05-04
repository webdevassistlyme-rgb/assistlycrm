import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { Attendance } from "../models/Attendance";

export async function recordEmployeeTimeIn(employeeId: Types.ObjectId | string) {
  return Attendance.create({
    employee: employeeId,
    timeIn: new Date(),
    source: "Login",
  });
}

export async function listEmployeeAttendance(request: Request, response: Response) {
  const employeeId = String(request.params.employeeId);
  const attendance = await Attendance.find({ employee: employeeId }).sort({ timeIn: -1 });

  response.json(attendance);
}
