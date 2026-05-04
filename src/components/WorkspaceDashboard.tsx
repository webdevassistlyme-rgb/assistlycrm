import {
    FiAlertCircle,
    FiCalendar,
    FiCheckCircle,
    FiCircle,
    FiClipboard,
} from "react-icons/fi";

type WorkspaceDashboardProps = {
    userName: string;
    mode: "employee" | "admin";
};

const employeeStats = [
    { label: "Total Tasks", value: "32", trend: "+12% from last week", tone: "purple", icon: FiClipboard },
    { label: "In Progress", value: "14", trend: "+8% from last week", tone: "purple", icon: FiCircle },
    { label: "Completed", value: "18", trend: "+25% from last week", tone: "green", icon: FiCheckCircle },
    { label: "Overdue", value: "3", trend: "-15% from last week", tone: "red", icon: FiAlertCircle },
];

const adminStats = [
    { label: "Total Teams", value: "6", trend: "+2 this month", tone: "purple", icon: FiClipboard },
    { label: "Active Employees", value: "28", trend: "+8% from last week", tone: "purple", icon: FiCircle },
    { label: "Qualified Leads", value: "58", trend: "+25% from last week", tone: "green", icon: FiCheckCircle },
    { label: "Pending Reviews", value: "7", trend: "-4% from last week", tone: "red", icon: FiAlertCircle },
];

const recentActivity = [
    ["Sarah completed lead qualification", "2 hours ago"],
    ["Mike updated API integration", "5 hours ago"],
    ["You created a new follow-up plan", "1 day ago"],
    ["Daniel completed onboarding notes", "1 day ago"],
];

const upcoming = [
    ["24", "MAY", "Project Kickoff Meeting", "10:00 AM", "purple"],
    ["25", "MAY", "Design System Review", "02:00 PM", "yellow"],
    ["27", "MAY", "Client Presentation", "11:30 AM", "red"],
    ["28", "MAY", "Team Retro", "04:00 PM", "green"],
];

const tasks = [
    ["UI Design for Dashboard", "Website Redesign", "May 24, 2026", "High", "In Progress"],
    ["API Integration", "Mobile App", "May 26, 2026", "Medium", "In Progress"],
    ["Marketing Plan", "Marketing", "May 27, 2026", "Low", "To Do"],
    ["Bug Fixes", "Web App", "May 28, 2026", "High", "To Do"],
];

const toneStyles = {
    purple: "border-[#842cff]/25 bg-[#842cff]/10 text-[#b994ff]",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    red: "border-red-400/20 bg-red-400/10 text-red-300",
    yellow: "border-amber-300/20 bg-amber-300/10 text-amber-200",
};

function StatCard({ stat }: { stat: (typeof employeeStats)[number] }) {
    const Icon = stat.icon;
    const isRed = stat.tone === "red";

    return (
        <article className="rounded-lg border border-white/10 bg-[#11141d]/80 p-4 shadow-xl shadow-black/15">
            <div className="flex items-start justify-between gap-4">
                <div className={`flex size-12 items-center justify-center rounded-lg border ${toneStyles[stat.tone as keyof typeof toneStyles]}`}>
                    <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="h-10 w-20 opacity-80">
                    <svg viewBox="0 0 96 42" className="h-full w-full" aria-hidden="true">
                        <path
                            d="M2 35 C12 18 18 38 28 22 C37 8 42 34 52 18 C62 4 68 30 78 14 C84 6 89 15 94 10"
                            fill="none"
                            stroke={isRed ? "#ef4444" : stat.tone === "green" ? "#34d399" : "#842cff"}
                            strokeWidth="3"
                            strokeLinecap="round"
                        />
                    </svg>
                </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-white/75">{stat.label}</p>
            <p className="mt-2 text-3xl font-semibold text-white">{stat.value}</p>
            <p className={`mt-2 text-xs font-semibold ${isRed ? "text-red-300" : "text-emerald-300"}`}>{stat.trend}</p>
        </article>
    );
}

function TaskOverview() {
    return (
        <section className="rounded-lg border border-white/10 bg-[#11141d]/80 p-5 shadow-xl shadow-black/15 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-white">Task Overview</h2>
                <button className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-white/70" type="button">
                    This Week
                </button>
            </div>
            <div className="mt-5 h-56">
                <svg viewBox="0 0 620 220" className="h-full w-full" aria-hidden="true">
                    {[40, 80, 120, 160].map((y) => (
                        <line key={y} x1="0" x2="620" y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
                    ))}
                    <path
                        d="M12 174 C64 178 72 148 125 132 C178 114 208 114 242 126 C292 144 316 164 372 142 C420 124 452 136 500 96 C548 58 574 98 608 92"
                        fill="none"
                        stroke="#842cff"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                    <path
                        d="M12 196 C76 190 86 168 136 164 C192 160 214 180 270 170 C320 160 336 132 384 136 C428 140 440 166 488 156 C536 146 570 160 608 152"
                        fill="none"
                        stroke="rgba(255,255,255,0.42)"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>
            </div>
            <div className="flex justify-center gap-6 text-xs font-semibold text-white/55">
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#842cff]" />This Week</span>
                <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-white/45" />Last Week</span>
            </div>
        </section>
    );
}

