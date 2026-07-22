import { api } from "../lib/api";

export type LeaveRequestStatus = "Pending" | "Approved" | "Rejected";
export type LeaveRequestType = "Vacation" | "Sick" | "Emergency" | "Personal" | "Other";

export const leaveRequestTypes: LeaveRequestType[] = ["Vacation", "Sick", "Emergency", "Personal", "Other"];

export type LeaveRequest = {
    _id: string;
    employee: string | {
        _id: string;
        name: string;
        employeeCode: string;
        team: string;
        role: string;
        email?: string;
    };
    leaveType: LeaveRequestType;
    startDate: string;
    endDate: string;
    selectedDates?: string[];
    reason: string;
    status: LeaveRequestStatus;
    adminNote?: string;
    comments?: LeaveRequestComment[];
    reviewedBy?: string;
    reviewedAt?: string;
    createdAt: string;
    updatedAt: string;
};

export type LeaveRequestComment = {
    _id?: string;
    authorType: "Admin" | "Employee";
    authorName: string;
    message: string;
    createdAt: string;
};

export type LeaveRequestInput = {
    leaveType: LeaveRequestType;
    startDate: string;
    endDate: string;
    selectedDates?: string[];
    reason: string;
};

export async function getEmployeeLeaveRequests(employeeId: string) {
    const response = await api.get<LeaveRequest[]>(`/employees/${employeeId}/leave-requests`);
    return response.data;
}

export async function getLeaveRequests(params: { employee?: string; status?: LeaveRequestStatus } = {}) {
    const response = await api.get<LeaveRequest[]>("/leave-requests", { params });
    return response.data;
}

export async function createEmployeeLeaveRequest(employeeId: string, leaveRequest: LeaveRequestInput) {
    const response = await api.post<LeaveRequest>(`/employees/${employeeId}/leave-requests`, leaveRequest);
    return response.data;
}

export async function updateEmployeeLeaveRequest(employeeId: string, requestId: string, leaveRequest: LeaveRequestInput) {
    const response = await api.patch<LeaveRequest>(`/employees/${employeeId}/leave-requests/${requestId}`, leaveRequest);
    return response.data;
}

export async function commentLeaveRequest(id: string, adminNote = "") {
    const response = await api.patch<LeaveRequest>(`/leave-requests/${id}/comment`, { adminNote, reviewedBy: "Admin" });
    return response.data;
}

export async function replyToEmployeeLeaveRequest(employeeId: string, requestId: string, message: string, authorName = "Employee") {
    const response = await api.patch<LeaveRequest>(`/employees/${employeeId}/leave-requests/${requestId}/replies`, { message, authorName });
    return response.data;
}

export async function approveLeaveRequest(id: string, adminNote = "") {
    const response = await api.patch<LeaveRequest>(`/leave-requests/${id}/approve`, { adminNote, reviewedBy: "Admin" });
    return response.data;
}

export async function rejectLeaveRequest(id: string, adminNote = "") {
    const response = await api.patch<LeaveRequest>(`/leave-requests/${id}/reject`, { adminNote, reviewedBy: "Admin" });
    return response.data;
}
