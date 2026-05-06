import { Router } from "express";
import {
  createEmployeeNotice,
  listEmployeeNotices,
  listRecentNotices,
  markEmployeeNoticeRead,
  markEmployeeNoticesRead,
} from "../controllers/noticeController";

export const noticeRouter = Router();

noticeRouter.get("/notices", listRecentNotices);
noticeRouter.get("/employees/:employeeId/notices", listEmployeeNotices);
noticeRouter.post("/employees/:employeeId/notices", createEmployeeNotice);
noticeRouter.patch("/employees/:employeeId/notices/read", markEmployeeNoticesRead);
noticeRouter.patch("/employees/:employeeId/notices/:noticeId/read", markEmployeeNoticeRead);
