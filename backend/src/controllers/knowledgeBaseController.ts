import type { Request, Response } from "express";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { KnowledgeBaseEntry, type KnowledgeBaseEntryType } from "../models/KnowledgeBaseEntry";
import { KnowledgeBaseSuggestion } from "../models/KnowledgeBaseSuggestion";

function normalizePhotoUrls(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((url) => String(url).trim()).filter(Boolean);
  }

  return String(value || "")
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
}

function normalizeDocuments(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((document) => ({
      name: String(document?.name || "").trim(),
      url: String(document?.url || "").trim(),
      mimeType: String(document?.mimeType || "application/octet-stream").trim(),
    }))
    .filter((document) => document.name && document.url);
}

function getEntryInput(request: Request) {
  const entryType: KnowledgeBaseEntryType = request.body.entryType === "FAQ" ? "FAQ" : "Product";

  return {
    entryType,
    title: request.body.title || "",
    category: request.body.category || "",
    description: request.body.description || "",
    scope: request.body.scope || "",
    photoUrls: normalizePhotoUrls(request.body.photoUrls),
    documents: normalizeDocuments(request.body.documents),
    question: request.body.question || "",
    answer: request.body.answer || "",
    comments: Array.isArray(request.body.comments) ? request.body.comments : [],
    status: request.body.status || "Active",
  };
}

function getSuggestionInput(request: Request) {
  const entryType: KnowledgeBaseEntryType = request.body.entryType === "FAQ" ? "FAQ" : "Product";

  return {
    entry: request.body.entry,
    entryType,
    comment: request.body.comment || "",
    title: request.body.title || "",
    category: request.body.category || "",
    description: request.body.description || "",
    scope: request.body.scope || "",
    question: request.body.question || "",
    answer: request.body.answer || "",
    submittedById: request.body.submittedById || "",
    submittedByName: request.body.submittedByName || "Employee",
    status: "Pending" as const,
  };
}

export async function listKnowledgeBaseEntries(request: Request, response: Response) {
  const entryType = String(request.query.entryType || "").trim();
  const filter: Record<string, unknown> = { status: { $ne: "Archived" } };

  if (entryType === "Product" || entryType === "FAQ") {
    filter.entryType = entryType;
  }

  const entries = await KnowledgeBaseEntry.find(filter).sort({ updatedAt: -1 });
  response.json(entries);
}

export async function createKnowledgeBaseEntry(request: Request, response: Response) {
  const input = getEntryInput(request);

  if (input.entryType === "FAQ" && !input.question.trim()) {
    response.status(400).json({ message: "question is required" });
    return;
  }

  if (input.entryType === "Product" && !input.title.trim()) {
    response.status(400).json({ message: "title is required" });
    return;
  }

  const entry = await KnowledgeBaseEntry.create(input);
  response.status(201).json(entry);
}

export async function updateKnowledgeBaseEntry(request: Request, response: Response) {
  const entry = await KnowledgeBaseEntry.findByIdAndUpdate(request.params.id, getEntryInput(request), {
    new: true,
    runValidators: true,
  });

  if (!entry) {
    response.status(404).json({ message: "Knowledge base entry not found" });
    return;
  }

  response.json(entry);
}

export async function archiveKnowledgeBaseEntry(request: Request, response: Response) {
  const entry = await KnowledgeBaseEntry.findByIdAndUpdate(
    request.params.id,
    { status: "Archived" },
    { new: true, runValidators: true }
  );

  if (!entry) {
    response.status(404).json({ message: "Knowledge base entry not found" });
    return;
  }

  response.json(entry);
}

export async function uploadKnowledgeBasePhoto(request: Request, response: Response) {
  const dataUrl = String(request.body.dataUrl || "");
  const originalName = String(request.body.fileName || "image").replace(/[^a-zA-Z0-9._-]/g, "-");
  const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,(.+)$/);

  if (!match) {
    response.status(400).json({ message: "Valid image dataUrl is required" });
    return;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : mimeType === "image/gif" ? "gif" : "jpg";
  const uploadDir = path.resolve("uploads", "knowledge-base");
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${originalName}.${extension}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(base64, "base64"));

  response.status(201).json({ url: `/uploads/knowledge-base/${fileName}` });
}

