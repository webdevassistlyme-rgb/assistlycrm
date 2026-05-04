import { Router } from "express";
import { createEmployeeNotice, listEmployeeNotices } from "../controllers/noticeController";

export const noticeRouter = Router();

noticeRouter.get("/employees/:employeeId/notices", listEmployeeNotices);
noticeRouter.post("/employees/:employeeId/notices", createEmployeeNotice);
