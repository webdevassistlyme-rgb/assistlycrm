import type { Request, Response } from "express";
import { Branch } from "../models/Branch";

const defaultBranches = [
  { name: "Assistly HQ", company: "Assistly", location: "Main office" },
  { name: "Finance", company: "Assistly", location: "Finance team" },
  { name: "Sales Branch", company: "Assistly", location: "Sales team" },
];

async function ensureDefaultBranches() {
  const count = await Branch.countDocuments();

  if (count > 0) {
    return;
  }

  await Branch.insertMany(defaultBranches);
}

export async function listBranches(_request: Request, response: Response) {
  await ensureDefaultBranches();
  const branches = await Branch.find({ isArchived: false }).sort({ name: 1 });
  response.json(branches);
}

export async function createBranch(request: Request, response: Response) {
  const branch = await Branch.create({
    name: request.body.name,
    company: request.body.company || "Assistly",
    location: request.body.location || "",
  });

  response.status(201).json(branch);
}

export async function updateBranch(request: Request, response: Response) {
  const branch = await Branch.findByIdAndUpdate(
    request.params.id,
    {
      name: request.body.name,
      company: request.body.company || "Assistly",
      location: request.body.location || "",
    },
    { returnDocument: "after", runValidators: true }
  );

  if (!branch) {
    response.status(404).json({ message: "Branch not found" });
    return;
  }

  response.json(branch);
}

export async function archiveBranch(request: Request, response: Response) {
  const branch = await Branch.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { returnDocument: "after", runValidators: true }
  );

  if (!branch) {
    response.status(404).json({ message: "Branch not found" });
    return;
  }

  response.json(branch);
}
