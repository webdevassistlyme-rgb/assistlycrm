import type { Request, Response } from "express";
import { Role } from "../models/Role";

const defaultRoles = ["Sales Agent", "Team Lead", "Manager", "Support Agent"];

async function ensureDefaultRoles() {
  const roleCount = await Role.countDocuments();

  if (roleCount > 0) {
    return;
  }

  await Role.insertMany(defaultRoles.map((name) => ({ name, department: "Operations", branch: "All branches" })));
}

export async function listRoles(_request: Request, response: Response) {
  await ensureDefaultRoles();
  const roles = await Role.find({ isArchived: false }).sort({ name: 1 });
  response.json(roles);
}

export async function createRole(request: Request, response: Response) {
  const role = await Role.create({
    name: request.body.name,
    department: request.body.department || "General",
    branch: request.body.branch || "All branches",
    description: request.body.description || "",
  });

  response.status(201).json(role);
}

export async function updateRole(request: Request, response: Response) {
  const role = await Role.findByIdAndUpdate(
    request.params.id,
    {
      name: request.body.name,
      department: request.body.department || "General",
      branch: request.body.branch || "All branches",
      description: request.body.description || "",
    },
    { returnDocument: "after", runValidators: true }
  );

  if (!role) {
    response.status(404).json({ message: "Role not found" });
    return;
  }

  response.json(role);
}

export async function archiveRole(request: Request, response: Response) {
  const role = await Role.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { returnDocument: "after", runValidators: true }
  );

  if (!role) {
    response.status(404).json({ message: "Role not found" });
    return;
  }

  response.json(role);
}
