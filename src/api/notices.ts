import { api } from "../lib/api";

export type NoticeSeverity = "Info" | "Warning" | "Critical";

export type Notice = {
    _id: string;
    employee: string;
    title: string;
    message: string;
    severity: NoticeSeverity;
    issuedBy: string;
    createdAt: string;
};

export type NoticeInput = {
    title: string;
    message: string;
    severity: NoticeSeverity;
    issuedBy: string;
};

export async function getEmployeeNotices(employeeId: string) {
    const response = await api.get<Notice[]>(`/employees/${employeeId}/notices`);
    return response.data;
}

export async function createEmployeeNotice(employeeId: string, notice: NoticeInput) {
    const response = await api.post<Notice>(`/employees/${employeeId}/notices`, notice);
    return response.data;
}
