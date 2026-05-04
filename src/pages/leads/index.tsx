import { useState } from "react";
import { FiArchive, FiEdit2, FiMail, FiPhone, FiSave, FiTag } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import MainLayout from "../layout";

const tabs = ["ALL", "NEW", "Follow up", "Ongoing comms", "Qualified", "Ongoing Negotiation", "Dead", "Archived"];

const leads = [
    { name: "Sarah Mitchell", company: "Northstar Labs", status: "New", value: "$18.4k" },
    { name: "Daniel Kim", company: "BrightPath Retail", status: "Contacted", value: "$9.8k" },
    { name: "Maya Chen", company: "Atlas Cloud", status: "Qualified", value: "$27.2k" },
];

const leadDetails = {
    name: "Sarah Mitchell",
    position: "VP Operations",
    businessName: "Northstar Labs",
    businessAddress: "420 Mission Street, Suite 1800, San Francisco, CA 94105",
    email: "sarah.mitchell@northstarlabs.com",
    phone: "+1 (415) 555-0184",
    assignedAgent: "Admin",
    assignedSince: "Apr 18, 2026",
};

const taggedAgents = ["Maya Patel", "Jordan Lee"];

const progress = [
    { label: "Lead created", detail: "Website form captured company details", status: "Done" },
    { label: "Contacted", detail: "Intro email sent by Admin", status: "Done" },
    { label: "Qualified", detail: "Budget and use case confirmed", status: "Current" },
    { label: "Proposal", detail: "Waiting for workflow demo handoff", status: "Next" },
];

const otherDetails = [
    ["Lead Source", "Website"],
    ["Deal Value", "$18.4k"],
    ["Industry", "SaaS Operations"],
    ["Priority", "High"],
    ["Expected Close", "May 24, 2026"],
    ["Next Process", "Workflow demo"],
];

