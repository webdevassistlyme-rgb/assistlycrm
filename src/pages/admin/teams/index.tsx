import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiChevronDown, FiEdit2, FiPlus, FiSearch, FiUserPlus, FiUsers, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import { getEmployees } from "../../../api/employees";
import {
    createTeam,
    getTeams,
    updateTeam,
    type Team,
    type TeamInput,
    type TeamStatus,
} from "../../../api/teams";
import { DataTablePagination, DataTableSortHeader } from "../../../components/admin/DataTable";

const teamStatuses: TeamStatus[] = ["Active", "Review", "Paused", "Archived"];


export default function AdminTeams() {
    const leadButtonRef = useRef<HTMLButtonElement>(null);
    const membersButtonRef = useRef<HTMLButtonElement>(null);
    const queryClient = useQueryClient();
    const { data: teams = [], isLoading, isError } = useQuery({
        queryKey: ["teams"],
        queryFn: getTeams,
    });
    const { data: employees = [] } = useQuery({
        queryKey: ["employees"],
        queryFn: getEmployees,
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "members">("add");
    const [isLeadDropdownOpen, setIsLeadDropdownOpen] = useState(false);
    const [isMembersDropdownOpen, setIsMembersDropdownOpen] = useState(false);
    const [leadSearch, setLeadSearch] = useState("");
    const [memberSearch, setMemberSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [sortBy, setSortBy] = useState("name");
    const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
    const [newTeam, setNewTeam] = useState<TeamInput>({
        name: "",
        lead: null,
        members: [],
        activeLeads: 0,
        status: "Active",
    });

    const activeEmployees = employees.filter((employee) => employee.status !== "Archived");
    const activeEmployeeIds = new Set(activeEmployees.map((employee) => employee._id));
    const getActiveTeamMembers = (team: Team) => team.members.filter((member) => activeEmployeeIds.has(member._id));
    const teamStats = [
        ["Teams", teams.length.toString()],
        ["Agents", teams.reduce((total, team) => total + getActiveTeamMembers(team).length, 0).toString()],
        ["Active Leads", teams.reduce((total, team) => total + team.activeLeads, 0).toString()],
    ];
    const sortedTeams = [...teams].sort((first, second) => {
        const firstMembers = getActiveTeamMembers(first).length;
        const secondMembers = getActiveTeamMembers(second).length;
        const values: Record<string, [string | number, string | number]> = {
            name: [first.name, second.name],
            lead: [first.lead?.name || "", second.lead?.name || ""],
            members: [firstMembers, secondMembers],
            activeLeads: [first.activeLeads, second.activeLeads],
            status: [first.status, second.status],
        };
        const [firstValue, secondValue] = values[sortBy] || values.name;
        const direction = sortDir === "asc" ? 1 : -1;

        if (typeof firstValue === "number" && typeof secondValue === "number") {
            return (firstValue - secondValue) * direction;
        }

        return String(firstValue).localeCompare(String(secondValue)) * direction;
    });
    const totalPages = Math.max(1, Math.ceil(sortedTeams.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paginatedTeams = sortedTeams.slice((safePage - 1) * pageSize, safePage * pageSize);
    const selectedLead = activeEmployees.find((employee) => employee._id === newTeam.lead);
    const selectedMembers = activeEmployees.filter((employee) => newTeam.members.includes(employee._id));
    const filteredLeadOptions = activeEmployees.filter((agent) =>
        agent.name.toLowerCase().includes(leadSearch.toLowerCase())
    );
    const filteredMemberOptions = activeEmployees.filter((agent) =>
        agent.name.toLowerCase().includes(memberSearch.toLowerCase())
    );

    const invalidateTeams = () => {
        queryClient.invalidateQueries({ queryKey: ["teams"] });
        queryClient.invalidateQueries({ queryKey: ["employees"] });
    };

    const createTeamMutation = useMutation({
        mutationFn: createTeam,
        onSuccess: invalidateTeams,
    });

    const updateTeamMutation = useMutation({
        mutationFn: ({ id, team }: { id: string; team: TeamInput }) => updateTeam(id, team),
        onSuccess: invalidateTeams,
    });

    const resetTeamForm = () => {
        setNewTeam({ name: "", lead: null, members: [], activeLeads: 0, status: "Active" });
        setEditingTeamId(null);
        setModalMode("add");
        setLeadSearch("");
        setMemberSearch("");
        setIsLeadDropdownOpen(false);
        setIsMembersDropdownOpen(false);
    };

    const closeTeamModal = () => {
        setIsAddModalOpen(false);
        resetTeamForm();
    };

    const openAddTeamModal = () => {
        resetTeamForm();
        setIsAddModalOpen(true);
    };

    const openEditTeamModal = (team: Team) => {
        setNewTeam({
            name: team.name,
            lead: team.lead?._id || null,
            members: team.members.map((member) => member._id),
            activeLeads: team.activeLeads,
            status: team.status,
        });
        setEditingTeamId(team._id);
        setModalMode("edit");
        setIsAddModalOpen(true);
    };

    const openMembersModal = (team: Team) => {
        setNewTeam({
            name: team.name,
            lead: team.lead?._id || null,
            members: team.members.map((member) => member._id),
            activeLeads: team.activeLeads,
            status: team.status,
        });
        setEditingTeamId(team._id);
        setModalMode("members");
        setIsAddModalOpen(true);
    };

    const handleSaveTeam = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!newTeam.name.trim()) {
            return;
        }

        const savedTeam: TeamInput = {
            name: newTeam.name.trim(),
            lead: newTeam.lead,
            members: newTeam.members,
            activeLeads: newTeam.activeLeads,
            status: newTeam.status,
        };

        if (editingTeamId) {
            updateTeamMutation.mutate({ id: editingTeamId, team: savedTeam });
        } else {
            createTeamMutation.mutate(savedTeam);
        }
        closeTeamModal();
    };

    const toggleMember = (agentId: string) => {
        setNewTeam((team) => ({
            ...team,
            members: team.members.includes(agentId)
                ? team.members.filter((member) => member !== agentId)
                : [...team.members, agentId],
        }));
    };

    const getDropdownStyle = (button: HTMLButtonElement | null) => {
        if (!button) {
            return undefined;
        }

        const rect = button.getBoundingClientRect();

        return {
            left: rect.left,
            top: rect.bottom + 8,
            width: rect.width,
        };
    };

    const changeSort = (field: string) => {
        setSortBy((current) => {
            if (current === field) {
                setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
                return current;
            }

            setSortDir("asc");
            return field;
        });
        setPage(1);
    };

    useEffect(() => {
        setPage((currentPage) => Math.min(currentPage, totalPages));
    }, [totalPages]);

    return (
        <AdminLayout>
            <section className="flex min-h-[calc(100vh-8.5rem)] flex-col rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Admin Teams</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">Teams</h2>
                    </div>

                    <div className="flex min-w-0 flex-1 flex-wrap justify-center gap-2">
                        {teamStats.map(([label, value]) => (
                            <span
                                key={label}
                                className="inline-flex h-10 min-w-[7.25rem] items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-white/55"
                            >
                                <span className="uppercase tracking-[0.12em]">{label}</span>
                                <span className="text-base text-white">{value}</span>
                            </span>
                        ))}
                    </div>

                    <button
                        className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                        type="button"
                        onClick={openAddTeamModal}
                    >
                        <FiPlus className="size-4" aria-hidden="true" />
                        Add Team
                    </button>
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-[18rem] flex-1 overflow-hidden border-t border-white/10">
                        <div className="content-scroll min-h-0 flex-1 overflow-auto">
                            <table className="w-full min-w-[48rem] text-left">
                                <thead className="sticky top-0 z-10 border-b border-white/10 bg-[#10131b]">
                                    <tr className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                                        <th className="px-5 py-3"><DataTableSortHeader field="name" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Team</DataTableSortHeader></th>
                                        <th className="px-5 py-3"><DataTableSortHeader field="lead" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Team Lead</DataTableSortHeader></th>
                                        <th className="px-5 py-3"><DataTableSortHeader field="members" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Agents</DataTableSortHeader></th>
                                        <th className="px-5 py-3"><DataTableSortHeader field="activeLeads" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Active Leads</DataTableSortHeader></th>
                                        <th className="px-5 py-3"><DataTableSortHeader field="status" sortBy={sortBy} sortDir={sortDir} onSort={changeSort}>Status</DataTableSortHeader></th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {isLoading && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={6}>
                                                Loading teams...
                                            </td>
                                        </tr>
                                    )}
                                    {isError && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-red-200" colSpan={6}>
                                                Unable to load teams. Check that the backend is running.
                                            </td>
                                        </tr>
                                    )}
                                    {!isLoading && !isError && teams.length === 0 && (
                                        <tr>
                                            <td className="px-5 py-8 text-center text-sm text-white/45" colSpan={6}>
                                                No teams yet.
                                            </td>
                                        </tr>
                                    )}
                                    {paginatedTeams.map((team) => {
                                        const activeTeamMembers = getActiveTeamMembers(team);

                                        return (
                                        <tr key={team.name} className="text-sm transition hover:bg-white/[0.04]">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/[0.06] text-white/65">
                                                        <FiUsers className="size-4" aria-hidden="true" />
                                                    </span>
                                                    <span className="font-semibold text-white">{team.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-white/65">{team.lead?.name || "Unassigned"}</td>
                                            <td className="px-5 py-4 text-white/65">{activeTeamMembers.length}</td>
                                            <td className="px-5 py-4 text-white/65">{team.activeLeads}</td>
                                            <td className="px-5 py-4">
                                                <span className="rounded-md border border-[#842cff]/35 bg-[#842cff]/10 px-2 py-1 text-xs font-semibold text-[#b994ff]">
                                                    {team.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                        type="button"
                                                        aria-label={`Edit ${team.name}`}
                                                        onClick={() => openEditTeamModal(team)}
                                                    >
                                                        <FiEdit2 className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                        type="button"
                                                        aria-label={`Add members to ${team.name}`}
                                                        onClick={() => openMembersModal(team)}
                                                    >
                                                        <FiUserPlus className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <DataTablePagination
                        totalItems={teams.length}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={setPage}
                        onPageSizeChange={(nextPageSize) => {
                            setPageSize(nextPageSize);
                            setPage(1);
                        }}
                    />
                </div>
            </section>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <form
                        className="flex max-h-[88vh] w-full max-w-[32rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                        onSubmit={handleSaveTeam}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {modalMode === "add" && "Add Team"}
                                    {modalMode === "edit" && "Edit Team"}
                                    {modalMode === "members" && "Add Members"}
                                </h3>
                                <p className="mt-1 text-sm text-white/45">Create a team for agents and lead ownership.</p>
                            </div>
                            <button
                                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close add team modal"
                                onClick={closeTeamModal}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="content-scroll grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Team Name</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={newTeam.name}
                                    onChange={(event) => setNewTeam((team) => ({ ...team, name: event.target.value }))}
                                    placeholder="Operations"
                                    readOnly={modalMode === "members"}
                                />
                            </label>

                            <div className="relative sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Team Lead</span>
                                <button
                                    ref={leadButtonRef}
                                    className="mt-2 flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 text-left text-sm font-semibold text-white outline-none transition hover:bg-white/[0.04] focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    type="button"
                                    onClick={() => {
                                        setIsMembersDropdownOpen(false);
                                        setIsLeadDropdownOpen((current) => !current);
                                    }}
                                >
                                    <span className={selectedLead ? "text-white" : "text-white/35"}>
                                        {selectedLead?.name || "Optional"}
                                    </span>
                                    <FiChevronDown className="size-4 shrink-0 text-white/45" aria-hidden="true" />
                                </button>

                            </div>

                            <div className="relative sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Members</span>
                                <button
                                    ref={membersButtonRef}
                                    className="mt-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm font-semibold text-white outline-none transition hover:bg-white/[0.04] focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    type="button"
                                    onClick={() => {
                                        setIsLeadDropdownOpen(false);
                                        setIsMembersDropdownOpen((current) => !current);
                                    }}
                                >
                                    <span className={newTeam.members.length ? "text-white" : "text-white/35"}>
                                        {selectedMembers.length ? selectedMembers.map((member) => member.name).join(", ") : "Select members"}
                                    </span>
                                    <FiChevronDown className="size-4 shrink-0 text-white/45" aria-hidden="true" />
                                </button>

                            </div>

                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Status</span>
                                <div className="mt-2 grid grid-cols-3 gap-2">
                                    {teamStatuses.filter((status) => status !== "Archived").map((status) => (
                                        <button
                                            key={status}
                                            className={[
                                                "h-10 rounded-lg border px-3 text-sm font-semibold transition",
                                                newTeam.status === status
                                                    ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                                    : "border-white/10 bg-black/20 text-white/55 hover:bg-white/[0.06] hover:text-white",
                                            ].join(" ")}
                                            type="button"
                                            onClick={() => setNewTeam((team) => ({ ...team, status }))}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-4">
                            <button
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={closeTeamModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="submit"
                            >
                                <FiPlus className="size-4" aria-hidden="true" />
                                {modalMode === "add" && "Add Team"}
                                {modalMode === "edit" && "Save Team"}
                                {modalMode === "members" && "Save Members"}
                            </button>
                        </div>
                    </form>

                    {isLeadDropdownOpen && (
                        <div
                            className="fixed z-[60] overflow-hidden rounded-lg border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40"
                            style={getDropdownStyle(leadButtonRef.current)}
                        >
                            <label className="flex h-10 items-center gap-2 border-b border-white/10 px-3 text-white/45">
                                <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                                <input
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                    value={leadSearch}
                                    onChange={(event) => setLeadSearch(event.target.value)}
                                    placeholder="Search agents"
                                />
                            </label>
                            <div className="max-h-44 overflow-y-auto py-1">
                                <button
                                    className="flex h-10 w-full items-center px-3 text-left text-sm font-semibold text-white/55 transition hover:bg-white/[0.06] hover:text-white"
                                    type="button"
                                    onClick={() => {
                                            setNewTeam((team) => ({ ...team, lead: null }));
                                        setIsLeadDropdownOpen(false);
                                    }}
                                >
                                    No team lead
                                </button>
                                {filteredLeadOptions.map((agent) => (
                                    <button
                                        key={agent._id}
                                        className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        type="button"
                                        onClick={() => {
                                            setNewTeam((team) => ({ ...team, lead: agent._id }));
                                            setLeadSearch("");
                                            setIsLeadDropdownOpen(false);
                                        }}
                                    >
                                        {agent.name}
                                        {newTeam.lead === agent._id && <FiCheck className="size-4 text-[#b994ff]" aria-hidden="true" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isMembersDropdownOpen && (
                        <div
                            className="fixed z-[60] overflow-hidden rounded-lg border border-white/10 bg-[#11141d] shadow-2xl shadow-black/40"
                            style={getDropdownStyle(membersButtonRef.current)}
                        >
                            <label className="flex h-10 items-center gap-2 border-b border-white/10 px-3 text-white/45">
                                <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                                <input
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                    value={memberSearch}
                                    onChange={(event) => setMemberSearch(event.target.value)}
                                    placeholder="Search agents"
                                />
                            </label>
                            <div className="max-h-52 overflow-y-auto py-1">
                                {filteredMemberOptions.map((agent) => {
                                    const isSelected = newTeam.members.includes(agent._id);

                                    return (
                                        <button
                                            key={agent._id}
                                            className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                            type="button"
                                            onClick={() => toggleMember(agent._id)}
                                        >
                                            {agent.name}
                                            <span
                                                className={[
                                                    "flex size-5 items-center justify-center rounded border",
                                                    isSelected
                                                        ? "border-[#842cff] bg-[#842cff] text-white"
                                                        : "border-white/15 text-transparent",
                                                ].join(" ")}
                                            >
                                                <FiCheck className="size-3.5" aria-hidden="true" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </AdminLayout>
    );
}
