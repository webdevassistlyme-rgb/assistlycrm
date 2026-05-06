import { api } from "../lib/api";

export type Branch = {
    _id: string;
    name: string;
    company: string;
    location: string;
    isArchived: boolean;
};

export type BranchInput = {
    name: string;
    company: string;
    location: string;
};

export async function getBranches() {
    const response = await api.get<Branch[]>("/branches");
    return response.data;
}

export async function createBranch(branch: BranchInput) {
    const response = await api.post<Branch>("/branches", branch);
    return response.data;
}

export async function updateBranch(id: string, branch: BranchInput) {
    const response = await api.put<Branch>(`/branches/${id}`, branch);
    return response.data;
}

export async function archiveBranch(id: string) {
    const response = await api.patch<Branch>(`/branches/${id}/archive`);
    return response.data;
}
