import type { Request, Response } from "express";
import { Tool } from "../models/Tool";

const defaultTools = [
  { name: "Google Workspace", link: "https://workspace.google.com", branches: ["Assistly HQ"] },
  { name: "Stripe", link: "https://stripe.com", branches: ["Finance"] },
  { name: "CRM Admin", link: "", branches: ["Assistly HQ", "Sales Branch"] },
];

async function ensureDefaultTools() {
  const count = await Tool.countDocuments();

  if (count > 0) return;

  await Tool.insertMany(defaultTools);
}

function getToolInput(request: Request) {
  return {
    name: request.body.name,
    link: request.body.link || "",
    branches: Array.isArray(request.body.branches) ? request.body.branches.map(String).filter(Boolean) : [],
  };
}

export async function listTools(_request: Request, response: Response) {
  await ensureDefaultTools();
  const tools = await Tool.find({ isArchived: false }).sort({ name: 1 });
  response.json(tools);
}

export async function createTool(request: Request, response: Response) {
  const input = getToolInput(request);

  if (!input.name?.trim()) {
    response.status(400).json({ message: "name is required" });
    return;
  }

  const tool = await Tool.create(input);
  response.status(201).json(tool);
}

export async function updateTool(request: Request, response: Response) {
  const tool = await Tool.findByIdAndUpdate(request.params.id, getToolInput(request), {
    new: true,
    runValidators: true,
  });

  if (!tool) {
    response.status(404).json({ message: "Tool not found" });
    return;
  }

  response.json(tool);
}

export async function archiveTool(request: Request, response: Response) {
  const tool = await Tool.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { new: true, runValidators: true }
  );

  if (!tool) {
    response.status(404).json({ message: "Tool not found" });
    return;
  }

  response.json(tool);
}
