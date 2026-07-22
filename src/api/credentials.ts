import { api } from "../lib/api";

export type CredentialStatus = "Active" | "Review" | "Archived";

export type Credential = {
    _id: string;
    accountName: string;
    username: string;
    password: string;
    platform: string;
    company: string;
    team: string;
    status: CredentialStatus;
    createdAt?: string;
    updatedAt?: string;
};

export type CredentialInput = {
    accountName: string;
    username: string;
    password: string;
    platform: string;
    company: string;
    team: string;
    status?: CredentialStatus;
};

export async function getCredentials() {
    const response = await api.get<Credential[]>("/credentials");
    return response.data;
}

export async function createCredential(credential: CredentialInput) {
    const response = await api.post<Credential>("/credentials", credential);
    return response.data;
}

export async function updateCredential(id: string, credential: CredentialInput) {
    const response = await api.put<Credential>(`/credentials/${id}`, credential);
    return response.data;
}

export async function archiveCredential(id: string) {
    const response = await api.patch<Credential>(`/credentials/${id}/archive`);
    return response.data;
}
