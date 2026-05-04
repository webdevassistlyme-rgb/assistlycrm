import MainLayout from "../layout";

const deals = [
    { company: "Northstar Labs", stage: "Qualified", value: "$18.4k", owner: "Admin" },
    { company: "BrightPath Retail", stage: "Follow up", value: "$9.8k", owner: "Maya Patel" },
    { company: "Atlas Cloud", stage: "Negotiation", value: "$27.2k", owner: "Jordan Lee" },
];

export default function Sales() {
    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Pipeline</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Sales</h2>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-3">
                    {[
                        ["Open Deals", "12"],
                        ["Pipeline Value", "$84.6k"],
                        ["Closed This Month", "$21.3k"],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="px-5 pb-5">
                    <div className="overflow-hidden rounded-lg border border-white/10">
                        {deals.map((deal) => (
                            <div key={deal.company} className="grid gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[1fr_10rem_8rem_8rem]">
                                <p className="font-semibold text-white">{deal.company}</p>
                                <p className="text-sm text-[#b994ff]">{deal.stage}</p>
                                <p className="text-sm text-white/70">{deal.value}</p>
                                <p className="text-sm text-white/45">{deal.owner}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
