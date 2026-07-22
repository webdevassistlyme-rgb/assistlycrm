import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    FiActivity,
    FiCalendar,
    FiClock,
    FiDownload,
    FiFileText,
    FiRefreshCw,
    FiSearch,
    FiUser,
    FiZap,
} from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { getEmployeeSummaries } from "../../../api/employees";
import { getAgentProductivityReport, type AgentReportLog, type AgentReportRow } from "../../../api/reports";
import { formatPhDateTime } from "../../../lib/dateTime";

const actionFilters = ["ALL", "Commented", "Rescheduled", "Lead updated", "Status updated", "Assigned"] as const;
const statusFilters = ["ALL", "ONLINE", "OFFLINE", "BREAK", "LUNCH", "OFF THE PHONE"] as const;
const rangePresets = [
    { label: "Today", days: 1 },
    { label: "7 days", days: 7 },
    { label: "14 days", days: 14 },
    { label: "30 days", days: 30 },
] as const;
const phTimeZone = "Asia/Manila";

function formatPhDateInput(value = new Date()) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: phTimeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(value);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
}

function parsePhDateInput(value: string, boundary: "start" | "end") {
    const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match) {
        return null;
    }

    const [, year, month, day] = match;
    const hour = boundary === "start" ? 0 : 23;
    const minute = boundary === "start" ? 0 : 59;
    const second = boundary === "start" ? 0 : 59;
    const millisecond = boundary === "start" ? 0 : 999;
    const parsedDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 8, minute, second, millisecond));

    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function getDefaultStartDate() {
    const todayStart = parsePhDateInput(formatPhDateInput(), "start") || new Date();
    return formatPhDateInput(new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000));
}

function formatNumber(value?: number) {
    return new Intl.NumberFormat("en-US").format(value || 0);
}