function PriorityPanel() {
    return (
        <section className="rounded-lg border border-white/10 bg-[#11141d]/80 p-5 shadow-xl shadow-black/15">
            <h2 className="text-base font-semibold text-white">Tasks by Priority</h2>
            <div className="mt-5 flex items-center gap-6">
                <div className="grid size-40 place-items-center rounded-full bg-[conic-gradient(#842cff_0_38%,#fbbf24_38%_69%,#4ade80_69%_87%,#6b7280_87%_100%)]">
                    <div className="grid size-24 place-items-center rounded-full bg-[#11141d] text-center">
                        <span className="block text-2xl font-semibold text-white">32</span>
                        <span className="block text-xs text-white/45">Total</span>
                    </div>
                </div>
                <div className="space-y-3 text-sm">
                    {[
                        ["High Priority", "12 (37%)", "bg-[#842cff]"],
                        ["Medium Priority", "10 (31%)", "bg-amber-400"],
                        ["Low Priority", "6 (19%)", "bg-emerald-400"],
                        ["No Priority", "4 (13%)", "bg-slate-500"],
                    ].map(([label, value, color]) => (
                        <div key={label} className="flex items-center gap-3 text-white/70">
                            <span className={`size-2.5 rounded-full ${color}`} />
                            <span>{label}</span>
                            <span className="text-white/45">{value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default function WorkspaceDashboard({ userName, mode }: WorkspaceDashboardProps) {
    const stats = mode === "admin" ? adminStats : employeeStats;

    return (
        <section className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-white">Welcome back, {userName}!</h1>
                    <p className="mt-1 text-sm text-white/55">Here's what's happening with your workspace today.</p>
                </div>
                <button className="flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white/70" type="button">
                    <FiCalendar className="size-4" aria-hidden="true" />
                    This Week
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <StatCard key={stat.label} stat={stat} />
                ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.4fr_0.85fr_0.8fr]">
                <TaskOverview />
                <PriorityPanel />
                <section className="rounded-lg border border-white/10 bg-[#11141d]/80 p-5 shadow-xl shadow-black/15">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-semibold text-white">Upcoming</h2>
                        <button className="text-sm font-semibold text-[#b994ff]" type="button">View all</button>
                    </div>
                    <div className="mt-4 space-y-3">
                        {upcoming.map(([day, month, title, time, tone]) => (
                            <div key={title} className="flex items-center gap-3">
                                <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-center">
                                    <span className="block text-base font-semibold text-white leading-none">{day}</span>
                                    <span className="block text-[0.65rem] font-semibold text-white/40">{month}</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-white">{title}</p>
                                    <p className="mt-1 text-xs text-white/45">{time}</p>
                                </div>
                                <span className={`size-2 rounded-full ${tone === "purple" ? "bg-[#842cff]" : tone === "yellow" ? "bg-amber-400" : tone === "red" ? "bg-red-400" : "bg-emerald-400"}`} />
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            <div className="grid gap-4 xl:grid-cols-[0.8fr_1.52fr]">
                <section className="rounded-lg border border-white/10 bg-[#11141d]/80 p-5 shadow-xl shadow-black/15">
                    <h2 className="text-base font-semibold text-white">Recent Activity</h2>
                    <div className="mt-4 space-y-4">
                        {recentActivity.map(([activity, time], index) => (
                            <div key={activity} className="flex items-center gap-3">
                                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-semibold text-white">
                                    {["S", "M", "Y", "D"][index]}
                                </div>
                                <p className="min-w-0 flex-1 truncate text-sm text-white/70">{activity}</p>
                                <span className="text-xs text-white/40">{time}</span>
                            </div>
                        ))}
                    </div>
                    <button className="mt-5 text-sm font-semibold text-[#b994ff]" type="button">View all activity</button>
                </section>

                <section className="overflow-hidden rounded-lg border border-white/10 bg-[#11141d]/80 shadow-xl shadow-black/15">
                    <div className="flex items-center justify-between px-5 py-4">
                        <h2 className="text-base font-semibold text-white">{mode === "admin" ? "Team Tasks" : "My Tasks"}</h2>
                        <button className="text-sm font-semibold text-[#b994ff]" type="button">View all</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[42rem] text-left text-sm">
                            <thead className="border-y border-white/10 text-xs font-semibold uppercase tracking-[0.12em] text-white/35">
                                <tr>
                                    <th className="px-5 py-3">Task</th>
                                    <th className="px-5 py-3">Project</th>
                                    <th className="px-5 py-3">Due Date</th>
                                    <th className="px-5 py-3">Priority</th>
                                    <th className="px-5 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {tasks.map(([task, project, dueDate, priority, status]) => (
                                    <tr key={task} className="text-white/70">
                                        <td className="px-5 py-3 font-semibold text-white">{task}</td>
                                        <td className="px-5 py-3"><span className="rounded-md bg-[#842cff]/15 px-2 py-1 text-xs font-semibold text-[#b994ff]">{project}</span></td>
                                        <td className="px-5 py-3">{dueDate}</td>
                                        <td className="px-5 py-3">{priority}</td>
                                        <td className="px-5 py-3"><span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-white/70">{status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </section>
    );
}
