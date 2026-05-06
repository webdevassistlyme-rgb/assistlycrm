import { api } from "../lib/api";

export type CurrencyCode = "USD" | "PHP" | "EUR" | "GBP" | "JPY";
export type PayrollBillingCycle = "Monthly" | "Semi-monthly" | "Weekly";

export type SystemSettings = {
    _id: string;
    key: "system";
    currencyCode: CurrencyCode;
    payrollBillingCycle: PayrollBillingCycle;
    payrollRunDay: number;
    payrollDeductionPercentage: number;
};

export const currencyOptions: Array<{ code: CurrencyCode; label: string; symbol: string }> = [
    { code: "USD", label: "US Dollar", symbol: "$" },
    { code: "PHP", label: "Philippine Peso", symbol: "₱" },
    { code: "EUR", label: "Euro", symbol: "€" },
    { code: "GBP", label: "British Pound", symbol: "£" },
    { code: "JPY", label: "Japanese Yen", symbol: "¥" },
];

export const payrollBillingCycleOptions: PayrollBillingCycle[] = ["Monthly", "Semi-monthly", "Weekly"];

export async function getSystemSettings() {
    const response = await api.get<SystemSettings>("/system-settings");
    return response.data;
}

export async function updateSystemSettings(settings: Partial<Pick<SystemSettings, "currencyCode" | "payrollBillingCycle" | "payrollRunDay" | "payrollDeductionPercentage">>) {
    const response = await api.put<SystemSettings>("/system-settings", settings);
    return response.data;
}
