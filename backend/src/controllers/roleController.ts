import type { Request, Response } from "express";
import { Role } from "../models/Role";

const defaultRoles = ["Sales Agent", "Team Lead", "Manager", "Support Agent"];

async function ensureDefaultRoles() {
  const roleCount = await Role.countDocuments();

  if (roleCount > 0) {
    return;
  }

  await Role.insertMany(defaultRoles.map((name) => ({ name })));
}

export async function listRoles(_request: Request, response: Response) {
  await ensureDefaultRoles();
  const roles = await Role.find({ isArchived: false }).sort({ name: 1 });
  response.json(roles);
}

export async function createRole(request: Request, response: Response) {
  const role = await Role.create({
    name: request.body.name,
    description: request.body.description || "",
  });

  response.status(201).json(role);
}

export async function updateRole(request: Request, response: Response) {
  const role = await Role.findByIdAndUpdate(
    request.params.id,
    {
      name: request.body.name,
      description: request.body.description || "",
    },
    { new: true, runValidators: true }
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
    { new: true, runValidators: true }
  );

  if (!role) {
    response.status(404).json({ message: "Role not found" });
    return;
  }

  response.json(role);
}
