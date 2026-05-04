import { api } from "../lib/api";

export type EmployeeTransaction = {
    _id: string;
    employee: string;
    category: "Attendance" | "Notice" | "Lead" | "Message" | "System";
    title: string;
    description: string;
    occurredAt: string;
    createdAt: string;
};

export async function getEmployeeTransactions(employeeId: string, date?: string) {
    const response = await api.get<EmployeeTransaction[]>(`/employees/${employeeId}/transactions`, {
        params: date ? { date } : undefined,
    });
    return response.data;
}
