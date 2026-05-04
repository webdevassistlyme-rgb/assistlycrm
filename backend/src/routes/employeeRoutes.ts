import { Router } from "express";
import {
  archiveEmployee,
  createEmployee,
  listEmployees,
  updateEmployee,
} from "../controllers/employeeController";

export const employeeRouter = Router();

employeeRouter.get("/", listEmployees);
employeeRouter.post("/", createEmployee);
employeeRouter.put("/:id", updateEmployee);
employeeRouter.patch("/:id/archive", archiveEmployee);
