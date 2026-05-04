import { Router } from "express";
import { listEmployeeAttendance } from "../controllers/attendanceController";

export const attendanceRouter = Router();

attendanceRouter.get("/employees/:employeeId/attendance", listEmployeeAttendance);
