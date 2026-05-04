import { FiMail, FiPhone } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { Link } from "react-router";
import MainLayout from "../layout";

const currentAgent = {
    name: "Admin",
    role: "Sales Agent",
    team: "Sales",
};

const teammates = [
    {
        name: "Maya Patel",
        role: "Sales Agent",
        status: "Available",
        email: "maya.patel@assistly.com",
        phone: "+1 (415) 555-0120",
    },
    {
        name: "Jordan Lee",
        role: "Sales Agent",
        status: "In call",
        email: "jordan.lee@assistly.com",
        phone: "+1 (415) 555-0148",
    },
    {
        name: "Elena Cruz",
        role: "Sales Agent",
        status: "Follow-up",
        email: "elena.cruz@assistly.com",
        phone: "+1 (415) 555-0199",
    },
    {
        name: "Noah Brooks",
        role: "Sales Agent",
        status: "Available",
        email: "noah.brooks@assistly.com",
        phone: "+1 (415) 555-0171",
    },
];

export default function Teams() {
    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="rounded-lg border border-white/10 bg-[#090b13]/80">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Current Team</p>
                            <h2 className="mt-1 text-xl font-semibold text-white">{currentAgent.team}</h2>
                            <p className="mt-1 text-sm text-white/45">
                                {currentAgent.name} · {currentAgent.role}
                            </p>
                        </div>
                        <span className="rounded-md bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white/65">
                            {teammates.length} fellow agents
                        </span>
                    </div>

                    <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                        {teammates.map((agent) => {
                            const whatsappPhone = agent.phone.replace(/\D/g, "");

                            return (
                                <article
                                    key={agent.email}
                                    className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/20 hover:bg-white/[0.06]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="truncate text-base font-semibold text-white">{agent.name}</h3>
                                            <p className="mt-1 text-sm text-white/45">{agent.role}</p>
                                        </div>
                                        <span className="shrink-0 rounded-md border border-[#842cff]/35 bg-[#842cff]/10 px-2 py-1 text-xs font-semibold text-[#b994ff]">
                                            {agent.status}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-2 text-sm">
                                        <a className="block truncate text-white/65 transition hover:text-white" href={`mailto:${agent.email}`}>
                                            {agent.email}
                                        </a>
                                        <a className="block text-white/65 transition hover:text-white" href={`tel:${agent.phone}`}>
                                            {agent.phone}
                                        </a>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <Link
                                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                            to={`/messages?call=${encodeURIComponent(agent.email)}`}
                                        >
                                            <FiPhone className="size-4" aria-hidden="true" />
                                            Call
                                        </Link>
                                        <Link
                                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                            to={`/messages?to=${encodeURIComponent(agent.email)}`}
                                        >
                                            <FiMail className="size-4" aria-hidden="true" />
                                            Message
                                        </Link>
                                        <a
                                            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[#25d366]/30 bg-[#25d366]/10 text-[#7cf0a4] transition hover:bg-[#25d366]/20 focus:outline-none focus:ring-2 focus:ring-[#25d366]/50"
                                            href={`https://wa.me/${whatsappPhone}`}
                                            aria-label={`WhatsApp ${agent.name}`}
                                        >
                                            <FaWhatsapp className="size-4" aria-hidden="true" />
                                        </a>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
