import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiArchive, FiCheckCircle, FiMail, FiMessageCircle, FiPhone, FiSend } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import MainLayout from "../layout";
import { getAuthUser } from "../../api/auth";
import { addLeadComment, getLeads, updateLeadStatus, type Lead, type LeadStatus } from "../../api/leads";

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

const employeeStatusOptions: LeadStatus[] = [
    "NEW",
    "Follow up",
    "Ongoing comms",
    "Qualified",
    "Ongoing Negotiation",
    "Dead",
];

function getLeadActivity(lead: Lead) {
    return [
        {
            label: "Assigned",
            detail: `This lead is assigned to ${lead.assignedAgent?.name || "you"}.`,
            status: "Done",
        },
        {
            label: lead.status,
            detail: lead.status === "Follow up" ? "Follow-up is due for this lead." : `Current status is ${lead.status}.`,
            status: "Current",
        },
        {
            label: "Next action",
            detail: lead.followUpAt
                ? `Follow up ${new Date(lead.followUpAt).toLocaleString()}.`
                : "Contact the lead and schedule the next step.",
            status: "Next",
        },
    ];
}

export default function Leads() {
    const queryClient = useQueryClient();
    const authUser = getAuthUser();
    const employeeId = authUser?.userType === "employee" ? authUser.user._id : "";
    const employeeName = authUser?.userType === "employee" ? authUser.user.name : "Employee";
    const [activeTab, setActiveTab] = useState<LeadStatus | "ALL">("ALL");
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [commentDraft, setCommentDraft] = useState("");

    const { data: leads = [], isLoading, isError } = useQuery({
        queryKey: ["leads", employeeId],
        queryFn: () => getLeads({ assignedAgent: employeeId }),
        enabled: Boolean(employeeId),
    });

    const filteredLeads = useMemo(() => {
        if (activeTab === "ALL") {
            return leads;
        }

        return leads.filter((lead) => lead.status === activeTab);
    }, [activeTab, leads]);

    const selectedLead = leads.find((lead) => lead._id === selectedLeadId) || filteredLeads[0] || null;
    const whatsappPhone = (selectedLead?.phone || "").replace(/\D/g, "");
    const activity = selectedLead ? getLeadActivity(selectedLead) : [];

    const addCommentMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: string }) =>
            addLeadComment(id, { body, authorName: employeeName, authorType: "employee" }),
        onSuccess: (updatedLead) => {
            queryClient.setQueryData<Lead[]>(["leads", employeeId], (current = []) =>
                current.map((lead) => (lead._id === updatedLead._id ? updatedLead : lead))
            );
            setCommentDraft("");
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: LeadStatus }) => updateLeadStatus(id, status),
        onSuccess: (updatedLead) => {
            queryClient.setQueryData<Lead[]>(["leads", employeeId], (current = []) =>
                current.map((lead) => (lead._id === updatedLead._id ? updatedLead : lead))
            );
        },
    });

    useEffect(() => {
        setCommentDraft("");
    }, [selectedLead?._id]);

    const saveComment = () => {
        if (!selectedLead || !commentDraft.trim()) {
            return;
        }

        addCommentMutation.mutate({ id: selectedLead._id, body: commentDraft.trim() });
    };

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="border-b border-white/10">
                    <div className="flex h-12 items-end gap-6 overflow-x-auto">
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
                </div>

                <div className="grid h-[calc(100vh-12rem)] min-h-[32rem] gap-5 pt-5 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
                    <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
                            <h2 className="text-base font-semibold text-white">My Leads</h2>
                            <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/55">
                                {filteredLeads.length}
                            </span>
                        </div>

                        <div className="content-scroll min-h-0 flex-1 divide-y divide-white/10 overflow-y-auto">
                            {isLoading && <p className="px-5 py-6 text-sm text-white/45">Loading assigned leads...</p>}
                            {isError && <p className="px-5 py-6 text-sm text-red-200">Unable to load assigned leads.</p>}
                            {!isLoading && !isError && filteredLeads.length === 0 && (
                                <p className="px-5 py-6 text-sm text-white/45">No leads assigned to you in this tab.</p>
                            )}
                            {filteredLeads.map((lead) => (
                                <button
                                    key={lead._id}
                                    className={[
                                        "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition",
                                        selectedLead?._id === lead._id ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => setSelectedLeadId(lead._id)}
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-white">
                                            {lead.leadName || lead.businessName}
                                        </span>
                                        <span className="mt-1 block truncate text-xs text-white/45">{lead.businessName}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className="block text-xs font-semibold text-white/45">{lead.category || lead.source}</span>
                                        <span className="mt-1 block text-xs text-[#9b5cff]">{lead.status}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="flex min-h-0 flex-col overflow-hidden">
                        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-1 py-1">
                            <div>
                                <h2 className="text-base font-semibold text-white">Lead Details</h2>
                                <p className="mt-1 text-xs text-white/40">Assigned to you</p>
                            </div>

                            <button
                                className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
                                type="button"
                                disabled
                            >
                                <FiArchive className="size-4" aria-hidden="true" />
                                Archive
                            </button>
                        </div>

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

                                    <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                        {[
                                            ["Lead Source", selectedLead.source],
                                            ["Filter", selectedLead.category || "All"],
                                            ["AI Score", selectedLead.aiScore ? `${selectedLead.aiScore}/100` : "Not scored"],
                                            ["Follow Up", selectedLead.followUpAt ? new Date(selectedLead.followUpAt).toLocaleString() : "None"],
                                            ["Status", selectedLead.status],
                                            ["Website", selectedLead.website || "No website"],
                                        ].map(([label, value]) => (
                                            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                                                <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                                                <p className="mt-1.5 truncate text-sm font-semibold text-white">{value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex items-center gap-2">
                                            <FiCheckCircle className="size-4 text-[#b78cff]" aria-hidden="true" />
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Lead Status</p>
                                        </div>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                            {employeeStatusOptions.map((status) => {
                                                const isActive = selectedLead.status === status;

                                                return (
                                                    <button
                                                        key={status}
                                                        className={[
                                                            "h-10 rounded-lg border px-3 text-xs font-semibold transition",
                                                            isActive
                                                                ? "border-[#842cff] bg-[#842cff]/25 text-white"
                                                                : "border-white/10 bg-black/20 text-white/55 hover:bg-white/[0.06] hover:text-white",
                                                        ].join(" ")}
                                                        type="button"
                                                        disabled={updateStatusMutation.isPending || isActive}
                                                        onClick={() => updateStatusMutation.mutate({ id: selectedLead._id, status })}
                                                    >
                                                        {status}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {updateStatusMutation.isPending && (
                                            <p className="mt-2 text-xs font-semibold text-[#9df6b7]">Updating status...</p>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                        <div className="flex items-center gap-2">
                                            <FiMessageCircle className="size-4 text-[#b78cff]" aria-hidden="true" />
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Comments</p>
                                        </div>

                                        <div className="mt-3 grid gap-3">
                                            {(selectedLead.comments || []).length > 0 ? (
                                                selectedLead.comments?.map((comment) => (
                                                    <article key={comment._id || `${comment.createdAt}-${comment.body}`} className="rounded-lg border border-white/10 bg-black/20 p-3">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <p className="text-sm font-semibold text-white">{comment.authorName || "Employee"}</p>
                                                            <p className="text-xs text-white/35">
                                                                {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : ""}
                                                            </p>
                                                        </div>
                                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/65">{comment.body}</p>
                                                    </article>
                                                ))
                                            ) : (
                                                <p className="text-sm leading-6 text-white/65">{selectedLead.notes || "No comments yet."}</p>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <textarea
                                                className="min-h-28 w-full resize-y rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm font-medium text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={commentDraft}
                                                onChange={(event) => setCommentDraft(event.target.value)}
                                                placeholder="Add a comment for this lead..."
                                            />
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    className="flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                                                    type="button"
                                                    disabled={addCommentMutation.isPending || !commentDraft.trim()}
                                                    onClick={saveComment}
                                                >
                                                    <FiSend className="size-4" aria-hidden="true" />
                                                    {addCommentMutation.isPending ? "Saving..." : "Add Comment"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <aside className="flex min-h-0">
                                    <div className="flex max-h-full min-h-[24rem] w-full flex-col rounded-lg border border-white/10 bg-white/[0.04] p-4 xl:sticky xl:top-0">
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Activity</p>
                                        <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
                                            {activity.map((item) => (
                                                <div key={item.label} className="flex gap-3">
                                                    <span
                                                        className={[
                                                            "mt-1 size-2 shrink-0 rounded-full",
                                                            item.status === "Current" ? "bg-[#842cff]" : "bg-white/25",
                                                        ].join(" ")}
                                                    />
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-sm font-semibold text-white/80">{item.label}</p>
                                                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-white/40">
                                                                {item.status}
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs leading-5 text-white/45">{item.detail}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </aside>
                            </div>
                        ) : (
                            <div className="p-6 text-sm text-white/45">Select an assigned lead to view details.</div>
                        )}
                    </section>
                </div>
            </section>
        </MainLayout>
    );
}
