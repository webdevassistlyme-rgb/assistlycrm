import type { Request, Response } from "express";
import type { SortOrder } from "mongoose";
import { Employee } from "../models/Employee";
import type { PayrollItemCategory, PayrollListItemDocument, PayrollPayType, PayrollStatus } from "../models/Payroll";
import { PayrollListItem, PayrollRecord } from "../models/Payroll";

const categories: PayrollItemCategory[] = ["Payroll Runs", "Payouts", "Deductions", "Tax Settings"];
const statuses: PayrollStatus[] = ["Paid", "Pending", "Failed", "Completed", "Review", "Applied", "Enabled"];
const payTypes: PayrollPayType[] = ["Monthly", "Hourly", "Contract"];

const demoRecords = [
  ["John Smith", "john.smith@example.com", "EMP-1001", "Engineering", 6000, 800, "Paid", "May 12, 2024"],
  ["Sarah Johnson", "sarah.j@example.com", "EMP-1002", "Marketing", 5500, 750, "Paid", "May 12, 2024"],
  ["Michael Brown", "michael.b@example.com", "EMP-1003", "Sales", 5000, 700, "Paid", "May 12, 2024"],
  ["Emily Davis", "emily.d@example.com", "EMP-1004", "Design", 4800, 650, "Pending", "-"],
  ["David Wilson", "david.w@example.com", "EMP-1005", "Engineering", 6200, 850, "Paid", "May 12, 2024"],
  ["Jessica Taylor", "jessica.t@example.com", "EMP-1006", "HR", 4600, 600, "Paid", "May 12, 2024"],
  ["Daniel Martinez", "daniel.m@example.com", "EMP-1007", "Finance", 5800, 780, "Failed", "-"],
  ["Olivia Anderson", "olivia.a@example.com", "EMP-1008", "Support", 4200, 550, "Pending", "-"],
  ["James Thomas", "james.t@example.com", "EMP-1009", "Sales", 5100, 680, "Paid", "May 12, 2024"],
  ["Sophia Lee", "sophia.lee@example.com", "EMP-1010", "Marketing", 4900, 620, "Paid", "May 12, 2024"],
] as const;

