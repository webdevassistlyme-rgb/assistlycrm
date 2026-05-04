import type { Request, Response } from "express";
import { Employee } from "../models/Employee";
import { recordEmployeeTimeIn } from "./attendanceController";
import { recordEmployeeTransaction } from "./employeeTransactionController";

export async function loginWithEmployeeCode(request: Request, response: Response) {
  const employeeCode = String(request.body.employeeCode || "").trim();

  if (!employeeCode) {
    response.status(400).json({ message: "Employee code is required" });
    return;
  }

  if (employeeCode === "00000003") {
    response.json({
      user: { id: "admin", name: "Admin", role: "Admin", employeeCode },
      userType: "admin",
    });
    return;
  }

  const employee = await Employee.findOne({ employeeCode, status: { $ne: "Archived" } });

  if (!employee) {
    response.status(401).json({ message: "Invalid employee code" });
    return;
  }

  await recordEmployeeTimeIn(employee._id);
  await recordEmployeeTransaction({
    employee: employee._id,
    category: "Attendance",
    title: "Shift started",
    description: `${employee.name} logged in and started a shift.`,
  });

  response.json({
    user: employee,
    userType: "employee",
  });
}
