import type { Request, Response } from "express";
import { Task, type TaskPriority, type TaskStatus } from "../models/Task";

const populateTask = ["assignedTo", "relatedLead"];
const statuses: TaskStatus[] = ["Todo", "In Progress", "Done", "Blocked"];
const priorities: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

function cleanDate(value: unknown) {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function sanitizeStatus(value: unknown) {
  return statuses.includes(value as TaskStatus) ? (value as TaskStatus) : "Todo";
}

function sanitizePriority(value: unknown) {
  return priorities.includes(value as TaskPriority) ? (value as TaskPriority) : "Medium";
}

export async function listTasks(request: Request, response: Response) {
  const assignedTo = String(request.query.assignedTo || "").trim();
  const status = String(request.query.status || "").trim();
  const search = String(request.query.search || "").trim();
  const filter: Record<string, unknown> = { isArchived: false };

  if (assignedTo) filter.assignedTo = assignedTo;
  if (statuses.includes(status as TaskStatus)) filter.status = status;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
    ];
  }

  const tasks = await Task.find(filter).populate(populateTask).sort({ dueAt: 1, createdAt: -1 });
  response.json(tasks);
}

export async function createTask(request: Request, response: Response) {
  const task = await Task.create({
    title: request.body.title,
    description: request.body.description || "",
    relatedLead: request.body.relatedLead || null,
    assignedTo: request.body.assignedTo || null,
    status: sanitizeStatus(request.body.status),
    priority: sanitizePriority(request.body.priority),
    dueAt: cleanDate(request.body.dueAt),
    completedAt: request.body.status === "Done" ? new Date() : null,
  });

  response.status(201).json(await Task.findById(task._id).populate(populateTask));
}

export async function updateTask(request: Request, response: Response) {
  const status = sanitizeStatus(request.body.status);
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    {
      title: request.body.title,
      description: request.body.description || "",
      relatedLead: request.body.relatedLead || null,
      assignedTo: request.body.assignedTo || null,
      status,
      priority: sanitizePriority(request.body.priority),
      dueAt: cleanDate(request.body.dueAt),
      completedAt: status === "Done" ? new Date() : null,
    },
    { new: true, runValidators: true }
  ).populate(populateTask);

  if (!task) {
    response.status(404).json({ message: "Task not found" });
    return;
  }

  response.json(task);
}

export async function updateTaskStatus(request: Request, response: Response) {
  const status = sanitizeStatus(request.body.status);
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    { status, completedAt: status === "Done" ? new Date() : null },
    { new: true, runValidators: true }
  ).populate(populateTask);

  if (!task) {
    response.status(404).json({ message: "Task not found" });
    return;
  }

  response.json(task);
}

export async function archiveTask(request: Request, response: Response) {
  const task = await Task.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { new: true, runValidators: true }
  ).populate(populateTask);

  if (!task) {
    response.status(404).json({ message: "Task not found" });
    return;
  }

  response.json(task);
}
