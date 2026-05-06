import { api } from "../lib/api";
import type { Employee } from "./employees";
import type { Team } from "./teams";

export type LeadStatus =
    | "NEW"
    | "Follow up"
    | "Ongoing comms"
    | "Qualified"
    | "Ongoing Negotiation"
    | "Dead"
    | "Archived";

export type Lead = {
    _id: string;
    leadName: string;
    position: string;
    businessName: string;
    businessAddress: string;
    email: string;
    phone: string;
    website: string;
    source: string;
    category: string;
    status: LeadStatus;
    assignedAgent: Employee | null;
    autoAssignedAt: string | null;
    assignedTeam: Team | null;
    googlePlaceId: string;
    notes: string;
    comments?: Array<{
        _id?: string;
        authorName: string;
        authorType: "admin" | "employee";
        body: string;
        createdAt: string;
    }>;
    followUpAt: string | null;
    followUpNote: string;
    followUpPriority: number;
    aiScore: number;
    aiScoreReason: string;
    aiScoreSource: string;
    aiScoredAt: string | null;
};

export type LeadInput = {
    leadName: string;
    position: string;
    businessName: string;
    businessAddress: string;
    email: string;
    phone: string;
    website: string;
    source: string;
    category: string;
    status: LeadStatus;
    assignedAgent: string | null;
    assignedTeam: string | null;
    googlePlaceId: string;
    notes: string;
    followUpAt?: string | null;
    followUpNote?: string;
    followUpPriority?: number;
    aiScore?: number;
    aiScoreReason?: string;
    aiScoreSource?: string;
    aiScoredAt?: string | null;
};

export type GooglePlaceLead = {
    googlePlaceId: string;
    businessName: string;
    businessAddress: string;
    phone: string;
    website: string;
};

export type GooglePlacesSearchResult = {
    places: GooglePlaceLead[];
    nextPageToken: string;
};

export type GooglePlacesImportAllResult = GooglePlacesSearchResult & {
    leads: Lead[];
};

export type GooglePlacesAutoSearchResult = GooglePlacesImportAllResult & {
    product: string;
    location: string;
    searchedQueries: string[];
};

export type LeadScoreResult = {
    usedAi: boolean;
    leads: Lead[];
};

export type LeadReassignmentResult = {
    reassignedCount: number;
    leads: Lead[];
};

export type LeadImportInput = Partial<LeadInput> & {
    createdAt?: string | null;
    assignedToName?: string;
};

export type LeadImportResult = {
    importedCount: number;
    skippedCount: number;
    leads: Lead[];
};

export async function getLeads(params: { assignedAgent?: string } = {}) {
    const response = await api.get<Lead[]>("/leads", { params });
    return response.data;
}

export async function createLead(lead: LeadInput) {
    const response = await api.post<Lead>("/leads", lead);
    return response.data;
}

export async function importLeads(leads: LeadImportInput[]) {
    const response = await api.post<LeadImportResult>("/leads/import", { leads });
    return response.data;
}

export async function updateLead(id: string, lead: LeadInput) {
    const response = await api.put<Lead>(`/leads/${id}`, lead);
    return response.data;
}

export async function archiveLead(id: string) {
    const response = await api.patch<Lead>(`/leads/${id}/archive`);
    return response.data;
}

export async function autoAssignLead(id: string) {
    const response = await api.patch<Lead>(`/leads/${id}/auto-assign`);
    return response.data;
}

export async function reassignNewLeads() {
    const response = await api.patch<LeadReassignmentResult>("/leads/reassign-new");
    return response.data;
}

export async function scheduleLeadFollowUp(
    id: string,
    followUp: { followUpAt: string; followUpNote?: string; followUpPriority?: number }
) {
    const response = await api.patch<Lead>(`/leads/${id}/follow-up`, followUp);
    return response.data;
}

export async function addLeadComment(
    id: string,
    comment: { body: string; authorName?: string; authorType?: "admin" | "employee" }
) {
    const response = await api.post<Lead>(`/leads/${id}/comments`, comment);
    return response.data;
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
    const response = await api.patch<Lead>(`/leads/${id}/status`, { status });
    return response.data;
}

export async function scoreLeadsByHighestPotential(leadIds: string[] = []) {
    const response = await api.post<LeadScoreResult>("/leads/ai-score", { leadIds });
    return response.data;
}

export async function searchGooglePlaces({ textQuery, pageToken = "" }: { textQuery: string; pageToken?: string }) {
    const response = await api.post<GooglePlacesSearchResult>("/leads/google-places/search", { textQuery, pageToken });
    return response.data;
}

export async function importGooglePlaces(places: GooglePlaceLead[], category = "") {
    const response = await api.post<Lead[]>("/leads/google-places/import", { places, category });
    return response.data;
}

export async function searchAndImportGooglePlaces({ textQuery, category = "" }: { textQuery: string; category?: string }) {
    const response = await api.post<GooglePlacesImportAllResult>("/leads/google-places/search-import", { textQuery, category });
    return response.data;
}

export async function autoSearchGooglePlacesLeads({
    product,
    location = "",
    maxResults = 10000,
}: {
    product: string;
    location?: string;
    maxResults?: number;
}) {
    const response = await api.post<GooglePlacesAutoSearchResult>("/leads/google-places/auto-search", {
        product,
        location,
        maxResults,
    });
    return response.data;
}
