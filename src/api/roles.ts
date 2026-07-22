import { api } from "../lib/api";

export type Role = {
    _id: string;
    name: string;
    department: string;
    branch: string;
    description: string;
    isArchived: boolean;
};

export type RoleInput = {
    name: string;
    department: string;
    branch: string;
    description: string;
};

export async function getRoles() {
    const response = await api.get<Role[]>("/roles");
    return response.data;
}

export async function createRole(role: RoleInput) {
    const response = await api.post<Role>("/roles", role);
    return response.data;
}

export async function updateRole(id: string, role: RoleInput) {
    const response = await api.put<Role>(`/roles/${id}`, role);
    return response.data;
}

export async function archiveRole(id: string) {
    const response = await api.patch<Role>(`/roles/${id}/archive`);
    return response.data;
}
