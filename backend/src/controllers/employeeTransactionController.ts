import type { Request, Response } from "express";
import type { Types } from "mongoose";
import { EmployeeTransaction } from "../models/EmployeeTransaction";

type TransactionInput = {
  employee: Types.ObjectId | string;
  category: "Attendance" | "Notice" | "Lead" | "Message" | "System";
  title: string;
  description: string;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
};

export async function recordEmployeeTransaction(transaction: TransactionInput) {
  return EmployeeTransaction.create({
    ...transaction,
    occurredAt: transaction.occurredAt || new Date(),
  });
}

export async function listEmployeeTransactions(request: Request, response: Response) {
  const employeeId = String(request.params.employeeId);
  const date = String(request.query.date || "").trim();
  const filter: Record<string, unknown> = { employee: employeeId };

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(`${date}T23:59:59.999Z`);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      filter.occurredAt = { $gte: start, $lte: end };
    }
  }

  const transactions = await EmployeeTransaction.find(filter).sort({ occurredAt: -1 });

  response.json(transactions);
}
