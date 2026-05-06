import type { Request, Response } from "express";
import type { SortOrder } from "mongoose";
import { Employee } from "../models/Employee";
import type { PayrollItemCategory, PayrollListItemDocument, PayrollPayType, PayrollStatus } from "../models/Payroll";
import { PayrollListItem, PayrollRecord } from "../models/Payroll";
import { getCurrencyCode, getSystemSettings } from "./systemSettingsController";

const categories: PayrollItemCategory[] = ["Payroll Runs", "Payouts", "Deductions", "Tax Settings"];
const statuses: PayrollStatus[] = ["Paid", "Pending", "Failed", "Completed", "Review", "Applied", "Enabled"];
const payTypes: PayrollPayType[] = ["Monthly", "Hourly", "Contract"];

function currentPeriod(cycle = "Monthly") {
  const now = new Date();

  if (cycle === "Weekly") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    return `Week of ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  }

  if (cycle === "Semi-monthly") {
    const half = now.getDate() <= 15 ? "1-15" : "16-End";
    return `${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })} ${half}`;
  }

  return now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toMoney(value: unknown, fallback = 0) {
  const numberValue = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.round(numberValue * 100) / 100 : fallback;
}

async function formatMoney(value: number) {
  return value.toLocaleString("en-US", { style: "currency", currency: await getCurrencyCode() });
}

function isEmployeeDeductionItem(item: PayrollListItemDocument) {
  const frequency = String(item.fourth || "").toLowerCase();
  return ["every payroll", "per employee", "monthly", "weekly", "semi-monthly", "each payroll"].some((label) => frequency.includes(label));
}

async function getEmployeeDeductionTotal() {
  const deductionItems = await PayrollListItem.find({
    category: "Deductions",
    isArchived: false,
    status: { $ne: "Failed" },
  });

  return deductionItems
    .filter(isEmployeeDeductionItem)
    .reduce((sum, item) => sum + toMoney(item.second), 0);
}

function sanitizeStatus(value: unknown, fallback: PayrollStatus = "Pending") {
  return statuses.includes(value as PayrollStatus) ? (value as PayrollStatus) : fallback;
}

function sanitizePayType(value: unknown) {
  return payTypes.includes(value as PayrollPayType) ? (value as PayrollPayType) : "Monthly";
}

async function seedPayroll() {
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

async function syncEmployeePayrollRecords(payPeriod = "") {
  const settings = await getSystemSettings();
  const resolvedPayPeriod = payPeriod || currentPeriod(settings.payrollBillingCycle);
  const employeeDeductionTotal = await getEmployeeDeductionTotal();
  const employees = await Employee.find({ status: { $ne: "Archived" } }).sort({ employeeCode: 1 });
  const records = [];

  for (const employee of employees) {
    const grossPay = toMoney(employee.salary);
    const deductions = Math.min(grossPay, employeeDeductionTotal);
    const existingRecords = await PayrollRecord.find({ employeeId: employee.employeeCode, payPeriod: resolvedPayPeriod, isArchived: false }).sort({ updatedAt: -1, createdAt: -1 });
    const existingRecord = existingRecords[0];

    if (existingRecords.length > 1) {
      await PayrollRecord.updateMany(
        { _id: { $in: existingRecords.slice(1).map((record) => record._id) } },
        { isArchived: true }
      );
    }

    if (existingRecord) {
      if (existingRecord.status === "Pending" || existingRecord.status === "Review") {
        existingRecord.employeeName = employee.name;
        existingRecord.email = employee.email;
        existingRecord.department = employee.team || employee.role || "General";
        existingRecord.payType = "Monthly";
        existingRecord.grossPay = grossPay;
        existingRecord.deductions = deductions;
        existingRecord.netPay = Math.max(grossPay - deductions, 0);
        await existingRecord.save();
      }

      records.push(existingRecord);
      continue;
    }

    records.push(
      await PayrollRecord.create({
        employeeName: employee.name,
        email: employee.email,
        employeeId: employee.employeeCode,
        department: employee.team || employee.role || "General",
        payType: "Monthly",
        grossPay,
        deductions,
        netPay: Math.max(grossPay - deductions, 0),
        status: grossPay > 0 ? "Pending" : "Review",
        paidOn: "-",
        payPeriod: resolvedPayPeriod,
      })
    );
  }

  return records;
}

export async function listPayrollStats(_request: Request, response: Response) {
  await seedPayroll();
  const settings = await getSystemSettings();
  const payPeriod = currentPeriod(settings.payrollBillingCycle);
  await syncEmployeePayrollRecords(payPeriod);
  const activeEmployees = await Employee.find({ status: { $ne: "Archived" } }).select("employeeCode");
  const activeEmployeeCodes = activeEmployees.map((employee) => employee.employeeCode);
  const records = await PayrollRecord.find({ isArchived: false, employeeId: { $in: activeEmployeeCodes }, payPeriod });
  const totalEmployees = activeEmployeeCodes.length;
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
  const settings = await getSystemSettings();
  const showArchived = String(request.query.archived || "") === "true";
  const requestedPayPeriod = String(request.query.payPeriod || (showArchived ? "" : currentPeriod(settings.payrollBillingCycle))).trim();

  if (!showArchived) {
    await syncEmployeePayrollRecords(requestedPayPeriod || currentPeriod(settings.payrollBillingCycle));
  }

  const search = String(request.query.search || "").trim();
  const status = String(request.query.status || "");
  const payPeriod = requestedPayPeriod;
  const sortBy = String(request.query.sortBy || "employeeId");
  const sortDir = String(request.query.sortDir || "asc") === "desc" ? -1 : 1;
  const sortableFields = new Set(["employeeName", "employeeId", "department", "payType", "grossPay", "deductions", "netPay", "status", "paidOn", "payPeriod"]);
  const filter: Record<string, unknown> = { isArchived: showArchived };

  if (!showArchived) {
    const activeEmployees = await Employee.find({ status: { $ne: "Archived" } }).select("employeeCode");
    const activeEmployeeCodes = activeEmployees.map((employee) => employee.employeeCode);
    filter.employeeId = { $in: activeEmployeeCodes };
  }

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

export async function markPayrollRecordUnpaid(request: Request, response: Response) {
  const record = await PayrollRecord.findByIdAndUpdate(
    request.params.id,
    { status: "Pending", paidOn: "-" },
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

export async function restorePayrollRecord(request: Request, response: Response) {
  const record = await PayrollRecord.findByIdAndUpdate(
    request.params.id,
    { isArchived: false },
    { new: true, runValidators: true }
  );

  if (!record) {
    response.status(404).json({ message: "Payroll record not found" });
    return;
  }

  response.json(record);
}

export async function runPayroll(request: Request, response: Response) {
  const settings = await getSystemSettings();
  const payPeriod = String(request.body.payPeriod || currentPeriod(settings.payrollBillingCycle)).trim();
  const records = await syncEmployeePayrollRecords(payPeriod);
  const created = records.filter((record) => record.payPeriod === payPeriod && record.status !== "Paid");

  const netTotal = created.reduce((sum, record) => sum + record.netPay, 0);
  await PayrollListItem.create({
    category: "Payroll Runs",
    name: `${payPeriod} Payroll`,
    second: payPeriod,
    third: await formatMoney(netTotal),
    fourth: `${created.length} created`,
    status: created.length > 0 ? "Pending" : "Review",
  });

  response.status(201).json({ created: created.length, records: created });
}

export async function listPayrollItems(request: Request, response: Response) {
  await seedPayroll();
  const category = String(request.query.category || "");
  const showArchived = String(request.query.archived || "") === "true";
  const filter: Partial<Pick<PayrollListItemDocument, "category" | "isArchived">> = { isArchived: showArchived };

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
    fourth: request.body.fourth || (category === "Deductions" ? "Every payroll" : todayLabel()),
    status: sanitizeStatus(request.body.status, category === "Tax Settings" ? "Enabled" : category === "Deductions" ? "Applied" : "Pending"),
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

export async function restorePayrollItem(request: Request, response: Response) {
  const item = await PayrollListItem.findByIdAndUpdate(
    request.params.id,
    { isArchived: false },
    { new: true, runValidators: true }
  );

  if (!item) {
    response.status(404).json({ message: "Payroll item not found" });
    return;
  }

  response.json(item);
}
