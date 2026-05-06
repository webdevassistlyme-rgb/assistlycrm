import { api } from "../lib/api";

export type NoticeSeverity = "Info" | "Warning" | "Critical";

export type Notice = {
    _id: string;
    employee: string | { _id: string; name: string; employeeCode: string; team: string; role: string };
    title: string;
    message: string;
    severity: NoticeSeverity;
    issuedBy: string;
    isRead: boolean;
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

export async function getRecentNotices() {
    const response = await api.get<Notice[]>("/notices");
    return response.data;
}

export async function createEmployeeNotice(employeeId: string, notice: NoticeInput) {
    const response = await api.post<Notice>(`/employees/${employeeId}/notices`, notice);
    return response.data;
}

export async function markEmployeeNoticeRead(employeeId: string, noticeId: string) {
    const response = await api.patch<Notice>(`/employees/${employeeId}/notices/${noticeId}/read`);
    return response.data;
}

export async function markEmployeeNoticesRead(employeeId: string) {
    const response = await api.patch<Notice[]>(`/employees/${employeeId}/notices/read`);
    return response.data;
}
