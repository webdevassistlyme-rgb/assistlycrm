import type { Request, Response } from "express";
import { Notice } from "../models/Notice";
import { recordEmployeeTransaction } from "./employeeTransactionController";

export async function listEmployeeNotices(request: Request, response: Response) {
  const employeeId = String(request.params.employeeId);
  const notices = await Notice.find({ employee: employeeId }).sort({ createdAt: -1 });
  response.json(notices);
}

export async function createEmployeeNotice(request: Request, response: Response) {
  const employeeId = String(request.params.employeeId);
  const notice = await Notice.create({
    employee: employeeId,
    title: request.body.title,
    message: request.body.message,
    severity: request.body.severity || "Info",
    issuedBy: request.body.issuedBy || "Admin",
  });
  await recordEmployeeTransaction({
    employee: employeeId,
    category: "Notice",
    title: "Notice issued",
    description: `${notice.issuedBy} issued "${notice.title}".`,
    metadata: { noticeId: notice._id.toString(), severity: notice.severity },
  });

  response.status(201).json(notice);
}
