import { api } from "../lib/api";

export type KnowledgeBaseEntryType = "Product" | "FAQ";
export type KnowledgeBaseStatus = "Active" | "Draft" | "Archived";

export type KnowledgeBaseEntry = {
    _id: string;
    entryType: KnowledgeBaseEntryType;
    title: string;
    category: string;
    description: string;
    scope: string;
    photoUrls: string[];
    documents: KnowledgeBaseDocument[];
    question: string;
    answer: string;
    comments?: KnowledgeBaseComment[];
    status: KnowledgeBaseStatus;
};

export type KnowledgeBaseInput = Omit<KnowledgeBaseEntry, "_id">;

export type KnowledgeBaseComment = {
    comment: string;
    submittedByName: string;
    submittedById: string;
    createdAt: string;
};

export type KnowledgeBaseDocument = {
    name: string;
    url: string;
    mimeType: string;
};

export type KnowledgeBaseSuggestionStatus = "Pending" | "Approved" | "Rejected";

export type KnowledgeBaseSuggestion = {
    _id: string;
    entry: string | Pick<KnowledgeBaseEntry, "_id" | "entryType" | "title" | "question" | "status">;
    entryType: KnowledgeBaseEntryType;
    comment: string;
    title: string;
    category: string;
    description: string;
    scope: string;
    question: string;
    answer: string;
    submittedById: string;
    submittedByName: string;
    status: KnowledgeBaseSuggestionStatus;
    createdAt: string;
    reviewedAt?: string;
};

export type KnowledgeBaseSuggestionInput = {
    entry: string;
    entryType: KnowledgeBaseEntryType;
    comment: string;
    title?: string;
    category?: string;
    description?: string;
    scope?: string;
    question?: string;
    answer?: string;
    submittedById?: string;
    submittedByName?: string;
};

export async function getKnowledgeBaseEntries(entryType?: KnowledgeBaseEntryType) {
    const response = await api.get<KnowledgeBaseEntry[]>("/knowledge-base", { params: { entryType } });
    return response.data;
}

export async function createKnowledgeBaseEntry(entry: KnowledgeBaseInput) {
    const response = await api.post<KnowledgeBaseEntry>("/knowledge-base", entry);
    return response.data;
}

export async function updateKnowledgeBaseEntry(id: string, entry: KnowledgeBaseInput) {
    const response = await api.put<KnowledgeBaseEntry>(`/knowledge-base/${id}`, entry);
    return response.data;
}

export async function archiveKnowledgeBaseEntry(id: string) {
    const response = await api.patch<KnowledgeBaseEntry>(`/knowledge-base/${id}/archive`);
    return response.data;
}

export async function uploadKnowledgeBasePhoto(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
    const response = await api.post<{ url: string }>("/knowledge-base/photos", { dataUrl, fileName: file.name });

    return response.data;
}

export async function uploadKnowledgeBaseDocument(file: File) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
    const response = await api.post<KnowledgeBaseDocument>("/knowledge-base/documents", {
        dataUrl,
        fileName: file.name,
    });

    return response.data;
}

export async function getKnowledgeBaseSuggestions(params?: { entry?: string; status?: KnowledgeBaseSuggestionStatus }) {
    const response = await api.get<KnowledgeBaseSuggestion[]>("/knowledge-base/suggestions", { params });
    return response.data;
}

export async function createKnowledgeBaseSuggestion(suggestion: KnowledgeBaseSuggestionInput) {
    const response = await api.post<KnowledgeBaseSuggestion>("/knowledge-base/suggestions", suggestion);
    return response.data;
}

export async function approveKnowledgeBaseSuggestion(id: string) {
    const response = await api.patch<{ suggestion: KnowledgeBaseSuggestion; entry: KnowledgeBaseEntry }>(
        `/knowledge-base/suggestions/${id}/approve`
    );
    return response.data;
}

export async function rejectKnowledgeBaseSuggestion(id: string) {
    const response = await api.patch<KnowledgeBaseSuggestion>(`/knowledge-base/suggestions/${id}/reject`);
    return response.data;
}