export default function Leads() {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);
    const [email, setEmail] = useState(leadDetails.email);
    const [phone, setPhone] = useState(leadDetails.phone);
    const [notes, setNotes] = useState(
        "Interested in automating sales handoffs and weekly reporting. Follow up with a workflow demo and pricing options."
    );
    const whatsappPhone = phone.replace(/\D/g, "");

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="border-b border-white/10">
                    <div className="flex h-12 items-end gap-6 overflow-x-auto">
                        {tabs.map((tab) => {
                            const isActive = tab === "ALL";

                            return (
                                <button
                                    key={tab}
                                    className={[
                                        "relative h-12 shrink-0 px-1 text-sm font-medium transition",
                                        isActive ? "text-[#9b5cff]" : "text-white/60 hover:text-white",
                                    ].join(" ")}
                                    type="button"
                                >
                                    {tab}
                                    {isActive && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#842cff]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid min-h-[calc(100vh-12rem)] gap-5 pt-5 lg:grid-cols-[minmax(16rem,20rem)_1fr]">
                    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                        <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
                            <h2 className="text-base font-semibold text-white">Leads</h2>
                            <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-medium text-white/55">
                                {leads.length}
                            </span>
                        </div>

                        <div className="divide-y divide-white/10">
                            {leads.map((lead, index) => (
                                <button
                                    key={lead.name}
                                    className={[
                                        "flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition",
                                        index === 0 ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                                    ].join(" ")}
                                    type="button"
                                >
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-white">{lead.name}</span>
                                        <span className="mt-1 block truncate text-xs text-white/45">{lead.company}</span>
                                    </span>
                                    <span className="shrink-0 text-right">
                                        <span className="block text-sm font-semibold text-white">{lead.value}</span>
                                        <span className="mt-1 block text-xs text-[#9b5cff]">{lead.status}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
                            <div>
                                <h2 className="text-base font-semibold text-white">Lead Details</h2>
                                <p className="mt-1 text-xs text-white/40">Agent profile</p>
                            </div>

                            <button
                                className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="button"
                            >
                                <FiArchive className="size-4" aria-hidden="true" />
                                Archive
                            </button>
                        </div>

                        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
                            <div className="space-y-5">
                                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                                    <div className="flex flex-wrap items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm text-white/45">Lead Name</p>
                                            <h3 className="mt-1 text-2xl font-semibold text-white">{leadDetails.name}</h3>
                                            <p className="mt-1 text-sm text-white/55">{leadDetails.position}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <a
                                                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                href={`tel:${phone}`}
                                                aria-label="Call lead"
                                            >
                                                <FiPhone className="size-4" aria-hidden="true" />
                                            </a>
                                            <a
                                                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                href={`mailto:${email}`}
                                                aria-label="Email lead"
                                            >
                                                <FiMail className="size-4" aria-hidden="true" />
                                            </a>
                                            <a
                                                className="flex size-9 items-center justify-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#7cf0a4] transition hover:bg-[#25d366]/20 focus:outline-none focus:ring-2 focus:ring-[#25d366]/50"
                                                href={`https://wa.me/${whatsappPhone}`}
                                                aria-label="WhatsApp lead"
                                            >
                                                <FaWhatsapp className="size-4.5" aria-hidden="true" />
                                            </a>
                                            <button
                                                className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                type="button"
                                                aria-label={isEditingContact ? "Save contact" : "Edit contact"}
                                                onClick={() => setIsEditingContact((current) => !current)}
                                            >
                                                {isEditingContact ? (
                                                    <FiSave className="size-4" aria-hidden="true" />
                                                ) : (
                                                    <FiEdit2 className="size-4" aria-hidden="true" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                Business
                                            </p>
                                            <p className="mt-2 text-sm font-semibold text-white">{leadDetails.businessName}</p>
                                            <p className="mt-1 text-sm leading-6 text-white/55">{leadDetails.businessAddress}</p>
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                    Email
                                                </p>
                                                {isEditingContact ? (
                                                    <input
                                                        className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                        type="email"
                                                        value={email}
                                                        onChange={(event) => setEmail(event.target.value)}
                                                    />
                                                ) : (
                                                    <a
                                                        className="mt-2 block truncate text-sm font-semibold text-white transition hover:text-[#b994ff]"
                                                        href={`mailto:${email}`}
                                                    >
                                                        {email}
                                                    </a>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                    Phone Number
                                                </p>
                                                {isEditingContact ? (
                                                    <input
                                                        className="mt-2 h-9 w-full rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none transition focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                        type="tel"
                                                        value={phone}
                                                        onChange={(event) => setPhone(event.target.value)}
                                                    />
                                                ) : (
                                                    <a
                                                        className="mt-2 block text-sm font-semibold text-white transition hover:text-[#b994ff]"
                                                        href={`tel:${phone}`}
                                                    >
                                                        {phone}
                                                    </a>
                                                )}
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
                                            <p className="mt-3 text-sm font-semibold text-white">{leadDetails.assignedAgent}</p>
                                            <p className="mt-1 text-xs text-white/45">Since {leadDetails.assignedSince}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">
                                                Tag For Next Process
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {taggedAgents.map((agent) => (
                                                    <span
                                                        key={agent}
                                                        className="rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-white/70"
                                                    >
                                                        {agent}
                                                    </span>
                                                ))}
                                            </div>
                                            <label className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-white/45 focus-within:border-[#842cff] focus-within:ring-2 focus-within:ring-[#842cff]/20">
                                                <FiTag className="size-4 shrink-0" aria-hidden="true" />
                                                <input
                                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                                                    type="text"
                                                    placeholder="Tag agent"
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
                                    {otherDetails.map(([label, value]) => (
                                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-3">
                                            <p className="text-[0.68rem] font-medium uppercase tracking-[0.12em] text-white/35">{label}</p>
                                            <p className="mt-1.5 text-sm font-semibold text-white">{value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Notes</p>
                                        <button
                                            className="flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                            type="button"
                                            onClick={() => setIsEditingNotes((current) => !current)}
                                        >
                                            <FiEdit2 className="size-3.5" aria-hidden="true" />
                                            Edit
                                        </button>
                                    </div>
                                    {isEditingNotes ? (
                                        <div className="mt-3">
                                            <textarea
                                                className="min-h-28 w-full resize-none rounded-lg border border-white/10 bg-black/20 p-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                                                value={notes}
                                                onChange={(event) => setNotes(event.target.value)}
                                            />
                                            <button
                                                className="mt-3 flex h-10 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                                type="button"
                                                onClick={() => setIsEditingNotes(false)}
                                            >
                                                <FiSave className="size-4" aria-hidden="true" />
                                                Save
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="mt-3 text-sm leading-6 text-white/65">{notes}</p>
                                    )}
                                </div>
                            </div>

                            <aside className="flex">
                                <div className="flex min-h-[calc(100vh-17rem)] w-full flex-col rounded-lg border border-white/10 bg-white/[0.04] p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Activity</p>
                                    <div className="mt-4 flex-1 space-y-5 overflow-y-auto pr-1">
                                        {progress.map((item) => (
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
                    </section>
                </div>
            </section>
        </MainLayout>
    );
}