function currentPeriod() {
  return new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toMoney(value: unknown, fallback = 0) {
  const numberValue = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.round(numberValue * 100) / 100 : fallback;
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function sanitizeStatus(value: unknown, fallback: PayrollStatus = "Pending") {
  return statuses.includes(value as PayrollStatus) ? (value as PayrollStatus) : fallback;
}

function sanitizePayType(value: unknown) {
  return payTypes.includes(value as PayrollPayType) ? (value as PayrollPayType) : "Monthly";
}

function estimateGrossPay(role: string, team: string) {
  const text = `${role} ${team}`.toLowerCase();

  if (text.includes("manager") || text.includes("lead")) return 6200;
  if (text.includes("sales")) return 5200;
  if (text.includes("engineer") || text.includes("developer")) return 6500;
  if (text.includes("finance")) return 5600;
  if (text.includes("support")) return 4400;
  return 4800;
}

async function seedPayroll() {
  const recordCount = await PayrollRecord.countDocuments();

  if (recordCount === 0) {
    await PayrollRecord.insertMany(
      demoRecords.map(([employeeName, email, employeeId, department, grossPay, deductions, status, paidOn]) => ({
        employeeName,
        email,
        employeeId,
        department,
        payType: "Monthly",
        grossPay,
        deductions,
        netPay: grossPay - deductions,
        status,
        paidOn,
        payPeriod: "May 2024",
      }))
    );
  }

  const itemCount = await PayrollListItem.countDocuments();

  if (itemCount > 0) return;

  await PayrollListItem.insertMany([
    { category: "Payroll Runs", name: "May 2024 Payroll", second: "May 1 - May 15", third: "$148,750.00", fourth: "180 paid", status: "Completed" },
    { category: "Payroll Runs", name: "April 2024 Payroll", second: "Apr 16 - Apr 30", third: "$142,300.00", fourth: "176 paid", status: "Completed" },
    { category: "Payouts", name: "ACH Batch #2841", second: "180 employees", third: "$130,000.00", fourth: "May 12, 2024", status: "Paid" },
    { category: "Payouts", name: "Manual Payouts", second: "4 employees", third: "$5,420.00", fourth: "Scheduled", status: "Pending" },
    { category: "Deductions", name: "Federal Tax", second: "$8,420.00", third: "Payroll tax", fourth: "Applied", status: "Applied" },
    { category: "Deductions", name: "Benefits", second: "$4,880.00", third: "Health and dental", fourth: "Applied", status: "Applied" },
    { category: "Tax Settings", name: "Federal withholding", second: "Enabled", third: "Default payroll tax withholding", fourth: todayLabel(), status: "Enabled" },
    { category: "Tax Settings", name: "Commission tax rule", second: "Review", third: "Supplemental wage rate pending admin review", fourth: todayLabel(), status: "Review" },
  ]);
}

export async function listPayrollStats(_request: Request, response: Response) {
  await seedPayroll();
  const records = await PayrollRecord.find({ isArchived: false });
  const totalEmployees = await Employee.countDocuments({ status: { $ne: "Archived" } });
  const gross = records.reduce((sum, record) => sum + record.grossPay, 0);
  const deductions = records.reduce((sum, record) => sum + record.deductions, 0);
  const net = records.reduce((sum, record) => sum + record.netPay, 0);

  response.json({
    totalEmployees: totalEmployees || records.length,
    totalPayroll: gross,
    totalDeductions: deductions,
    netPayroll: net,
    paidEmployees: records.filter((record) => record.status === "Paid").length,
  });
}

export async function listPayrollRecords(request: Request, response: Response) {
  await seedPayroll();
  const search = String(request.query.search || "").trim();
  const status = String(request.query.status || "");
  const payPeriod = String(request.query.payPeriod || "");
  const sortBy = String(request.query.sortBy || "employeeId");
  const sortDir = String(request.query.sortDir || "asc") === "desc" ? -1 : 1;
  const sortableFields = new Set(["employeeName", "employeeId", "department", "payType", "grossPay", "deductions", "netPay", "status", "paidOn", "payPeriod"]);
  const filter: Record<string, unknown> = { isArchived: false };

  if (statuses.includes(status as PayrollStatus)) filter.status = status;
  if (payPeriod) filter.payPeriod = payPeriod;
  if (search) {
    filter.$or = [
      { employeeName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { employeeId: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }

  const records = await PayrollRecord.find(filter).sort({
    [sortableFields.has(sortBy) ? sortBy : "employeeId"]: sortDir as SortOrder,
  });
  response.json(records);
}

export async function createPayrollRecord(request: Request, response: Response) {
  const grossPay = toMoney(request.body.grossPay);
  const deductions = toMoney(request.body.deductions);
  const record = await PayrollRecord.create({
    employeeName: request.body.employeeName,
    email: request.body.email || "",
    employeeId: request.body.employeeId,
    department: request.body.department || "General",
    payType: sanitizePayType(request.body.payType),
    grossPay,
    deductions,
    netPay: Math.max(grossPay - deductions, 0),
    status: sanitizeStatus(request.body.status),
    paidOn: request.body.paidOn || "-",
    payPeriod: request.body.payPeriod || currentPeriod(),
  });

  response.status(201).json(record);
}

export async function updatePayrollRecord(request: Request, response: Response) {
  const grossPay = toMoney(request.body.grossPay);
  const deductions = toMoney(request.body.deductions);
  const record = await PayrollRecord.findByIdAndUpdate(
    request.params.id,
    {
      employeeName: request.body.employeeName,
      email: request.body.email || "",
      employeeId: request.body.employeeId,
      department: request.body.department || "General",
      payType: sanitizePayType(request.body.payType),
      grossPay,
      deductions,
      netPay: Math.max(grossPay - deductions, 0),
      status: sanitizeStatus(request.body.status),
      paidOn: request.body.paidOn || "-",
      payPeriod: request.body.payPeriod || currentPeriod(),
    },
    { new: true, runValidators: true }
  );

  if (!record) {
    response.status(404).json({ message: "Payroll record not found" });
    return;
  }

  response.json(record);
}

export async function markPayrollRecordPaid(request: Request, response: Response) {
  const record = await PayrollRecord.findByIdAndUpdate(
    request.params.id,
    { status: "Paid", paidOn: todayLabel() },
    { new: true, runValidators: true }
  );

  if (!record) {
    response.status(404).json({ message: "Payroll record not found" });
    return;
  }

  response.json(record);
}

export async function archivePayrollRecord(request: Request, response: Response) {
  const record = await PayrollRecord.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { new: true, runValidators: true }
  );

  if (!record) {
    response.status(404).json({ message: "Payroll record not found" });
    return;
  }

  response.json(record);
}

export async function runPayroll(request: Request, response: Response) {
  const payPeriod = String(request.body.payPeriod || currentPeriod()).trim();
  const employees = await Employee.find({ status: { $ne: "Archived" } }).sort({ employeeCode: 1 });
  const created = [];

  for (const employee of employees) {
    const exists = await PayrollRecord.exists({ employeeId: employee.employeeCode, payPeriod, isArchived: false });
    if (exists) continue;

    const grossPay = estimateGrossPay(employee.role, employee.team);
    const deductions = Math.round(grossPay * 0.13 * 100) / 100;
    created.push(
      await PayrollRecord.create({
        employeeName: employee.name,
        email: employee.email,
        employeeId: employee.employeeCode,
        department: employee.team || employee.role || "General",
        payType: "Monthly",
        grossPay,
        deductions,
        netPay: grossPay - deductions,
        status: "Pending",
        paidOn: "-",
        payPeriod,
      })
    );
  }

  const netTotal = created.reduce((sum, record) => sum + record.netPay, 0);
  await PayrollListItem.create({
    category: "Payroll Runs",
    name: `${payPeriod} Payroll`,
    second: payPeriod,
    third: formatMoney(netTotal),
    fourth: `${created.length} created`,
    status: created.length > 0 ? "Pending" : "Review",
  });

  response.status(201).json({ created: created.length, records: created });
}

export async function listPayrollItems(request: Request, response: Response) {
  await seedPayroll();
  const category = String(request.query.category || "");
  const filter: Partial<Pick<PayrollListItemDocument, "category" | "isArchived">> = { isArchived: false };

  if (categories.includes(category as PayrollItemCategory)) {
    filter.category = category as PayrollItemCategory;
  }

  const items = await PayrollListItem.find(filter).sort({ createdAt: -1 });
  response.json(items);
}

export async function createPayrollItem(request: Request, response: Response) {
  const category = categories.includes(request.body.category) ? request.body.category : "Deductions";
  const item = await PayrollListItem.create({
    category,
    name: request.body.name,
    second: request.body.second || "",
    third: request.body.third || "",
    fourth: request.body.fourth || todayLabel(),
    status: sanitizeStatus(request.body.status, category === "Tax Settings" ? "Enabled" : "Pending"),
  });

  response.status(201).json(item);
}

export async function archivePayrollItem(request: Request, response: Response) {
  const item = await PayrollListItem.findByIdAndUpdate(
    request.params.id,
    { isArchived: true },
    { new: true, runValidators: true }
  );

  if (!item) {
    response.status(404).json({ message: "Payroll item not found" });
    return;
  }

  response.json(item);
}
