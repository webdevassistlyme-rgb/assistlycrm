import { api } from "../lib/api";
import type { Employee } from "./employees";
import type { Lead } from "./leads";

export type TaskStatus = "Todo" | "In Progress" | "Done" | "Blocked";
export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type CrmTask = {
    _id: string;
    title: string;
    description: string;
    relatedLead: Lead | null;
    assignedTo: Employee | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
    completedAt: string | null;
    comments?: Array<{
        _id?: string;
        authorName: string;
        authorType: "admin" | "employee";
        body: string;
        createdAt: string;
    }>;
    createdAt?: string;
    updatedAt?: string;
};

export type TaskInput = {
    title: string;
    description: string;
    relatedLead: string | null;
    assignedTo: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt: string | null;
};

export async function getTasks(params: { assignedTo?: string; status?: string; search?: string } = {}) {
    const response = await api.get<CrmTask[]>("/tasks", { params });
    return response.data;
}

export async function getTask(id: string) {
    const response = await api.get<CrmTask>(`/tasks/${id}`);
    return response.data;
}

export async function createTask(task: TaskInput) {
    const response = await api.post<CrmTask>("/tasks", task);
    return response.data;
}

export async function updateTask(id: string, task: TaskInput) {
    const response = await api.put<CrmTask>(`/tasks/${id}`, task);
    return response.data;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
    const response = await api.patch<CrmTask>(`/tasks/${id}/status`, { status });
    return response.data;
}

export async function addTaskComment(
    id: string,
    comment: { body: string; authorName?: string; authorType?: "admin" | "employee" }
) {
    const response = await api.post<CrmTask>(`/tasks/${id}/comments`, comment);
    return response.data;
}

export async function archiveTask(id: string) {
    const response = await api.patch<CrmTask>(`/tasks/${id}/archive`);
    return response.data;
}
