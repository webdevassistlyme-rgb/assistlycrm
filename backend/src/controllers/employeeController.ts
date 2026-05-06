import type { Request, Response } from "express";
import { Employee } from "../models/Employee";
import { reassignLeadsFromAgent } from "./leadController";

function toSalary(value: unknown) {
  const salary = Number(value);
  return Number.isFinite(salary) && salary >= 0 ? Math.round(salary * 100) / 100 : 0;
}

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
    salary: toSalary(request.body.salary),
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
      salary: toSalary(request.body.salary),
      status: request.body.status || "Active",
    },
    { new: true, runValidators: true }
  );

  if (!employee) {
    response.status(404).json({ message: "Employee not found" });
    return;
  }

  if (employee.status === "Archived") {
    await reassignLeadsFromAgent(String(employee._id));
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

  await reassignLeadsFromAgent(String(employee._id));

  response.json(employee);
}

export async function deleteEmployee(request: Request, response: Response) {
  const employee = await Employee.findByIdAndDelete(request.params.id);

  if (!employee) {
    response.status(404).json({ message: "Employee not found" });
    return;
  }

  await reassignLeadsFromAgent(String(employee._id));

  response.json(employee);
}