export async function uploadKnowledgeBaseDocument(request: Request, response: Response) {
  const dataUrl = String(request.body.dataUrl || "");
  const originalName = String(request.body.fileName || "document").replace(/[^a-zA-Z0-9._-]/g, "-");
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);

  if (!match) {
    response.status(400).json({ message: "Valid document dataUrl is required" });
    return;
  }

  const mimeType = match[1];
  const base64 = match[2];
  const allowedMimeTypes = new Set([
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ]);

  if (!allowedMimeTypes.has(mimeType)) {
    response.status(400).json({ message: "Unsupported document type" });
    return;
  }

  const uploadDir = path.resolve("uploads", "knowledge-base", "documents");
  const fileName = `${Date.now()}-${Math.random().toString(16).slice(2)}-${originalName}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, fileName), Buffer.from(base64, "base64"));

  response.status(201).json({
    name: originalName,
    url: `/uploads/knowledge-base/documents/${fileName}`,
    mimeType,
  });
}

export async function listKnowledgeBaseSuggestions(request: Request, response: Response) {
  const entryId = String(request.query.entry || "").trim();
  const status = String(request.query.status || "").trim();
  const filter: Record<string, unknown> = {};

  if (entryId) {
    filter.entry = entryId;
  }

  if (["Pending", "Approved", "Rejected"].includes(status)) {
    filter.status = status;
  }

  const suggestions = await KnowledgeBaseSuggestion.find(filter)
    .populate({ path: "entry", select: "entryType title question status" })
    .sort({ createdAt: -1 });

  response.json(suggestions);
}

export async function createKnowledgeBaseSuggestion(request: Request, response: Response) {
  const input = getSuggestionInput(request);

  if (!input.entry) {
    response.status(400).json({ message: "entry is required" });
    return;
  }

  const hasSuggestedChange = [
    input.title,
    input.category,
    input.description,
    input.scope,
    input.question,
    input.answer,
  ].some((value) => value.trim());

  if (!input.comment.trim() && !hasSuggestedChange) {
    response.status(400).json({ message: "comment or suggested change is required" });
    return;
  }

  const entry = await KnowledgeBaseEntry.findById(input.entry);

  if (!entry) {
    response.status(404).json({ message: "Knowledge base entry not found" });
    return;
  }

  const suggestion = await KnowledgeBaseSuggestion.create({ ...input, entryType: entry.entryType });
  response.status(201).json(suggestion);
}

export async function approveKnowledgeBaseSuggestion(request: Request, response: Response) {
  const suggestion = await KnowledgeBaseSuggestion.findById(request.params.id);

  if (!suggestion) {
    response.status(404).json({ message: "Suggestion not found" });
    return;
  }

  const entry = await KnowledgeBaseEntry.findById(suggestion.entry);

  if (!entry) {
    response.status(404).json({ message: "Knowledge base entry not found" });
    return;
  }

  if (entry.entryType === "Product") {
    if (suggestion.title.trim()) entry.title = suggestion.title;
    if (suggestion.category.trim()) entry.category = suggestion.category;
    if (suggestion.description.trim()) entry.description = suggestion.description;
    if (suggestion.scope.trim()) entry.scope = suggestion.scope;
  } else {
    if (suggestion.question.trim()) entry.question = suggestion.question;
    if (suggestion.answer.trim()) entry.answer = suggestion.answer;
  }

  if (suggestion.comment.trim()) {
    entry.comments.push({
      comment: suggestion.comment,
      submittedById: suggestion.submittedById,
      submittedByName: suggestion.submittedByName,
      createdAt: new Date(),
    });
  }

  suggestion.status = "Approved";
  suggestion.reviewedAt = new Date();

  await entry.save();
  await suggestion.save();

  response.json({ suggestion, entry });
}

export async function rejectKnowledgeBaseSuggestion(request: Request, response: Response) {
  const suggestion = await KnowledgeBaseSuggestion.findByIdAndUpdate(
    request.params.id,
    { status: "Rejected", reviewedAt: new Date() },
    { new: true, runValidators: true }
  );

  if (!suggestion) {
    response.status(404).json({ message: "Suggestion not found" });
    return;
  }

  response.json(suggestion);
}
