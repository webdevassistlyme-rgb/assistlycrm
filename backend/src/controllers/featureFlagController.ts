import type { Request, Response } from "express";
import { FeatureFlag } from "../models/FeatureFlag";

const defaultFeatures = [
  { key: "dashboard", label: "Dashboard", description: "Overview, summaries, and KPIs.", adminEnabled: true, employeeEnabled: true },
  { key: "leads", label: "Leads", description: "Lead lists, pipeline stages, comments, and follow-ups.", adminEnabled: true, employeeEnabled: true },
  { key: "lead-add", label: "Employee Add Leads", description: "Allow employees to add new leads from their workspace.", adminEnabled: true, employeeEnabled: true },
  { key: "lead-categories", label: "Employee Lead Categories", description: "Show lead category filters, labels, and category fields to employees.", adminEnabled: true, employeeEnabled: true },
  { key: "lead-search", label: "Employee Lead Search", description: "Show the search box in the employee leads workspace.", adminEnabled: true, employeeEnabled: true },
  { key: "tasks", label: "Tasks", description: "Task management, due dates, owners, priorities, and checklists.", adminEnabled: true, employeeEnabled: true },
  { key: "tracking", label: "Tracking", description: "Activity timeline, audit trail, and performance tracking.", adminEnabled: true, employeeEnabled: true },
  { key: "knowledge-base", label: "Knowledge Base", description: "Products, FAQs, documents, and employee suggestions.", adminEnabled: true, employeeEnabled: true },
  { key: "teams", label: "Teams", description: "Team structure and assignments.", adminEnabled: true, employeeEnabled: true },
  { key: "sales", label: "Sales", description: "Sales workspace and deal tracking.", adminEnabled: true, employeeEnabled: true },
  { key: "calendar", label: "Calendar", description: "Schedules, follow-ups, reminders, and appointments.", adminEnabled: true, employeeEnabled: true },
  { key: "attendance", label: "Attendance", description: "Employee time-in, time-out, and attendance history.", adminEnabled: true, employeeEnabled: true },
  { key: "profile", label: "Profile", description: "Employee profile and account information.", adminEnabled: false, employeeEnabled: true },
  { key: "settings", label: "Settings", description: "System settings, roles, branches, tools, and feature control.", adminEnabled: true, employeeEnabled: true },
  { key: "messages", label: "Messages", description: "Team and lead conversations.", adminEnabled: true, employeeEnabled: true },
  { key: "employees", label: "Employees", description: "Employee directory and account management.", adminEnabled: true, employeeEnabled: false },
  { key: "hr", label: "HR", description: "Job postings, applicants, hiring stages, and recruitment notes.", adminEnabled: true, employeeEnabled: false },
  { key: "media", label: "Media", description: "Image and video library.", adminEnabled: true, employeeEnabled: false },
  { key: "payroll", label: "Payroll", description: "Payroll runs, payouts, deductions, and tax settings.", adminEnabled: true, employeeEnabled: false },
  { key: "credentials", label: "Credentials", description: "Saved tools, usernames, passwords, and access records.", adminEnabled: true, employeeEnabled: false },
] as const;

async function ensureFeatureFlags() {
  await FeatureFlag.bulkWrite(
    defaultFeatures.map((feature) => ({
      updateOne: {
        filter: { key: feature.key },
        update: { $setOnInsert: feature },
        upsert: true,
      },
    })),
    { ordered: false }
  );
}

export async function listFeatureFlags(_request: Request, response: Response) {
  await ensureFeatureFlags();
  const features = await FeatureFlag.find().sort({ label: 1 });
  response.json(features);
}

export async function updateFeatureFlag(request: Request, response: Response) {
  await ensureFeatureFlags();
  const key = String(request.params.key || "");
  const result = await FeatureFlag.updateOne(
    { key } as Record<string, unknown>,
    {
      $set: {
        adminEnabled: Boolean(request.body.adminEnabled),
        employeeEnabled: Boolean(request.body.employeeEnabled),
      },
    }
  );

  if (result.matchedCount === 0) {
    response.status(404).json({ message: "Feature not found" });
    return;
  }

  const feature = await FeatureFlag.findOne({ key } as Record<string, unknown>);

  response.json(feature);
}
