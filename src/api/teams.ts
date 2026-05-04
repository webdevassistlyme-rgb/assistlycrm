import { api } from "../lib/api";
import type { Employee } from "./employees";

export type TeamStatus = "Active" | "Review" | "Paused" | "Archived";

export type Team = {
    _id: string;
    name: string;
    lead: Employee | null;
    members: Employee[];
    activeLeads: number;
    status: TeamStatus;
};

export type TeamInput = {
    name: string;
    lead: string | null;
    members: string[];
    activeLeads: number;
    status: TeamStatus;
};

export async function getTeams() {
    const response = await api.get<Team[]>("/teams");
    return response.data;
}

export async function createTeam(team: TeamInput) {
    const response = await api.post<Team>("/teams", team);
    return response.data;
}

export async function updateTeam(id: string, team: TeamInput) {
    const response = await api.put<Team>(`/teams/${id}`, team);
    return response.data;
}
