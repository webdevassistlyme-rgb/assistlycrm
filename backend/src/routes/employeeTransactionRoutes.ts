import { Router } from "express";
import { listEmployeeTransactions } from "../controllers/employeeTransactionController";

export const employeeTransactionRouter = Router();

employeeTransactionRouter.get("/employees/:employeeId/transactions", listEmployeeTransactions);