function formatDuration(minutes?: number) {
    const totalMinutes = Math.max(0, Math.round(minutes || 0));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    if (hours === 0) {
        return `${mins}m`;
    }

    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

function availabilityClass(status: string) {
    if (status === "ONLINE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (status === "OFF THE PHONE") return "border-sky-200 bg-sky-50 text-sky-700";
    if (status === "BREAK" || status === "LUNCH") return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-300 bg-slate-50 text-slate-600";
}

function exportReport(agents: AgentReportRow[], logs: AgentReportLog[]) {
    const agentHeaders = ["Agent", "Current Status", "Team", "Lead Actions", "Unique Leads", "Comments", "Follow-ups", "Status Updates", "Online Time", "Off Phone Time", "Break Time", "Lunch Time", "Off Phone Sessions", "Last Lead Activity"];
    const agentRows = agents.map((agent) => [
        agent.employeeName,
        agent.availabilityStatus,
        agent.team,
        agent.leadActions,
        agent.uniqueLeads,
        agent.comments,
        agent.followUpsScheduled,
        agent.statusUpdates,
        formatDuration(agent.activeMinutes),
        formatDuration(agent.idleMinutes),
        formatDuration(agent.breakMinutes),
        formatDuration(agent.lunchMinutes),
        agent.idleSessions,
        agent.lastLeadActivityAt ? formatPhDateTime(agent.lastLeadActivityAt) : "",
    ]);
    const logHeaders = ["Employee", "Action", "Lead", "Business", "Status", "Category", "Source", "Detail", "Note", "PH Time"];
    const logRows = logs.map((log) => [
        log.employeeName,
        log.action,
        log.leadName,
        log.businessName,
        log.status,
        log.category,
        log.source,
        log.detail,
        log.note || "",
        log.createdAt ? formatPhDateTime(log.createdAt) : "",
    ]);
    const csv = [
        agentHeaders,
        ...agentRows,
        [],
        ["Audit Logs"],
        logHeaders,
        ...logRows,
    ]
        .map((row) => row.map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`).join(","))
        .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `agent-report-${formatPhDateInput()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}

export default function AdminReports() {
    const [agentFilter, setAgentFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<(typeof statusFilters)[number]>("ALL");
    const [actionFilter, setActionFilter] = useState<(typeof actionFilters)[number]>("ALL");
    const [search, setSearch] = useState("");
    const [startDate, setStartDate] = useState(getDefaultStartDate);
    const [endDate, setEndDate] = useState(formatPhDateInput);
    const startIso = parsePhDateInput(startDate, "start")?.toISOString();
    const endIso = parsePhDateInput(endDate, "end")?.toISOString();
    const { data: employees = [] } = useQuery({ queryKey: ["employee-summaries"], queryFn: getEmployeeSummaries });
    const { data, isLoading, isError, refetch, isFetching } = useQuery({
        queryKey: ["agent-productivity-report", agentFilter, statusFilter, actionFilter, search.trim(), startIso, endIso],
        queryFn: () =>
            getAgentProductivityReport({
                agent: agentFilter === "ALL" ? undefined : agentFilter,
                status: statusFilter === "ALL" ? undefined : statusFilter,
                action: actionFilter === "ALL" ? undefined : actionFilter,
                search: search.trim() || undefined,
                start: startIso,
                end: endIso,
                limit: 1500,
            }),
        enabled: Boolean(startIso && endIso),
    });
    const agents = data?.agents || [];
    const logs = data?.logs || [];
    const summary = data?.summary;

    const applyPreset = (days: number) => {
        const todayStart = parsePhDateInput(formatPhDateInput(), "start") || new Date();
        setEndDate(formatPhDateInput(todayStart));
        setStartDate(formatPhDateInput(new Date(todayStart.getTime() - (days - 1) * 24 * 60 * 60 * 1000)));
    };

    return (
        <AdminLayout>
            <section className="min-h-full space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/40">Admin Reports</p>
                        <h2 className="mt-1 text-2xl font-semibold text-white">Agent Productivity & Status</h2>
                        <p className="mt-1 text-sm text-white/50">Lead activity, current agent status, and idle time using PH date filters.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
                            type="button"
                            onClick={() => void refetch()}
                            disabled={isFetching}
                        >
                            <FiRefreshCw className={["size-4", isFetching ? "animate-spin" : ""].join(" ")} aria-hidden="true" />
                            Refresh
                        </button>
                        <button
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white px-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
                            type="button"
                            disabled={agents.length === 0 && logs.length === 0}
                            onClick={() => exportReport(agents, logs)}
                        >
                            <FiDownload className="size-4" aria-hidden="true" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-2.5">
                    <div className="grid gap-2 xl:grid-cols-[minmax(12rem,1fr)_11.5rem_10rem_10rem_10rem_10rem]">
                        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-white/45 focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                            <FiSearch className="size-3.5 shrink-0" aria-hidden="true" />
                            <input className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none placeholder:text-white/30" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Keyword, lead, note, source" />
                        </label>
                        <label className="flex h-9 min-w-0 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-white/45">
                            <FiUser className="size-3.5 shrink-0" aria-hidden="true" />
                            <select className="h-full min-w-0 flex-1 bg-transparent text-xs font-semibold text-white outline-none" value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} aria-label="Filter by agent">
                                <option className="bg-[#0d1018] text-white" value="ALL">All agents</option>
                                {employees.map((employee) => (
                                    <option key={employee._id} className="bg-[#0d1018] text-white" value={employee._id}>{employee.name}</option>
                                ))}
                            </select>
                        </label>
                        <select className="h-9 rounded-lg border border-white/10 bg-[#0d1018] px-2.5 text-xs font-semibold text-white outline-none focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as (typeof statusFilters)[number])} aria-label="Filter by current status">
                            {statusFilters.map((status) => <option key={status} value={status}>{status === "ALL" ? "All statuses" : status}</option>)}
                        </select>
                        <label className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-white/45">
                            <FiCalendar className="size-3.5 shrink-0" aria-hidden="true" />
                            <input className="h-full min-w-0 bg-transparent text-xs font-semibold text-white outline-none" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} aria-label="Start date" />
                        </label>
                        <input className="h-9 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 text-xs font-semibold text-white outline-none focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} aria-label="End date" />
                        <select className="h-9 rounded-lg border border-white/10 bg-[#0d1018] px-2.5 text-xs font-semibold text-white outline-none focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={actionFilter} onChange={(event) => setActionFilter(event.target.value as (typeof actionFilters)[number])} aria-label="Filter by action">
                            {actionFilters.map((action) => <option key={action} value={action}>{action === "ALL" ? "All actions" : action}</option>)}
                        </select>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {rangePresets.map((preset) => (
                            <button key={preset.label} className="h-7 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-[0.68rem] font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white" type="button" onClick={() => applyPreset(preset.days)}>
                                {preset.label}
                            </button>
                        ))}
                        <span className="ml-auto text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-white/35">PH Time</span>
                    </div>
                </section>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ["Lead Actions", formatNumber(summary?.totalActions), `${formatNumber(summary?.uniqueLeads)} unique leads`, FiActivity],
                        ["Active Agents", formatNumber(summary?.activeAgents), `${formatNumber(summary?.currentlyOnline)} ONLINE now`, FiUser],
                        ["Off Phone Time", formatDuration(summary?.totalIdleMinutes), `${formatNumber(summary?.currentlyIdle)} OFF THE PHONE now`, FiClock],
                        ["Tracked Time", formatDuration((summary?.totalActiveMinutes || 0) + (summary?.totalIdleMinutes || 0) + (summary?.totalBreakMinutes || 0)), `${formatDuration(summary?.totalBreakMinutes)} on breaks`, FiZap],
                    ].map(([label, value, helper, Icon]) => {
                        const StatIcon = Icon as typeof FiActivity;
                        return (
                            <article key={label as string} className="rounded-lg border border-slate-300 bg-white p-4 text-slate-950 shadow-lg shadow-slate-950/10">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label as string}</p>
                                        <p className="mt-3 truncate text-2xl font-semibold">{value as string}</p>
                                    </div>
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50 text-[#842cff]">
                                        <StatIcon className="size-5" aria-hidden="true" />
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-600">{helper as string}</p>
                            </article>
                        );
                    })}
                </div>

                {isError && (
                    <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                        Could not load reports. Check that the backend is running, then refresh.
                    </section>
                )}

                <section className="overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-950 shadow-lg shadow-slate-950/10">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-slate-50 px-4 py-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Agent Status</p>
                            <p className="mt-1 text-sm text-slate-600">{agents.length} agent rows in selected filters</p>
                        </div>
                        <span className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Updated {data?.generatedAt ? formatPhDateTime(data.generatedAt) : "loading"}
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[76rem] border-separate border-spacing-0">
                            <thead className="bg-white text-xs uppercase tracking-[0.12em] text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold">Agent</th>
                                    <th className="px-4 py-3 text-left font-semibold">Current Status</th>
                                    <th className="px-4 py-3 text-center font-semibold">Actions</th>
                                    <th className="px-4 py-3 text-center font-semibold">Leads</th>
                                    <th className="px-4 py-3 text-center font-semibold">Comments</th>
                                    <th className="px-4 py-3 text-center font-semibold">Follow-ups</th>
                                    <th className="px-4 py-3 text-center font-semibold">Online</th>
                                    <th className="px-4 py-3 text-center font-semibold">Off Phone</th>
                                    <th className="px-4 py-3 text-center font-semibold">Break</th>
                                    <th className="px-4 py-3 text-center font-semibold">Off Phone Sessions</th>
                                    <th className="px-4 py-3 text-left font-semibold">Last Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {isLoading && (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={11}>Loading report...</td>
                                    </tr>
                                )}
                                {!isLoading && agents.length === 0 && (
                                    <tr>
                                        <td className="px-4 py-8 text-center text-sm text-slate-500" colSpan={11}>No agent report data found.</td>
                                    </tr>
                                )}
                                {agents.map((agent) => (
                                    <tr key={agent.employeeId} className="text-sm text-slate-700 transition hover:bg-slate-50">
                                        <td className="min-w-[15rem] px-4 py-3">
                                            <p className="font-semibold text-slate-950">{agent.employeeName}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">{agent.role} · {agent.team}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${availabilityClass(agent.availabilityStatus)}`}>
                                                {agent.availabilityStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-slate-950">{formatNumber(agent.leadActions)}</td>
                                        <td className="px-4 py-3 text-center">{formatNumber(agent.uniqueLeads)}</td>
                                        <td className="px-4 py-3 text-center">{formatNumber(agent.comments)}</td>
                                        <td className="px-4 py-3 text-center">{formatNumber(agent.followUpsScheduled)}</td>
                                        <td className="px-4 py-3 text-center">{formatDuration(agent.activeMinutes)}</td>
                                        <td className={["px-4 py-3 text-center font-semibold", agent.idleMinutes > 0 ? "text-amber-700" : "text-slate-600"].join(" ")}>
                                            {formatDuration(agent.idleMinutes)}
                                        </td>
                                        <td className="px-4 py-3 text-center">{formatDuration(agent.breakMinutes + agent.lunchMinutes)}</td>
                                        <td className="px-4 py-3 text-center">{formatNumber(agent.idleSessions)}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-slate-500">{agent.lastStatusAt ? formatPhDateTime(agent.lastStatusAt) : "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Audit Log</p>
                            <p className="mt-1 text-sm text-white/45">{logs.length} records in selected filters</p>
                        </div>
                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-white/55">PH filters</span>
                    </div>
                    <div className="grid grid-cols-[11rem_9rem_minmax(14rem,1fr)_9rem_12rem] gap-3 border-b border-white/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-white/35 max-xl:hidden">
                        <span>Agent</span>
                        <span>Action</span>
                        <span>Lead Activity</span>
                        <span>Status</span>
                        <span>PH Time</span>
                    </div>
                    <div className="content-scroll max-h-[34rem] overflow-y-auto">
                        {isLoading && <p className="px-5 py-6 text-sm text-white/45">Loading report logs...</p>}
                        {!isLoading && logs.length === 0 && <p className="px-5 py-6 text-sm text-white/45">No lead logs found.</p>}
                        {logs.map((log) => (
                            <article key={log.id} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 xl:grid-cols-[11rem_9rem_minmax(14rem,1fr)_9rem_12rem]">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold text-white">{log.employeeName}</p>
                                    <p className="mt-1 text-xs text-white/40">{log.category || log.source || "Lead"}</p>
                                </div>
                                <div>
                                    <span className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-[#7db9f5] bg-[#eaf4ff] px-2 text-xs font-semibold text-[#124f86]">
                                        <FiActivity className="size-3.5" aria-hidden="true" />
                                        {log.action}
                                    </span>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white">{log.leadName || log.businessName || "Unnamed lead"}</p>
                                    <p className="mt-1 text-sm leading-5 text-white/55">{log.detail}</p>
                                    {log.note && (
                                        <p className="mt-2 flex gap-2 rounded-lg border border-white/10 bg-black/15 px-3 py-2 text-xs leading-5 text-white/60">
                                            <FiFileText className="mt-0.5 size-3.5 shrink-0 text-white/35" aria-hidden="true" />
                                            {log.note}
                                        </p>
                                    )}
                                </div>
                                <p className="text-sm font-semibold text-white/60">{log.status}</p>
                                <p className="flex items-center gap-2 text-xs font-semibold text-white/45">
                                    <FiClock className="size-3.5" aria-hidden="true" />
                                    {log.createdAt ? formatPhDateTime(log.createdAt) : "-"}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>
            </section>
        </AdminLayout>
    );
}
