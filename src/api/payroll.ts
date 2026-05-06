import { api } from "../lib/api";

export type PayrollStatus = "Paid" | "Pending" | "Failed" | "Completed" | "Review" | "Applied" | "Enabled";
export type PayrollItemCategory = "Payroll Runs" | "Payouts" | "Deductions" | "Tax Settings";
export type PayrollPayType = "Monthly" | "Hourly" | "Contract";

export type PayrollRecord = {
    _id: string;
    employeeName: string;
    email: string;
    employeeId: string;
    department: string;
    payType: PayrollPayType;
    grossPay: number;
    deductions: number;
    netPay: number;
    status: PayrollStatus;
    paidOn: string;
    payPeriod: string;
    createdAt?: string;
    updatedAt?: string;
};

export type PayrollListItem = {
    _id: string;
    category: PayrollItemCategory;
    name: string;
    second: string;
    third: string;
    fourth: string;
    status: PayrollStatus;
};

export type PayrollStats = {
    totalEmployees: number;
    totalPayroll: number;
    totalDeductions: number;
    netPayroll: number;
    paidEmployees: number;
};

export type PayrollRecordInput = Omit<PayrollRecord, "_id" | "netPay" | "createdAt" | "updatedAt">;
export type PayrollItemInput = Omit<PayrollListItem, "_id">;

export async function getPayrollStats() {
    const response = await api.get<PayrollStats>("/payroll/stats");
    return response.data;
}

export async function getPayrollRecords(params?: {
    search?: string;
    status?: string;
    payPeriod?: string;
    sortBy?: string;
    sortDir?: "asc" | "desc";
}) {
    const response = await api.get<PayrollRecord[]>("/payroll/records", { params });
    return response.data;
}

export async function getPayrollItems(category?: PayrollItemCategory) {
    const response = await api.get<PayrollListItem[]>("/payroll/items", { params: { category } });
    return response.data;
}

export async function createPayrollRecord(record: PayrollRecordInput) {
    const response = await api.post<PayrollRecord>("/payroll/records", record);
    return response.data;
}

export async function updatePayrollRecord(id: string, record: PayrollRecordInput) {
    const response = await api.put<PayrollRecord>(`/payroll/records/${id}`, record);
    return response.data;
}

export async function markPayrollRecordPaid(id: string) {
    const response = await api.patch<PayrollRecord>(`/payroll/records/${id}/paid`);
    return response.data;
}

export async function archivePayrollRecord(id: string) {
    const response = await api.patch<PayrollRecord>(`/payroll/records/${id}/archive`);
    return response.data;
}

export async function runPayroll(payPeriod: string) {
    const response = await api.post<{ created: number; records: PayrollRecord[] }>("/payroll/run", { payPeriod });
    return response.data;
}

export async function createPayrollItem(item: PayrollItemInput) {
    const response = await api.post<PayrollListItem>("/payroll/items", item);
    return response.data;
}

export async function archivePayrollItem(id: string) {
    const response = await api.patch<PayrollListItem>(`/payroll/items/${id}/archive`);
    return response.data;
}
