import type { Request, Response } from "express";
import { SystemSettings, type CurrencyCode, type PayrollBillingCycle } from "../models/SystemSettings";

export const currencies: CurrencyCode[] = ["USD", "PHP", "EUR", "GBP", "JPY"];
export const payrollBillingCycles: PayrollBillingCycle[] = ["Monthly", "Semi-monthly", "Weekly"];

const defaultSystemSettings = {
  key: "system" as const,
  currencyCode: "USD" as CurrencyCode,
  payrollBillingCycle: "Monthly" as PayrollBillingCycle,
  payrollRunDay: 15,
};

export async function getSystemSettings() {
  return SystemSettings.findOneAndUpdate(
    { key: "system" },
    { $setOnInsert: defaultSystemSettings },
    { new: true, upsert: true, runValidators: true }
  );
}

export async function getCurrencyCode() {
  const settings = await getSystemSettings();
  return settings.currencyCode;
}

export async function readSystemSettings(_request: Request, response: Response) {
  response.json(await getSystemSettings());
}

export async function updateSystemSettings(request: Request, response: Response) {
  const existingSettings = await getSystemSettings();
  const currencyCode = String(request.body.currencyCode || existingSettings.currencyCode || "USD").trim().toUpperCase();
  const payrollBillingCycle = String(request.body.payrollBillingCycle || existingSettings.payrollBillingCycle || "Monthly").trim();
  const payrollRunDay = Number(request.body.payrollRunDay ?? existingSettings.payrollRunDay ?? 15);

  if (!currencies.includes(currencyCode as CurrencyCode)) {
    response.status(400).json({ message: "Valid currencyCode is required" });
    return;
  }

  if (!payrollBillingCycles.includes(payrollBillingCycle as PayrollBillingCycle)) {
    response.status(400).json({ message: "Valid payrollBillingCycle is required" });
    return;
  }

  if (!Number.isFinite(payrollRunDay) || payrollRunDay < 1 || payrollRunDay > 31) {
    response.status(400).json({ message: "payrollRunDay must be between 1 and 31" });
    return;
  }

  const settings = await SystemSettings.findOneAndUpdate(
    { key: "system" },
    {
      currencyCode,
      payrollBillingCycle,
      payrollRunDay: Math.round(payrollRunDay),
    },
    { new: true, upsert: true, runValidators: true }
  );

  response.json(settings);
}
