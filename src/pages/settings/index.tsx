import MainLayout from "../layout";

const settings = [
    ["Lead assignment alerts", "On"],
    ["Team message notifications", "On"],
    ["Daily digest", "Off"],
    ["Default lead view", "ALL"],
    ["Language", "English"],
    ["Theme", "Dark"],
];

export default function Settings() {
    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="border-b border-white/10 px-5 py-4">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Preferences</p>
                    <h2 className="mt-1 text-xl font-semibold text-white">Settings</h2>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                    {settings.map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p className="font-semibold text-white">{label}</p>
                            <span className="rounded-md bg-white/[0.06] px-3 py-1.5 text-sm font-semibold text-white/65">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </MainLayout>
    );
}
