import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FiCopy,
    FiChevronDown,
    FiChevronUp,
    FiEye,
    FiEyeOff,
    FiFilter,
    FiGlobe,
    FiLock,
    FiMoreVertical,
    FiPlus,
    FiSearch,
    FiTrash2,
    FiAlertTriangle,
    FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import AdminLayout from "../adminLayout";
import {
    archiveCredential as archiveCredentialRequest,
    createCredential,
    getCredentials,
    type Credential as SavedCredential,
} from "../../../api/credentials";
import { getTools } from "../../../api/tools";

const emptyCredential = {
    username: "",
    password: "",
    platform: "",
    company: "",
};

function SortHeader({ children }: { children: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            {children}
            <span className="flex flex-col text-white/30" aria-hidden="true">
                <FiChevronUp className="size-3" />
                <FiChevronDown className="-mt-1.5 size-3" />
            </span>
        </span>
    );
}

function FilterDropdown({
    label,
    value,
    options,
    isOpen,
    onToggle,
    onSelect,
}: {
    label: string;
    value: string;
    options: string[];
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (value: string) => void;
}) {
    return (
        <div className="relative">
            <button
                className={[
                    "flex h-10 min-w-[14rem] items-center justify-between gap-3 rounded-lg border bg-black/20 px-3 text-sm font-semibold transition",
                    isOpen
                        ? "border-[#842cff] text-white ring-2 ring-[#842cff]/20"
                        : "border-white/10 text-white/70 hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
            >
                <span className="flex min-w-0 items-center gap-3">
                    <span className="text-white/40">{label}</span>
                    <span className="truncate">{value}</span>
                </span>
                <FiChevronDown
                    className={["size-4 shrink-0 text-white/40 transition", isOpen ? "rotate-180" : ""].join(" ")}
                    aria-hidden="true"
                />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-12 z-30 w-full overflow-hidden rounded-lg border border-white/10 bg-[#0d1018] py-1 shadow-2xl shadow-black/40">
                    {options.map((option) => (
                        <button
                            key={option}
                            className={[
                                "flex h-10 w-full items-center justify-between px-3 text-left text-sm font-semibold transition",
                                value === option ? "bg-[#842cff] text-white" : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                            ].join(" ")}
                            type="button"
                            onClick={() => onSelect(option)}
                        >
                            <span className="truncate">{option}</span>
                            {value === option && <span className="size-1.5 rounded-full bg-white" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

type CredentialStat = {
    label: string;
    value: string;
    meta: string;
    icon: IconType;
};

const statusClass: Record<string, string> = {
    Active: "bg-emerald-400/10 text-emerald-200",
    Review: "bg-yellow-400/10 text-yellow-100/80",
    Archived: "bg-white/[0.06] text-white/55",
};

export default function Credentials() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [branchFilter, setBranchFilter] = useState("All branches");
    const [toolFilter, setToolFilter] = useState("All tools");
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isToolDropdownOpen, setIsToolDropdownOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SavedCredential | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
    const [credentialForm, setCredentialForm] = useState(emptyCredential);

    const { data: credentials = [], isLoading, isError } = useQuery({
        queryKey: ["credentials"],
        queryFn: getCredentials,
    });
    const { data: tools = [] } = useQuery({
        queryKey: ["tools"],
        queryFn: getTools,
    });

    const createCredentialMutation = useMutation({
        mutationFn: createCredential,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["credentials"] });
            closeModal();
        },
    });

    const archiveCredentialMutation = useMutation({
        mutationFn: archiveCredentialRequest,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["credentials"] }),
    });

    const filteredCredentials = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        return credentials.filter((credential) => {
            const matchesBranch = branchFilter === "All branches" || credential.company === branchFilter;
            const matchesTool = toolFilter === "All tools" || credential.platform === toolFilter;
            const matchesSearch =
                !normalizedSearch ||
                [credential.username, credential.platform, credential.company, credential._id]
                    .join(" ")
                    .toLowerCase()
                    .includes(normalizedSearch);

            return matchesBranch && matchesTool && matchesSearch;
        });
    }, [branchFilter, credentials, search, toolFilter]);

    const branchOptions = useMemo(
        () => ["All branches", ...Array.from(new Set(credentials.map((credential) => credential.company))).sort()],
        [credentials]
    );
    const toolOptions = useMemo(
        () => ["All tools", ...Array.from(new Set(tools.map((tool) => tool.name))).sort()],
        [tools]
    );

    const credentialStats: CredentialStat[] = [
        { label: "Total Credentials", value: credentials.length.toString(), meta: "Stored access records", icon: FiLock },
        {
            label: "Active",
            value: credentials.filter((credential) => credential.status === "Active").length.toString(),
            meta: "Ready to use",
            icon: FiGlobe,
        },
        {
            label: "Needs Review",
            value: credentials.filter((credential) => credential.status === "Review").length.toString(),
            meta: "Check access soon",
            icon: FiEye,
        },
    ];

    const closeModal = () => {
        setIsAddModalOpen(false);
        setCredentialForm(emptyCredential);
    };

    const addCredential = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!credentialForm.username.trim() || !credentialForm.password.trim() || !credentialForm.platform.trim()) {
            return;
        }

        createCredentialMutation.mutate({ ...credentialForm, company: credentialForm.company || "General" });
    };

    const togglePassword = (id: string) => {
        setVisiblePasswords((current) => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const openDeletePrompt = (credential: SavedCredential) => {
        setDeleteTarget(credential);
        setDeleteStep(1);
    };

    const closeDeletePrompt = () => {
        setDeleteTarget(null);
        setDeleteStep(1);
    };

    const confirmDelete = () => {
        if (!deleteTarget) {
            return;
        }

        archiveCredentialMutation.mutate(deleteTarget._id, { onSuccess: closeDeletePrompt });
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">Credentials</h2>
                        <p className="mt-1 text-sm text-white/50">Manage saved usernames, passwords, platforms, and branch access.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex h-11 w-[20rem] max-w-full items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-white/45 transition focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                            <input
                                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                                placeholder="Search credentials..."
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                            />
                            <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                        </label>
                        <button className="flex h-11 items-center gap-2 rounded-lg border border-white/10 bg-[#090b13]/80 px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10" type="button">
                            <FiFilter className="size-4" aria-hidden="true" />
                            Filter
                        </button>
                        <button
                            className="flex h-11 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                        >
                            <FiPlus className="size-4" aria-hidden="true" />
                            Add Credential
                        </button>
                    </div>
                </div>

                <div className="mt-7 grid gap-3 md:grid-cols-3">
                    {credentialStats.map((stat) => {
                        const Icon = stat.icon;

                        return (
                        <article key={stat.label} className="rounded-lg border border-white/10 bg-[#0c1018]/80 p-5 shadow-2xl shadow-black/10">
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[#842cff]/18 text-[#b78cff]">
                                    <Icon className="size-6" aria-hidden="true" />
                                </span>
                                <span>
                                    <span className="block text-xs font-medium text-white/75">{stat.label}</span>
                                    <span className="mt-2 block text-xl font-semibold text-white">{stat.value}</span>
                                    <span className="mt-1 block text-xs text-white/45">{stat.meta}</span>
                                </span>
                            </div>
                        </article>
                        );
                    })}
                </div>

                <section className="mt-5 flex h-[calc(100vh-24rem)] min-h-[34rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
                    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                        <div>
                            <h3 className="text-base font-semibold text-white">Saved Credentials</h3>
                            <p className="mt-1 text-xs text-white/40">Showing {filteredCredentials.length} of {credentials.length} records</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <FilterDropdown
                                label="Branch"
                                value={branchFilter}
                                options={branchOptions}
                                isOpen={isBranchDropdownOpen}
                                onToggle={() => {
                                    setIsBranchDropdownOpen((isOpen) => !isOpen);
                                    setIsToolDropdownOpen(false);
                                }}
                                onSelect={(branch) => {
                                    setBranchFilter(branch);
                                    setIsBranchDropdownOpen(false);
                                }}
                            />
                            <FilterDropdown
                                label="Tool"
                                value={toolFilter}
                                options={toolOptions}
                                isOpen={isToolDropdownOpen}
                                onToggle={() => {
                                    setIsToolDropdownOpen((isOpen) => !isOpen);
                                    setIsBranchDropdownOpen(false);
                                }}
                                onSelect={(tool) => {
                                    setToolFilter(tool);
                                    setIsToolDropdownOpen(false);
                                }}
                            />
                        </div>
                    </div>

                    <div className="content-scroll min-h-0 flex-1 overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3rem,transparent_3rem)] [scrollbar-gutter:stable]">
                        <table className="w-full min-w-[54rem] table-fixed border-separate border-spacing-0 text-left">
                            <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                <tr>
                                    <th className="w-[4%] px-3 py-3">
                                        <input className="size-4 rounded border-white/20 bg-transparent accent-[#842cff]" type="checkbox" aria-label="Select all credentials" />
                                    </th>
                                    <th className="w-[25%] px-3 py-3"><SortHeader>Platform</SortHeader></th>
                                    <th className="w-[23%] px-3 py-3"><SortHeader>Username</SortHeader></th>
                                    <th className="w-[21%] px-3 py-3"><SortHeader>Password</SortHeader></th>
                                    <th className="w-[11%] px-3 py-3"><SortHeader>Status</SortHeader></th>
                                    <th className="w-[11%] px-3 py-3"><SortHeader>Updated</SortHeader></th>
                                    <th className="w-[5%] px-3 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {isLoading && (
                                    <tr>
                                        <td className="px-4 py-5 text-sm text-white/45" colSpan={7}>Loading credentials...</td>
                                    </tr>
                                )}
                                {isError && (
                                    <tr>
                                        <td className="px-4 py-5 text-sm text-red-200" colSpan={7}>Unable to load credentials.</td>
                                    </tr>
                                )}
                                {filteredCredentials.map((credential) => {
                                    const isPasswordVisible = visiblePasswords.has(credential._id);

                                    return (
                                        <tr key={credential._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                            <td className="px-3 py-2.5">
                                                <input className="size-4 rounded border-white/20 bg-transparent accent-[#842cff]" type="checkbox" aria-label={`Select ${credential.platform}`} />
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#842cff]/18 text-[#b78cff]">
                                                        <FiGlobe className="size-4" aria-hidden="true" />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate font-semibold text-white">{credential.platform}</span>
                                                        <span className="mt-0.5 block truncate text-xs text-white/45">{credential._id.slice(-8).toUpperCase()}</span>
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5 text-white/75">{credential.username}</td>
                                            <td className="px-3 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="min-w-0 truncate font-mono text-white/75">
                                                        {isPasswordVisible ? credential.password : "••••••••••••"}
                                                    </span>
                                                    <button
                                                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
                                                        type="button"
                                                        onClick={() => togglePassword(credential._id)}
                                                        aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                                                    >
                                                        {isPasswordVisible ? <FiEyeOff className="size-4" /> : <FiEye className="size-4" />}
                                                    </button>
                                                    <button
                                                        className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/50 transition hover:bg-white/10 hover:text-white"
                                                        type="button"
                                                        aria-label="Copy password"
                                                        onClick={() => navigator.clipboard?.writeText(credential.password)}
                                                    >
                                                        <FiCopy className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2.5">
                                                <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusClass[credential.status]}`}>
                                                    <span className="size-1.5 rounded-full bg-current" />
                                                    {credential.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-white/65">
                                                {credential.updatedAt
                                                    ? new Date(credential.updatedAt).toLocaleDateString("en-US", {
                                                          month: "short",
                                                          day: "numeric",
                                                          year: "numeric",
                                                      })
                                                    : "-"}
                                            </td>
                                            <td className="px-3 py-2.5 text-center">
                                                <div className="flex justify-center gap-0.5">
                                                    <button
                                                        className="inline-flex size-7 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
                                                        type="button"
                                                        aria-label={`Open actions for ${credential.platform}`}
                                                    >
                                                        <FiMoreVertical className="size-4" aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        className="inline-flex size-7 items-center justify-center rounded-lg text-red-100/60 transition hover:bg-red-400/10 hover:text-red-100"
                                                        type="button"
                                                        aria-label={`Archive ${credential.platform}`}
                                                        onClick={() => openDeletePrompt(credential)}
                                                    >
                                                        <FiTrash2 className="size-4" aria-hidden="true" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
                        <p className="text-xs text-white/45">Showing 1 to {filteredCredentials.length} of {credentials.length} entries</p>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3].map((page) => (
                                <button
                                    key={page}
                                    className={[
                                        "flex size-8 items-center justify-center rounded-lg border text-sm font-semibold transition",
                                        page === 1
                                            ? "border-[#842cff] bg-[#842cff] text-white"
                                            : "border-white/10 bg-white/[0.035] text-white/60 hover:bg-white/10 hover:text-white",
                                    ].join(" ")}
                                    type="button"
                                >
                                    {page}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {isAddModalOpen && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <form className="modal-panel-enter w-full max-w-[34rem] rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={addCredential}>
                            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">New Credential</p>
                                    <h3 className="mt-1 text-base font-semibold text-white">Add Credential</h3>
                                </div>
                                <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeModal} aria-label="Close add credential modal">
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="grid gap-4 p-5">
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Website or Platform</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={credentialForm.platform} onChange={(event) => setCredentialForm((form) => ({ ...form, platform: event.target.value }))} placeholder="Google Workspace, Stripe, CRM..." />
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Username</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={credentialForm.username} onChange={(event) => setCredentialForm((form) => ({ ...form, username: event.target.value }))} placeholder="username or email" />
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Password</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" type="password" value={credentialForm.password} onChange={(event) => setCredentialForm((form) => ({ ...form, password: event.target.value }))} placeholder="password" />
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Branch / Company</span>
                                    <input className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20" value={credentialForm.company} onChange={(event) => setCredentialForm((form) => ({ ...form, company: event.target.value }))} placeholder="Assistly HQ, Finance, Austin branch..." />
                                </label>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60" type="submit" disabled={createCredentialMutation.isPending}>
                                    <FiPlus className="size-4" aria-hidden="true" />
                                    Add Credential
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {deleteTarget && (
                    <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                        <div className="modal-panel-enter w-full max-w-[32rem] overflow-hidden rounded-lg border border-red-400/20 bg-[#0d1018] shadow-2xl shadow-red-950/30">
                            <div className="bg-[radial-gradient(circle_at_15%_20%,rgba(239,68,68,0.22),transparent_35%),linear-gradient(135deg,rgba(239,68,68,0.12),rgba(132,44,255,0.08))] px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-red-300/20 bg-red-500/15 text-red-100">
                                            <FiAlertTriangle className="size-5" aria-hidden="true" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-red-100/55">
                                                Delete Credential
                                            </p>
                                            <h3 className="mt-1 text-lg font-semibold text-white">
                                                {deleteStep === 1 ? "Are you sure you want to delete?" : "You are deleting this credential"}
                                            </h3>
                                            <p className="mt-1 text-sm text-red-50/60">
                                                {deleteStep === 1
                                                    ? "This action removes the credential from active records."
                                                    : "Final confirmation required before this access record is archived."}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        onClick={closeDeletePrompt}
                                        aria-label="Close delete confirmation"
                                    >
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    {[1, 2].map((step) => (
                                        <div
                                            key={step}
                                            className={[
                                                "h-1.5 rounded-full transition",
                                                deleteStep >= step ? "bg-red-400" : "bg-white/10",
                                            ].join(" ")}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Platform</span>
                                        <span className="text-sm font-semibold text-white">{deleteTarget.platform}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Username</span>
                                        <span className="truncate text-sm text-white/70">{deleteTarget.username}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Branch</span>
                                        <span className="text-sm text-white/70">{deleteTarget.company}</span>
                                    </div>
                                </div>
                                <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
                                    <p className="text-sm leading-6 text-yellow-50/75">
                                        {deleteStep === 1
                                            ? "Review the credential details before continuing. You will be asked one more time."
                                            : "You are deleting this saved username, password, platform, and branch/company access record."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                                <button
                                    className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={closeDeletePrompt}
                                >
                                    Cancel
                                </button>
                                {deleteStep === 1 ? (
                                    <button
                                        className="h-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-100/80 transition hover:bg-red-400/15 hover:text-red-100"
                                        type="button"
                                        onClick={() => setDeleteStep(2)}
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button
                                        className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60"
                                        type="button"
                                        onClick={confirmDelete}
                                        disabled={archiveCredentialMutation.isPending}
                                    >
                                        Delete Credential
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </AdminLayout>
    );
}
