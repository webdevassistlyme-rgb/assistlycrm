import { api } from "../lib/api";
import type { EmployeeAvailabilityStatus } from "./employees";
import type { LeadStatus } from "./leads";

export type AgentReportSummary = {
    totalActions: number;
    uniqueLeads: number;
    activeAgents: number;
    currentlyOnline: number;
    currentlyIdle: number;
    totalIdleMinutes: number;
    totalActiveMinutes: number;
    totalBreakMinutes: number;
};

export type AgentReportRow = {
    employeeId: string;
    employeeName: string;
    employeeCode: string;
    role: string;
    team: string;
    employeeStatus: string;
    availabilityStatus: EmployeeAvailabilityStatus;
    leadActions: number;
    comments: number;
    followUpsScheduled: number;
    statusUpdates: number;
    assignments: number;
    uniqueLeads: number;
    activeMinutes: number;
    idleMinutes: number;
    breakMinutes: number;
    lunchMinutes: number;
    offlineMinutes: number;
    idleSessions: number;
    lastLeadActivityAt: string | null;
    lastStatusAt: string | null;
};

export type AgentReportLog = {
    id: string;
    employeeId: string;
    employeeName: string;
    action: string;
    detail: string;
    note: string;
    leadId: string;
    leadName: string;
    businessName: string;
    source: string;
    category: string;
    status: LeadStatus | "";
    followUpAt: string | null;
    createdAt: string | null;
};

export type AgentStatusEvent = {
    id: string;
    employeeId: string;
    employeeName: string;
    status: EmployeeAvailabilityStatus;
    detail: string;
    source: "Attendance" | "Activity";
    occurredAt: string;
};

export type AgentProductivityReport = {
    generatedAt: string;
    range: {
        start: string;
        end: string;
        effectiveEnd: string;
    };
    summary: AgentReportSummary;
    agents: AgentReportRow[];
    logs: AgentReportLog[];
    statusEvents: AgentStatusEvent[];
    availableStatuses: EmployeeAvailabilityStatus[];
};

export async function getAgentProductivityReport(params: {
    agent?: string;
    status?: string;
    action?: string;
    search?: string;
    start?: string;
    end?: string;
    limit?: number;
} = {}) {
    const response = await api.get<AgentProductivityReport>("/reports/agent-productivity", { params });
    return response.data;
}
