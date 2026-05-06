import type { Request, Response } from "express";
import { Credential } from "../models/Credential";

function getCredentialInput(request: Request) {
  return {
    username: request.body.username,
    password: request.body.password,
    platform: request.body.platform,
    company: request.body.company || "General",
    status: request.body.status || "Active",
  };
}

export async function seedCredentials() {
  const count = await Credential.countDocuments();

  if (count > 0) {
    return;
  }

  await Credential.insertMany([
    {
      username: "admin@assistly.com",
      password: "Assistly#2026",
      platform: "Google Workspace",
      company: "Assistly HQ",
      status: "Active",
    },
    {
      username: "billing@assistly.com",
      password: "Billing#8842",
      platform: "Stripe",
      company: "Finance",
      status: "Review",
    },
    {
      username: "sales.ops",
      password: "SalesOps#4421",
      platform: "CRM Admin",
      company: "Sales Branch",
      status: "Active",
    },
  ]);
}

export async function listCredentials(_request: Request, response: Response) {
  await seedCredentials();
  const credentials = await Credential.find({ status: { $ne: "Archived" } }).sort({ updatedAt: -1 });
  response.json(credentials);
}

export async function createCredential(request: Request, response: Response) {
  const input = getCredentialInput(request);

  if (!input.username?.trim() || !input.password?.trim() || !input.platform?.trim()) {
    response.status(400).json({ message: "username, password, and platform are required" });
    return;
  }

  const credential = await Credential.create(input);
  response.status(201).json(credential);
}

export async function updateCredential(request: Request, response: Response) {
  const credential = await Credential.findByIdAndUpdate(request.params.id, getCredentialInput(request), {
    new: true,
    runValidators: true,
  });

  if (!credential) {
    response.status(404).json({ message: "Credential not found" });
    return;
  }

  response.json(credential);
}

export async function archiveCredential(request: Request, response: Response) {
  const credential = await Credential.findByIdAndUpdate(
    request.params.id,
    { status: "Archived" },
    { new: true, runValidators: true }
  );

  if (!credential) {
    response.status(404).json({ message: "Credential not found" });
    return;
  }

  response.json(credential);
}
