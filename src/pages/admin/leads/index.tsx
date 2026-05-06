import type { FormEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    FiAlertTriangle,
    FiArchive,
    FiEdit2,
    FiExternalLink,
    FiMail,
    FiMapPin,
    FiPhone,
    FiPlus,
    FiRefreshCw,
    FiSave,
    FiSearch,
    FiUpload,
    FiX,
    FiZap,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import AdminLayout from "../adminLayout";
import {
    archiveLead,
    autoSearchGooglePlacesLeads,
    autoAssignLead,
    createLead,
    getLeads,
    importLeads,
    reassignNewLeads,
    scheduleLeadFollowUp,
    searchAndImportGooglePlaces,
    scoreLeadsByHighestPotential,
    updateLead,
    type GooglePlaceLead,
    type Lead,
    type LeadImportInput,
    type LeadInput,
    type LeadStatus,
} from "../../../api/leads";

const tabs: Array<LeadStatus | "ALL"> = [
    "ALL",
    "NEW",
    "Follow up",
    "Ongoing comms",
    "Qualified",
    "Ongoing Negotiation",
    "Dead",
    "Archived",
];

const emptyLead: LeadInput = {
    leadName: "",
    position: "",
    businessName: "",
    businessAddress: "",
    email: "",
    phone: "",
    website: "",
    source: "Manual",
    category: "",
    status: "NEW",
    assignedAgent: null,
    assignedTeam: null,
    googlePlaceId: "",
    notes: "",
    followUpAt: null,
    followUpNote: "",
    followUpPriority: 0,
};

function formatFilterLabel(value: string) {
    return value
        .trim()
        .replace(/\s+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeImportedStatus(value: string): LeadStatus {
    const normalizedValue = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
    const statusMap: Record<string, LeadStatus> = {
        new: "NEW",
        qualified: "Qualified",
        dead: "Dead",
        lost: "Dead",
        ongoing: "Ongoing comms",
        contacted: "Ongoing comms",
        "ongoing comms": "Ongoing comms",
        followup: "Follow up",
        "follow up": "Follow up",
        negotiation: "Ongoing Negotiation",
        "ongoing negotiation": "Ongoing Negotiation",
        archived: "Archived",
    };

    return statusMap[normalizedValue] || "NEW";
}

function parseCsv(text: string) {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let isQuoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const nextChar = text[index + 1];

        if (char === '"' && isQuoted && nextChar === '"') {
            cell += '"';
            index += 1;
            continue;
        }

        if (char === '"') {
            isQuoted = !isQuoted;
            continue;
        }

        if (char === "," && !isQuoted) {
            row.push(cell);
            cell = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !isQuoted) {
            if (char === "\r" && nextChar === "\n") {
                index += 1;
            }

            row.push(cell);
            if (row.some((value) => value.trim())) {
                rows.push(row);
            }
            row = [];
            cell = "";
            continue;
        }

        cell += char;
    }

    row.push(cell);
    if (row.some((value) => value.trim())) {
        rows.push(row);
    }

    return rows;
}

function getCsvValue(row: Record<string, string>, key: string) {
    return row[key]?.trim() || "";
}

function parseLeadCsv(text: string): LeadImportInput[] {
    const rows = parseCsv(text);
    const headers = rows[0]?.map((header) => header.trim()) || [];

    if (headers.length === 0) {
        return [];
    }

    return rows.slice(1).map((values) => {
        const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
        const businessName = getCsvValue(row, "Business Name") || getCsvValue(row, "Name");

        return {
            leadName: getCsvValue(row, "Name"),
            businessName,
            businessAddress: getCsvValue(row, "Address"),
            email: getCsvValue(row, "Email"),
            phone: getCsvValue(row, "Phone"),
            source: getCsvValue(row, "Source") || "CSV Import",
            category: getCsvValue(row, "Biz Type"),
            status: normalizeImportedStatus(getCsvValue(row, "Status")),
            assignedToName: getCsvValue(row, "Assigned To"),
            notes: getCsvValue(row, "Notes"),
            createdAt: getCsvValue(row, "Created At") || null,
            position: "",
            website: "",
            assignedAgent: null,
            assignedTeam: null,
            googlePlaceId: "",
        };
    }).filter((lead) => lead.businessName?.trim());
}

function getRelativeTime(value?: string | null) {
    if (!value) {
        return "";
    }

    const timestamp = new Date(value).getTime();

    if (Number.isNaN(timestamp)) {
        return "";
    }

    const diffMs = timestamp - Date.now();
    const absMs = Math.abs(diffMs);
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;
    const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

    if (absMs < hour) {
        return formatter.format(Math.round(diffMs / minute), "minute");
    }

    if (absMs < day) {
        return formatter.format(Math.round(diffMs / hour), "hour");
    }

    return formatter.format(Math.round(diffMs / day), "day");
}

function getLeadActivity(lead: Lead) {
    const activities = [
        {
            label: "Lead created",
            detail: `${lead.source || "Manual"} lead added${lead.category ? ` under ${lead.category}` : ""}.`,
            status: "Done",
        },
        {
            label: "Assigned",
            detail: lead.assignedAgent ? `${lead.assignedAgent.name} owns this lead.` : "Waiting for an active agent assignment.",
            status: lead.assignedAgent ? "Done" : "Next",
            action: lead.assignedAgent ? "" : "assign",
        },
    ];

    if (lead.followUpAt) {
        activities.push({
            label: "Follow-up scheduled",
            detail: `${new Date(lead.followUpAt).toLocaleString()} (${getRelativeTime(lead.followUpAt)}).`,
            status: "Priority",
        });
    }

    if (lead.aiScore) {
        activities.push({
            label: "AI ranked",
            detail: `${lead.aiScore}/100 - ${lead.aiScoreReason || "Ranked by lead potential."}`,
            status: lead.aiScore >= 75 ? "High" : "Done",
            action: "score",
        });
    }

    activities.push({
        label: lead.status,
        detail:
            lead.status === "NEW"
                ? "Ready for first outreach."
                : lead.status === "Follow up"
                  ? "Follow-up is the next priority."
                  : `Lead is currently marked ${lead.status}.`,
        status: "Current",
    });

    return activities;
}

function toLeadInput(lead: Lead, notes: string): LeadInput {
    return {
        leadName: lead.leadName || "",
        position: lead.position || "",
        businessName: lead.businessName,
        businessAddress: lead.businessAddress || "",
        email: lead.email || "",
        phone: lead.phone || "",
        website: lead.website || "",
        source: lead.source || "Manual",
        category: lead.category || "",
        status: lead.status,
        assignedAgent: lead.assignedAgent?._id || null,
        assignedTeam: lead.assignedTeam?._id || null,
        googlePlaceId: lead.googlePlaceId || "",
        notes,
        followUpAt: lead.followUpAt,
        followUpNote: lead.followUpNote || "",
        followUpPriority: lead.followUpPriority || 0,
        aiScore: lead.aiScore || 0,
        aiScoreReason: lead.aiScoreReason || "",
        aiScoreSource: lead.aiScoreSource || "",
        aiScoredAt: lead.aiScoredAt,
    };
}

export default function AdminLeads() {
    const queryClient = useQueryClient();
    const importInputRef = useRef<HTMLInputElement>(null);
    const { data: leads = [], isLoading, isError } = useQuery({
        queryKey: ["leads"],
        queryFn: () => getLeads(),
    });
    const [activeTab, setActiveTab] = useState<LeadStatus | "ALL">("ALL");
    const [activeCategoryTab, setActiveCategoryTab] = useState("ALL");
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [leadHistoryIds, setLeadHistoryIds] = useState<string[]>([]);
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
    const [isPlacesOpen, setIsPlacesOpen] = useState(false);
    const [leadForm, setLeadForm] = useState<LeadInput>(emptyLead);
    const [placesQuery, setPlacesQuery] = useState("");
    const [placesProduct, setPlacesProduct] = useState("Popcorn vending machine");
    const [placesCity, setPlacesCity] = useState("");
    const [placesState, setPlacesState] = useState("");
    const [placeResults, setPlaceResults] = useState<GooglePlaceLead[]>([]);
    const [autoSearchQueries, setAutoSearchQueries] = useState<string[]>([]);
    const [isAiSorted, setIsAiSorted] = useState(false);
    const [aiSortUsedOpenAI, setAiSortUsedOpenAI] = useState(false);
    const [isScoreSaved, setIsScoreSaved] = useState(false);
    const [followUpDateTime, setFollowUpDateTime] = useState("");
    const [commentDraft, setCommentDraft] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
    const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
    const [importMessage, setImportMessage] = useState("");

    const invalidateLeads = () => {
        queryClient.invalidateQueries({ queryKey: ["leads"] });
    };

    const createLeadMutation = useMutation({
        mutationFn: createLead,
        onSuccess: invalidateLeads,
    });

    const importLeadsMutation = useMutation({
        mutationFn: importLeads,
        onSuccess: (result) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) => {
                const leadsById = new Map([...result.leads, ...current].map((lead) => [lead._id, lead]));
                return Array.from(leadsById.values());
            });
            setImportMessage(`Imported ${result.importedCount} lead${result.importedCount === 1 ? "" : "s"}`);
            invalidateLeads();
        },
        onError: () => {
            setImportMessage("Import failed. Check the CSV and try again.");
        },
    });

    const archiveLeadMutation = useMutation({
        mutationFn: archiveLead,
        onSuccess: invalidateLeads,
    });

    const openDeletePrompt = (lead: Lead) => {
        setDeleteTarget(lead);
        setDeleteStep(1);
    };

    const closeDeletePrompt = () => {
        setDeleteTarget(null);
        setDeleteStep(1);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        archiveLeadMutation.mutate(deleteTarget._id, { onSuccess: closeDeletePrompt });
    };

    const autoAssignLeadMutation = useMutation({
        mutationFn: autoAssignLead,
        onSuccess: (lead) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) =>
                current.map((currentLead) => (currentLead._id === lead._id ? lead : currentLead))
            );
        },
    });

    const reassignNewLeadsMutation = useMutation({
        mutationFn: reassignNewLeads,
        onSuccess: (result) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) => {
                const reassignedLeadsById = new Map(result.leads.map((lead) => [lead._id, lead]));

                return current.map((lead) => reassignedLeadsById.get(lead._id) || lead);
            });
            invalidateLeads();
        },
    });

    const scheduleFollowUpMutation = useMutation({
        mutationFn: ({ id, followUpAt }: { id: string; followUpAt: string }) =>
            scheduleLeadFollowUp(id, { followUpAt, followUpPriority: 100 }),
        onSuccess: (lead) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) =>
                current.map((currentLead) => (currentLead._id === lead._id ? lead : currentLead))
            );
            setFollowUpDateTime("");
        },
    });

    const saveCommentMutation = useMutation({
        mutationFn: ({ lead, notes }: { lead: Lead; notes: string }) => updateLead(lead._id, toLeadInput(lead, notes)),
        onSuccess: (lead) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) =>
                current.map((currentLead) => (currentLead._id === lead._id ? lead : currentLead))
            );
        },
    });

    const searchAndImportPlacesMutation = useMutation({
        mutationFn: searchAndImportGooglePlaces,
        onSuccess: (result) => {
            setPlaceResults(result.places);
            setAutoSearchQueries([]);
            invalidateLeads();
        },
    });

    const autoSearchPlacesMutation = useMutation({
        mutationFn: autoSearchGooglePlacesLeads,
        onSuccess: (result) => {
            setPlaceResults(result.places);
            setAutoSearchQueries(result.searchedQueries);
            setActiveCategoryTab(formatFilterLabel(result.product));
            invalidateLeads();
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) => {
                const leadsById = new Map([...result.leads, ...current].map((lead) => [lead._id, lead]));
                return Array.from(leadsById.values()).sort((first, second) => (second.aiScore || 0) - (first.aiScore || 0));
            });
            setIsAiSorted(true);
            setIsScoreSaved(true);
        },
    });

    const scoreLeadsMutation = useMutation({
        mutationFn: scoreLeadsByHighestPotential,
        onSuccess: async (result) => {
            queryClient.setQueryData<Lead[]>(["leads"], (current = []) => {
                const scoredLeadsById = new Map(result.leads.map((lead) => [lead._id, lead]));
                const untouchedLeads = current.filter((lead) => !scoredLeadsById.has(lead._id));

                return [...result.leads, ...untouchedLeads];
            });
            await queryClient.invalidateQueries({ queryKey: ["leads"] });
            setIsAiSorted(true);
            setAiSortUsedOpenAI(result.usedAi);
            setIsScoreSaved(true);
        },
    });

    const categoryTabs = useMemo(() => {
        const categoryNames = new Map<string, string>();

        leads.forEach((lead) => {
            const category = formatFilterLabel(lead.category || "");

            if (category) {
                categoryNames.set(category.toLowerCase(), category);
            }
        });

        return ["ALL", ...Array.from(categoryNames.values()).sort((a, b) => a.localeCompare(b))];
    }, [leads]);

    const filteredLeads = useMemo(() => {
        const visibleLeads = leads.filter((lead) => {
            const matchesStatus = activeTab === "ALL" || lead.status === activeTab;
            const matchesCategory =
                activeCategoryTab === "ALL" || formatFilterLabel(lead.category || "").toLowerCase() === activeCategoryTab.toLowerCase();

            return matchesStatus && matchesCategory;
        });

        if (!isAiSorted) {
            return visibleLeads;
        }

        return [...visibleLeads].sort((first, second) => (second.aiScore || 0) - (first.aiScore || 0));
    }, [activeCategoryTab, activeTab, isAiSorted, leads]);

    const selectedLead = leads.find((lead) => lead._id === selectedLeadId) || filteredLeads[0] || null;
    const leadHistory = leadHistoryIds
        .map((leadId) => leads.find((lead) => lead._id === leadId))
        .filter((lead): lead is Lead => Boolean(lead));

    const selectLead = (leadId: string) => {
        setSelectedLeadId(leadId);
        setLeadHistoryIds((current) => {
            if (current.includes(leadId)) {
                return current;
            }

            return [leadId, ...current].slice(0, 8);
        });
    };

    const closeLeadHistory = (leadId: string) => {
        setLeadHistoryIds((current) => current.filter((historyId) => historyId !== leadId));

        if (selectedLeadId !== leadId) {
            return;
        }

        const remainingHistory = leadHistoryIds.filter((historyId) => historyId !== leadId);
        setSelectedLeadId(remainingHistory[0] || filteredLeads.find((lead) => lead._id !== leadId)?._id || null);
    };

    const openLeadModal = () => {
        setLeadForm(emptyLead);
        setIsLeadModalOpen(true);
    };

    const closeLeadModal = () => {
        setLeadForm(emptyLead);
        setIsLeadModalOpen(false);
    };

    const handleSaveLead = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!leadForm.businessName.trim()) {
            return;
        }

        createLeadMutation.mutate(leadForm);
        closeLeadModal();
    };

    const handleLeadImport = async (file: File | null) => {
        if (!file) {
            return;
        }

        try {
            setImportMessage("Reading CSV...");
            const text = await file.text();
            const importedLeads = parseLeadCsv(text);

            if (importedLeads.length === 0) {
                setImportMessage("No valid leads found in CSV.");
                return;
            }

            importLeadsMutation.mutate(importedLeads);
        } catch {
            setImportMessage("Could not read the CSV file.");
        } finally {
            if (importInputRef.current) {
                importInputRef.current.value = "";
            }
        }
    };

    const handlePlacesSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const location = [placesCity.trim(), placesState.trim()].filter(Boolean).join(", ");
        const category = formatFilterLabel(placesQuery.trim() || "businesses");
        const textQuery = [category, location].filter(Boolean).join(" in ");

        if (textQuery.trim()) {
            setPlaceResults([]);
            setActiveCategoryTab(category);
            searchAndImportPlacesMutation.mutate({ textQuery, category });
        }
    };

    const handleAutoPlacesSearch = () => {
        const product = placesProduct.trim() || "Popcorn vending machine";
        const location = [placesCity.trim(), placesState.trim()].filter(Boolean).join(", ");

        setPlaceResults([]);
        setAutoSearchQueries([]);
        setPlacesQuery(product);
        setActiveCategoryTab(formatFilterLabel(product));
        autoSearchPlacesMutation.mutate({ product, location, maxResults: 10000 });
    };

    const leadPhone = selectedLead?.phone || "";
    const whatsappPhone = leadPhone.replace(/\D/g, "");
    const leadActivity = selectedLead ? getLeadActivity(selectedLead) : [];

    useEffect(() => {
        setCommentDraft(selectedLead?.notes || "");
    }, [selectedLead?._id, selectedLead?.notes]);

    const handleAiSort = () => {
        const leadIds = filteredLeads.map((lead) => lead._id);

        if (leadIds.length > 0) {
            scoreLeadsMutation.mutate(leadIds);
        }
    };
    const handleScheduleFollowUp = () => {
        if (!selectedLead || !followUpDateTime) {
            return;
        }

        scheduleFollowUpMutation.mutate({ id: selectedLead._id, followUpAt: new Date(followUpDateTime).toISOString() });
    };
    const handleSaveComment = () => {
        if (!selectedLead) {
            return;
        }

        saveCommentMutation.mutate({ lead: selectedLead, notes: commentDraft });
    };
    const handleActivityAction = (action?: string) => {
        if (!selectedLead || !action) {
            return;
        }

        if (action === "assign") {
            autoAssignLeadMutation.mutate(selectedLead._id);
            return;
        }

        if (action === "score") {
            scoreLeadsMutation.mutate([selectedLead._id]);
            return;
        }

        if (action === "follow-up") {
            document.getElementById("lead-follow-up-input")?.focus();
        }
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="border-b border-white/10">
                    <div className="flex h-12 items-end justify-between gap-4 overflow-x-auto">
                        <div className="flex h-12 items-end gap-6">
                            {tabs.map((tab) => {
                                const isActive = tab === activeTab;

                                return (
                                    <button
                                        key={tab}
                                        className={[
                                            "relative h-12 shrink-0 px-1 text-sm font-medium transition",
                                            isActive ? "text-[#9b5cff]" : "text-white/60 hover:text-white",
                                        ].join(" ")}
                                        type="button"
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab}
                                        {isActive && <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#842cff]" />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 pb-2">
                            <input
                                ref={importInputRef}
                                className="hidden"
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(event) => void handleLeadImport(event.target.files?.[0] || null)}
                            />
                            <button
                                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={() => importInputRef.current?.click()}
                                disabled={importLeadsMutation.isPending}
                                title="Import leads from CSV"
                            >
                                <FiUpload
                                    className={["size-4", importLeadsMutation.isPending ? "animate-pulse" : ""].join(" ")}
                                    aria-hidden="true"
                                />
                                {importLeadsMutation.isPending ? "Importing" : "Import"}
                            </button>
                            <button
                                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                type="button"
                                onClick={() => reassignNewLeadsMutation.mutate()}
                                disabled={reassignNewLeadsMutation.isPending || leads.every((lead) => lead.status !== "NEW")}
                                title="Reassign all new leads"
                            >
                                <FiRefreshCw
                                    className={["size-4", reassignNewLeadsMutation.isPending ? "animate-spin" : ""].join(" ")}
                                    aria-hidden="true"
                                />
                                {reassignNewLeadsMutation.isPending ? "Assigning" : "Reassign new"}
                            </button>
                            <button
                                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={() => setIsPlacesOpen(true)}
                            >
                                <FiMapPin className="size-4" aria-hidden="true" />
                                Auto update leads
                            </button>
                            <button
                                className="flex h-9 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-3 text-xs font-semibold text-white transition hover:brightness-110"
                                type="button"
                                onClick={openLeadModal}
                            >
                                <FiPlus className="size-4" aria-hidden="true" />
                                Add Lead
                            </button>
                        </div>
                    </div>
                    {importMessage && (
                        <p className="pb-2 text-right text-xs font-semibold text-white/45">
                            {importMessage}
                        </p>
                    )}
                </div>

                <div className="grid h-[calc(100vh-12rem)] min-h-[32rem] gap-5 pt-5 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
                            <div>
                                <h2 className="text-base font-semibold text-white">Leads</h2>
                                {isAiSorted && (
                                    <p className="mt-0.5 text-[0.68rem] font-semibold text-[#9df6b7]">
                                        {isScoreSaved ? "Scores saved" : aiSortUsedOpenAI ? "AI ranked" : "Local AI fallback"}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="flex h-8 items-center gap-1.5 rounded-lg border border-[#842cff]/30 bg-[#842cff]/10 px-2.5 text-xs font-semibold text-[#cbb7ff] transition hover:bg-[#842cff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="button"
                                    onClick={handleAiSort}
                                    disabled={scoreLeadsMutation.isPending || filteredLeads.length === 0}
                                >
                                    <FiZap className="size-3.5" aria-hidden="true" />
                                    {scoreLeadsMutation.isPending ? "Saving" : isScoreSaved ? "Saved" : "AI sort"}
                                </button>
                                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/55">
                                    {filteredLeads.length}
                                </span>
                            </div>
                        </div>

                        <div className="content-scroll flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
                            {categoryTabs.map((category) => {
                                const isActive = category === activeCategoryTab;

                                return (
                                    <button
                                        key={category}
                                        className={[
                                            "h-8 shrink-0 rounded-lg border px-3 text-xs font-semibold transition",
                                            isActive
                                                ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                                : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white",
                                        ].join(" ")}
                                        type="button"
                                        onClick={() => setActiveCategoryTab(category)}
                                    >
                                        {category === "ALL" ? "All" : category}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="content-scroll min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto">
                            {isLoading && <p className="px-5 py-6 text-sm text-white/45">Loading leads...</p>}
                            {isError && <p className="px-5 py-6 text-sm text-red-200">Unable to load leads.</p>}
                            {!isLoading && !isError && filteredLeads.length === 0 && (
                                <p className="px-5 py-6 text-sm text-white/45">No leads in this tab.</p>
                            )}
                            {filteredLeads.map((lead) => (
                                <button
                                    key={lead._id}
                                    className={[
                                        "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition",
                                        selectedLead?._id === lead._id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => selectLead(lead._id)}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-white">
                                            {lead.leadName || lead.businessName}
                                        </span>
                                        <span className="mt-1 block truncate text-xs text-white/45">{lead.businessName}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className="block text-xs font-semibold text-white/45">
                                            {lead.category || lead.source}
                                        </span>
                                        <span className="mt-1 block text-xs text-[#9b5cff]">{lead.status}</span>
                                        {lead.followUpAt && (
                                            <span className="mt-1 block text-xs font-semibold text-[#fbbf24]">
                                                Follow-up
                                            </span>
                                        )}
                                        {isAiSorted && (
                                            <span className="mt-1 block text-xs font-semibold text-[#9df6b7]">
                                                {lead.aiScore || 0}/100
                                            </span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden">
                        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-1 py-1">
                            <div>
                                <h2 className="text-base font-semibold text-white">Lead Details</h2>
                                <p className="mt-1 text-xs text-white/40">Admin profile</p>
                            </div>

                            {selectedLead && (
                                <button
                                    className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                    type="button"
                                    onClick={() => openDeletePrompt(selectedLead)}
                                >
                                    <FiArchive className="size-4" aria-hidden="true" />
                                    Archive
                                </button>
                            )}
                        </div>

                        {leadHistory.length > 0 && (
                            <div className="bg-black/10 px-4 pt-2">
                                <div className="content-scroll flex gap-1 overflow-x-auto">
                                    {leadHistory.map((lead) => {
                                        const isActive = selectedLead?._id === lead._id;

                                        return (
                                            <div
                                                key={lead._id}
                                                className={[
                                                    "group flex h-10 max-w-52 shrink-0 items-center rounded-t-lg border border-b-0 text-xs font-semibold transition",
                                                    isActive
                                                        ? "border-white/15 bg-[#090b13] text-white"
                                                        : "border-white/10 bg-white/[0.04] text-white/55 hover:bg-white/[0.07] hover:text-white",
                                                ].join(" ")}
                                                title={lead.leadName || lead.businessName}
                                            >
                                                <button
                                                    className="min-w-0 flex-1 truncate px-3 text-left"
                                                    type="button"
                                                    onClick={() => selectLead(lead._id)}
                                                >
                                                    {lead.leadName || lead.businessName}
                                                </button>
                                                <button
                                                    className="mr-2 flex size-5 shrink-0 items-center justify-center rounded text-white/45 transition hover:bg-white/10 hover:text-white"
                                                    type="button"
                                                    aria-label={`Close ${lead.leadName || lead.businessName}`}
                                                    onClick={() => closeLeadHistory(lead._id)}
                                                >
                                                    <FiX className="size-3.5" aria-hidden="true" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedLead ? (
                            <div className="content-scroll grid min-h-0 flex-1 gap-5 overflow-y-auto p-5 pr-3 xl:grid-cols-[minmax(0,1fr)_20rem]">
                                <div className="space-y-5">
                                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm text-white/45">Lead Name</p>
                                                <h3 className="mt-1 text-2xl font-semibold text-white">
                                                    {selectedLead.leadName || "No contact name"}
                                                </h3>
                                                <p className="mt-1 text-sm text-white/55">{selectedLead.position || "No position"}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <a
                                                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                                    href={`tel:${selectedLead.phone}`}
                                                    aria-label="Call lead"
                                                >
                                                    <FiPhone className="size-4" aria-hidden="true" />
                                                </a>
                                                <a
                                                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                                    href={`mailto:${selectedLead.email}`}
                                                    aria-label="Email lead"
                                                >
                                                    <FiMail className="size-4" aria-hidden="true" />
                                                </a>
                                                <a
                                                    className="flex size-9 items-center justify-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#7cf0a4] transition hover:bg-[#25d366]/20"
                                                    href={`https://wa.me/${whatsappPhone}`}
                                                    aria-label="WhatsApp lead"
                                                >
                                                    <FaWhatsapp className="size-4" aria-hidden="true" />
                                                </a>
                                                <button
                                                    className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                                    type="button"
                                                    aria-label="Edit lead"
                                                >
                                                    <FiEdit2 className="size-4" aria-hidden="true" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Business</p>
                                                <p className="mt-2 text-sm font-semibold text-white">{selectedLead.businessName}</p>
                                                <p className="mt-1 text-sm leading-6 text-white/55">
                                                    {selectedLead.businessAddress || "No address"}
                                                </p>
                                            </div>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Email</p>
                                                    <p className="mt-2 truncate text-sm font-semibold text-white">
                                                        {selectedLead.email || "No email"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                        Phone Number
                                                    </p>
                                                    <p className="mt-2 text-sm font-semibold text-white">{selectedLead.phone || "No phone"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                    Assigned Agent
                                                </p>
                                                <p className="mt-3 text-sm font-semibold text-white">
                                                    {selectedLead.assignedAgent?.name || "Unassigned"}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                    Follow Up
                                                </p>
                                                <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
                                                    <input
                                                        id="lead-follow-up-input"
                                                        className="h-12 min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                        type="datetime-local"
                                                        value={followUpDateTime}
                                                        onChange={(event) => setFollowUpDateTime(event.target.value)}
                                                    />
                                                    <button
                                                        className="flex h-12 min-w-28 items-center justify-center rounded-lg border border-[#842cff]/30 bg-[#842cff]/10 px-4 text-sm font-semibold text-[#cbb7ff] transition hover:bg-[#842cff]/20 disabled:cursor-not-allowed disabled:opacity-60"
                                                        type="button"
                                                        onClick={handleScheduleFollowUp}
                                                        disabled={!followUpDateTime || scheduleFollowUpMutation.isPending}
                                                    >
                                                        {scheduleFollowUpMutation.isPending ? "Saving" : "Schedule"}
                                                    </button>
                                                </div>
                                                <p className="mt-2 text-xs text-white/45">
                                                    {selectedLead.followUpAt
                                                        ? `Next: ${new Date(selectedLead.followUpAt).toLocaleString()}`
                                                        : "No follow-up scheduled"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Comments</p>
                                                <p className="mt-1 text-xs text-white/45">Internal lead notes</p>
                                            </div>
                                            <button
                                                className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                type="button"
                                                onClick={handleSaveComment}
                                                disabled={!selectedLead || saveCommentMutation.isPending}
                                            >
                                                <FiSave className="size-3.5" aria-hidden="true" />
                                                {saveCommentMutation.isPending ? "Saving" : "Save"}
                                            </button>
                                        </div>
                                        <textarea
                                            className="mt-3 min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                            value={commentDraft}
                                            onChange={(event) => setCommentDraft(event.target.value)}
                                            placeholder="Add comments, objections, call notes, or next-step context..."
                                        />
                                    </div>

                                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                        {[
                                            ["Lead Source", selectedLead.source],
                                            ["Filter", selectedLead.category || "All"],
                                            ["AI Score", selectedLead.aiScore ? `${selectedLead.aiScore}/100` : "Not scored"],
                                            ["AI Reason", selectedLead.aiScoreReason || "No score yet"],
                                            ["Follow Up", selectedLead.followUpAt ? new Date(selectedLead.followUpAt).toLocaleString() : "None"],
                                            ["Status", selectedLead.status],
                                            ["Team", selectedLead.assignedTeam?.name || "Unassigned"],
                                            ["Website", selectedLead.website || "No website"],
                                            ["Place ID", selectedLead.googlePlaceId || "Manual"],
                                            ["Next Process", selectedLead.status],
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                                                <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">
                                                    {label}
                                                </p>
                                                <p className="mt-1.5 truncate text-sm font-semibold text-white">{value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <aside className="flex min-h-0">
                                    <div className="flex max-h-full min-h-[24rem] w-full flex-col rounded-lg border border-white/10 bg-white/[0.04] p-4 xl:sticky xl:top-0">
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Activity</p>
                                        <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
                                            {leadActivity.map((item) => (
                                                <div key={item.label} className="flex gap-3">
                                                    <span
                                                        className={[
                                                            "mt-1 size-2 shrink-0 rounded-full",
                                                            item.status === "Current"
                                                                ? "bg-[#842cff]"
                                                                : item.status === "Priority" || item.status === "High"
                                                                  ? "bg-[#fbbf24]"
                                                                  : "bg-white/25",
                                                        ].join(" ")}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-white/80">{item.label}</p>
                                                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/40">
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs leading-5 text-white/45">{item.detail}</p>
                                                        {item.action && (
                                                            <button
                                                                className="mt-2 h-8 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs font-semibold text-white/65 transition hover:bg-white/[0.09] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                                                type="button"
                                                                onClick={() => handleActivityAction(item.action)}
                                                                disabled={
                                                                    (item.action === "assign" && autoAssignLeadMutation.isPending) ||
                                                                    (item.action === "score" && scoreLeadsMutation.isPending)
                                                                }
                                                            >
                                                                {item.action === "assign"
                                                                    ? autoAssignLeadMutation.isPending
                                                                        ? "Assigning"
                                                                        : "Auto assign"
                                                                    : item.action === "score"
                                                                      ? scoreLeadsMutation.isPending
                                                                          ? "Scoring"
                                                                          : "Rescore"
                                                                      : "Schedule follow-up"}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-white/45">Select a lead to view details.</div>
                        )}
                    </section>
                </div>
            </section>

            {isPlacesOpen && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <section className="modal-panel-enter flex max-h-[88vh] w-full max-w-[50rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40">
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                            <div>
                                <h3 className="text-base font-semibold text-white">Google Places</h3>
                                <p className="mt-1 text-sm text-white/45">Find businesses and import them as leads.</p>
                            </div>
                            <button
                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close places modal"
                                onClick={() => setIsPlacesOpen(false)}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <form className="grid gap-3 border-b border-white/10 p-4" onSubmit={handlePlacesSearch}>
                            <div className="rounded-lg border border-[#842cff]/20 bg-[#842cff]/10 p-3">
                                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                                    <label>
                                        <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Product</span>
                                        <input
                                            className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                            value={placesProduct}
                                            onChange={(event) => setPlacesProduct(event.target.value)}
                                            placeholder="Popcorn vending machine"
                                        />
                                    </label>
                                    <button
                                        className="mt-6 flex h-10 items-center justify-center gap-2 rounded-lg border border-[#842cff]/40 bg-[#842cff]/25 px-4 text-sm font-semibold text-white transition hover:bg-[#842cff]/35 disabled:cursor-not-allowed disabled:opacity-60"
                                        type="button"
                                        disabled={autoSearchPlacesMutation.isPending || searchAndImportPlacesMutation.isPending}
                                        onClick={handleAutoPlacesSearch}
                                    >
                                        <FiZap className="size-4" aria-hidden="true" />
                                        {autoSearchPlacesMutation.isPending ? "Finding best leads..." : "Best leads"}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs leading-5 text-white/45">
                                    Auto-search checks the best venue types for your product, saves matches, removes duplicates, and ranks likely buyers.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 md:flex-row">
                                <label className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-black/20 px-3 text-white/45 focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                                    <FiSearch className="size-4 shrink-0" aria-hidden="true" />
                                    <input
                                        className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/30"
                                        value={placesQuery}
                                        onChange={(event) => setPlacesQuery(event.target.value)}
                                        placeholder="Movie theaters, malls, arcades..."
                                    />
                                </label>
                                <button
                                    className="flex h-11 items-center justify-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                    type="submit"
                                    disabled={searchAndImportPlacesMutation.isPending || autoSearchPlacesMutation.isPending}
                                >
                                    <FiMapPin className="size-4" aria-hidden="true" />
                                    {searchAndImportPlacesMutation.isPending ? "Saving..." : "Search & save"}
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">City</span>
                                    <input
                                        className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                        value={placesCity}
                                        onChange={(event) => setPlacesCity(event.target.value)}
                                        placeholder="Austin"
                                    />
                                </label>
                                <label>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">State</span>
                                    <input
                                        className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                        value={placesState}
                                        onChange={(event) => setPlacesState(event.target.value)}
                                        placeholder="TX"
                                    />
                                </label>
                            </div>
                        </form>

                        <div className="content-scroll overflow-y-auto p-4">
                            {(searchAndImportPlacesMutation.isError || autoSearchPlacesMutation.isError) && (
                                <p className="text-sm text-red-200">
                                    Google Places search failed. Check `GOOGLE_PLACES_API_KEY` in `backend/.env`.
                                </p>
                            )}
                            {autoSearchQueries.length > 0 && (
                                <div className="mb-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Auto searched</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {autoSearchQueries.map((query) => (
                                            <span key={query} className="rounded-md bg-[#842cff]/15 px-2 py-1 text-xs font-semibold text-[#d8c8ff]">
                                                {query}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {placeResults.length === 0 && !searchAndImportPlacesMutation.isError && !autoSearchPlacesMutation.isError && (
                                <p className="text-sm text-white/45">
                                    Search results will appear here and save to leads automatically.
                                </p>
                            )}
                            <div className="grid gap-3">
                                {placeResults.map((place) => (
                                    <article
                                        key={place.googlePlaceId || place.businessName}
                                        className="rounded-lg border border-white/10 bg-white/[0.04] p-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <h4 className="truncate text-sm font-semibold text-white">{place.businessName}</h4>
                                                <p className="mt-1 text-xs leading-5 text-white/45">{place.businessAddress || "No address"}</p>
                                            </div>
                                            <span className="flex h-9 shrink-0 items-center gap-2 rounded-lg border border-[#4ade80]/20 bg-[#4ade80]/10 px-3 text-xs font-semibold text-[#9df6b7]">
                                                <FiPlus className="size-3.5" aria-hidden="true" />
                                                Saved
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/45">
                                            {place.phone && <span>{place.phone}</span>}
                                            {place.website && (
                                                <a
                                                    className="flex items-center gap-1 transition hover:text-white"
                                                    href={place.website}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    Website
                                                    <FiExternalLink className="size-3" aria-hidden="true" />
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                            {placeResults.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
                                    <p className="text-xs text-white/45">Saved {placeResults.length} result{placeResults.length === 1 ? "" : "s"} to leads</p>
                                    <p className="text-xs text-white/35">{autoSearchQueries.length > 0 ? "Best-fit leads were ranked and saved." : "All available Google pages were imported."}</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}

            {isLeadModalOpen && (
                <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
                    <form
                        className="modal-panel-enter flex max-h-[88vh] w-full max-w-[34rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40"
                        onSubmit={handleSaveLead}
                    >
                        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                            <div>
                                <h3 className="text-base font-semibold text-white">Add Lead</h3>
                                <p className="mt-1 text-sm text-white/45">Create a lead manually.</p>
                            </div>
                            <button
                                className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                aria-label="Close lead modal"
                                onClick={closeLeadModal}
                            >
                                <FiX className="size-4" aria-hidden="true" />
                            </button>
                        </div>

                        <div className="content-scroll grid gap-4 overflow-y-auto p-5 sm:grid-cols-2">
                            {[
                                ["Business Name", "businessName", "Acme Corp"],
                                ["Lead Name", "leadName", "Jane Doe"],
                                ["Position", "position", "Operations Manager"],
                                ["Phone", "phone", "+1 (415) 555-0101"],
                                ["Email", "email", "lead@company.com"],
                                ["Website", "website", "https://company.com"],
                            ].map(([label, key, placeholder]) => (
                                <label key={key}>
                                    <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</span>
                                    <input
                                        className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                        value={String(leadForm[key as keyof LeadInput] || "")}
                                        onChange={(event) => setLeadForm((lead) => ({ ...lead, [key]: event.target.value }))}
                                        placeholder={placeholder}
                                    />
                                </label>
                            ))}

                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Business Address</span>
                                <input
                                    className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                    value={leadForm.businessAddress}
                                    onChange={(event) => setLeadForm((lead) => ({ ...lead, businessAddress: event.target.value }))}
                                    placeholder="Business address"
                                />
                            </label>

                            <label className="sm:col-span-2">
                                <span className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Status</span>
                                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                                    {tabs.filter((tab): tab is LeadStatus => tab !== "ALL" && tab !== "Archived").map((status) => (
                                        <button
                                            key={status}
                                            className={[
                                                "h-10 rounded-lg border px-3 text-xs font-semibold transition",
                                                leadForm.status === status
                                                    ? "border-[#842cff] bg-[#842cff]/20 text-white"
                                                    : "border-white/10 bg-black/20 text-white/55 hover:bg-white/[0.06] hover:text-white",
                                            ].join(" ")}
                                            type="button"
                                            onClick={() => setLeadForm((lead) => ({ ...lead, status }))}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 border-t border-white/10 px-5 py-3.5">
                            <button
                                className="h-10 rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                onClick={closeLeadModal}
                            >
                                Cancel
                            </button>
                            <button
                                className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                                type="submit"
                            >
                                <FiPlus className="size-4" aria-hidden="true" />
                                Add Lead
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
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-red-100/55">Archive Lead</p>
                                        <h3 className="mt-1 text-lg font-semibold text-white">
                                            {deleteStep === 1 ? "Are you sure you want to delete?" : "You are deleting this lead"}
                                        </h3>
                                        <p className="mt-1 text-sm text-red-50/60">
                                            {deleteStep === 1 ? "This will remove it from active lead records." : "Final confirmation required before this lead is archived."}
                                        </p>
                                    </div>
                                </div>
                                <button className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/20 text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt} aria-label="Close delete confirmation">
                                    <FiX className="size-4" aria-hidden="true" />
                                </button>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-2">
                                {[1, 2].map((step) => (
                                    <div key={step} className={["h-1.5 rounded-full transition", deleteStep >= step ? "bg-red-400" : "bg-white/10"].join(" ")} />
                                ))}
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/35">Selected Lead</p>
                                <p className="mt-2 text-sm font-semibold text-white">{deleteTarget.leadName || deleteTarget.businessName}</p>
                                <p className="mt-1 text-xs text-white/45">{deleteTarget.businessName}</p>
                            </div>
                            <div className="mt-3 rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-3">
                                <p className="text-sm leading-6 text-yellow-50/75">
                                    {deleteStep === 1 ? "Review this lead before continuing. You will be asked one more time." : `You are deleting ${deleteTarget.leadName || deleteTarget.businessName}.`}
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                            <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={closeDeletePrompt}>Cancel</button>
                            {deleteStep === 1 ? (
                                <button className="h-10 rounded-lg border border-red-400/20 bg-red-400/10 px-4 text-sm font-semibold text-red-100/80 transition hover:bg-red-400/15 hover:text-red-100" type="button" onClick={() => setDeleteStep(2)}>Continue</button>
                            ) : (
                                <button className="h-10 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-60" type="button" onClick={confirmDelete} disabled={archiveLeadMutation.isPending}>Delete Lead</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
