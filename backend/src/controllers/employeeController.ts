import type { Request, Response } from "express";
import { Employee } from "../models/Employee";

export async function listEmployees(_request: Request, response: Response) {
  const employees = await Employee.find().sort({ createdAt: -1 });
  response.json(employees);
}

export async function createEmployee(request: Request, response: Response) {
  const employee = await Employee.create({
    name: request.body.name,
    employeeCode: request.body.employeeCode,
    role: request.body.role,
    team: request.body.team || "Unassigned",
    email: request.body.email,
    phone: request.body.phone || "",
    status: request.body.status || "Active",
  });

  response.status(201).json(employee);
}

export async function updateEmployee(request: Request, response: Response) {
  const employee = await Employee.findByIdAndUpdate(
    request.params.id,
    {
      name: request.body.name,
      employeeCode: request.body.employeeCode,
      role: request.body.role,
      team: request.body.team || "Unassigned",
      email: request.body.email,
      phone: request.body.phone || "",
      status: request.body.status || "Active",
    },
    { new: true, runValidators: true }
  );

  if (!employee) {
    response.status(404).json({ message: "Employee not found" });
    return;
  }

  response.json(employee);
}

export async function archiveEmployee(request: Request, response: Response) {
  const employee = await Employee.findByIdAndUpdate(
    request.params.id,
    { status: "Archived" },
    { new: true, runValidators: true }
  );

  if (!employee) {
    response.status(404).json({ message: "Employee not found" });
    return;
  }

  response.json(employee);
}
