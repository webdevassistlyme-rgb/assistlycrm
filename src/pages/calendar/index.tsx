import MainLayout from "../layout";

const events = [
    { time: "09:30", title: "Lead discovery call", detail: "Sarah Mitchell · Northstar Labs" },
    { time: "11:00", title: "Pipeline review", detail: "Sales team" },
    { time: "14:15", title: "Workflow demo", detail: "Atlas Cloud" },
    { time: "16:00", title: "Follow-up block", detail: "Open leads" },
];

export default function Calendar() {
    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Schedule</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">Calendar</h2>
                    </div>
                    <span className="rounded-md bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white/65">
                        Today
                    </span>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-[16rem_1fr]">
                    <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                        <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">May 2026</p>
                        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-white/45">
                            {["M", "T", "W", "T", "F", "S", "S"].map((day) => (
                                <span key={day}>{day}</span>
                            ))}
                            {Array.from({ length: 31 }, (_, index) => (
                                <span
                                    key={index + 1}
                                    className={[
                                        "flex aspect-square items-center justify-center rounded-md",
                                        index + 1 === 2 ? "bg-[#842cff] font-semibold text-white" : "text-white/65",
                                    ].join(" ")}
                                >
                                    {index + 1}
                                </span>
                            ))}
                        </div>
                    </aside>

                    <div className="space-y-3">
                        {events.map((event) => (
                            <article key={event.title} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[5rem_1fr]">
                                <p className="text-sm font-semibold text-[#b994ff]">{event.time}</p>
                                <div>
                                    <h3 className="font-semibold text-white">{event.title}</h3>
                                    <p className="mt-1 text-sm text-white/45">{event.detail}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
