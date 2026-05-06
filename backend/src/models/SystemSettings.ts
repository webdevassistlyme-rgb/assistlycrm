import { Schema, model } from "mongoose";

export type CurrencyCode = "USD" | "PHP" | "EUR" | "GBP" | "JPY";
export type PayrollBillingCycle = "Monthly" | "Semi-monthly" | "Weekly";

export type SystemSettingsDocument = {
  key: "system";
  currencyCode: CurrencyCode;
  payrollBillingCycle: PayrollBillingCycle;
  payrollRunDay: number;
  payrollDeductionPercentage: number;
};

const systemSettingsSchema = new Schema<SystemSettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: "system" },
    currencyCode: { type: String, enum: ["USD", "PHP", "EUR", "GBP", "JPY"], default: "USD" },
    payrollBillingCycle: { type: String, enum: ["Monthly", "Semi-monthly", "Weekly"], default: "Monthly" },
    payrollRunDay: { type: Number, min: 1, max: 31, default: 15 },
    payrollDeductionPercentage: { type: Number, min: 0, max: 100, default: 13 },
  },
  { timestamps: true }
);

export const SystemSettings = model<SystemSettingsDocument>("SystemSettings", systemSettingsSchema);
