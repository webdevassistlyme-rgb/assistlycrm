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
    status: LeadStatus;
    assignedAgent: Employee | null;
    assignedTeam: Team | null;
    googlePlaceId: string;
    notes: string;
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
    status: LeadStatus;
    assignedAgent: string | null;
    assignedTeam: string | null;
    googlePlaceId: string;
    notes: string;
};

export type GooglePlaceLead = {
    googlePlaceId: string;
    businessName: string;
    businessAddress: string;
    phone: string;
    website: string;
};

export async function getLeads() {
    const response = await api.get<Lead[]>("/leads");
    return response.data;
}

export async function createLead(lead: LeadInput) {
    const response = await api.post<Lead>("/leads", lead);
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

export async function searchGooglePlaces(textQuery: string) {
    const response = await api.post<GooglePlaceLead[]>("/leads/google-places/search", { textQuery });
    return response.data;
}

export async function importGooglePlaces(places: GooglePlaceLead[]) {
    const response = await api.post<Lead[]>("/leads/google-places/import", { places });
    return response.data;
}
