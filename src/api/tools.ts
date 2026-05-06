import { api } from "../lib/api";

export type Tool = {
    _id: string;
    name: string;
    link: string;
    branches: string[];
    isArchived: boolean;
};

export type ToolInput = {
    name: string;
    link: string;
    branches: string[];
};

export async function getTools() {
    const response = await api.get<Tool[]>("/tools");
    return response.data;
}

export async function createTool(tool: ToolInput) {
    const response = await api.post<Tool>("/tools", tool);
    return response.data;
}

export async function updateTool(id: string, tool: ToolInput) {
    const response = await api.put<Tool>(`/tools/${id}`, tool);
    return response.data;
}

export async function archiveTool(id: string) {
    const response = await api.patch<Tool>(`/tools/${id}/archive`);
    return response.data;
}
