import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { Link, NavLink } from "react-router";
import { clearAuthUser } from "../../../api/auth";
import type { FeatureKey } from "../../../api/features";
import { useFeatureFlags } from "../../../hooks/useFeatureFlags";
import {
    FiBarChart2,
    FiBell,
    FiBookOpen,
    FiChevronDown,
    FiCheckSquare,
    FiImage,
    FiFileText,
    FiLogOut,
    FiMessageCircle,
    FiSearch,
    FiSettings,
    FiShield,
    FiTarget,
    FiUserPlus,
    FiUsers,
} from "react-icons/fi";
import { FaRegMoneyBillAlt } from "react-icons/fa";
import { MdPassword } from "react-icons/md";

type Props = {
    children: ReactNode;
};

const adminNavItems = [
    { label: "Dashboard", path: "/admin/dashboard", icon: FiBarChart2, feature: "dashboard" },
    { label: "Teams", path: "/admin/teams", icon: FiUsers, feature: "teams" },
    { label: "Employees", path: "/admin/employees", icon: FiUserPlus, feature: "employees" },
    { label: "HR", path: "/admin/hr", icon: FiFileText, feature: "hr" },
    { label: "Leads", path: "/admin/leads", icon: FiTarget, feature: "leads" },
    { label: "Tasks", path: "/admin/tasks", icon: FiCheckSquare, feature: "tasks" },
    { label: "Knowledge Base", path: "/admin/knowledge-base", icon: FiBookOpen, feature: "knowledge-base" },
    { label: "Media", path: "/admin/media", icon: FiImage, feature: "media" },
    { label: "Payroll", path: "/admin/payroll", icon: FaRegMoneyBillAlt, feature: "payroll" },
    { label: "Credentials", path: "/admin/credentials", icon: MdPassword, feature: "credentials" },
    { label: "Settings", path: "/admin/settings", icon: FiSettings, feature: "settings" },
];

export default function AdminLayout({ children }: Props) {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimer = useRef<number | undefined>(undefined);
    const { isEnabled } = useFeatureFlags();
    const visibleNavItems = adminNavItems.filter((item) => isEnabled(item.feature as FeatureKey, "admin"));

    const handleScroll = () => {
        setIsScrolling(true);
        window.clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => setIsScrolling(false), 700);
    };

    return (
        <div className="h-screen overflow-hidden bg-[#070910] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_8%_14%,rgba(132,44,255,0.2),transparent_28%),radial-gradient(circle_at_98%_0%,rgba(35,138,255,0.12),transparent_25%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_26%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />

            <aside className="fixed inset-y-0 left-0 z-10 flex w-[16rem] flex-col border-r border-white/10 bg-[#070910]/92 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
                <div className="flex w-full items-center justify-center border-b border-white/10 px-6 py-5">
                    <img className="max-w-[12rem]" src="/images/logoaside.png" alt="Assistly" />
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-3 py-5">
                    <nav className="content-scroll min-h-0 flex-1 overflow-y-auto pr-1" aria-label="Admin navigation">
                        <div className="mb-3 flex items-center gap-2 px-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/35">
                            <FiShield className="size-4" aria-hidden="true" />
                            Admin
                        </div>
                        <ul className="flex flex-col gap-1">
                            {visibleNavItems.map(({ label, path, icon: Icon }) => (
                                <li key={label}>
                                    <NavLink
                                        to={path}
                                        className={({ isActive }) =>
                                            [
                                                "flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium transition",
                                                isActive
                                                    ? "bg-white text-[#070910] shadow-lg shadow-white/10"
                                                    : "text-white/70 hover:bg-white/10 hover:text-white",
                                            ].join(" ")
                                        }
                                    >
                                        <Icon className="size-5 shrink-0" aria-hidden="true" />
                                        <span className="min-w-0 truncate">{label}</span>
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    <nav className="mt-4 shrink-0 border-t border-white/10 pt-4" aria-label="Admin account navigation">
                        <NavLink
                            to="/login"
                            onClick={clearAuthUser}
                            className="flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                            <FiLogOut className="size-5 shrink-0" aria-hidden="true" />
                            <span>Logout</span>
                        </NavLink>
                    </nav>
                </div>
            </aside>

            <main className="relative flex h-screen flex-col pl-[16rem]">
                <header className="z-20 border-b border-white/10 bg-[#070910]/80 px-6 py-4 backdrop-blur-xl">
                    <div className="flex min-h-12 items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Admin Workspace</p>
                            <h1 className="mt-1 truncate text-xl font-semibold text-white">Dashboard</h1>
                        </div>

                        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                            <label className="hidden h-11 w-full max-w-[22rem] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-white/50 transition focus-within:border-[#842cff] focus-within:bg-white/[0.08] focus-within:ring-2 focus-within:ring-[#842cff]/20 md:flex">
                                <FiSearch className="size-5 shrink-0" aria-hidden="true" />
                                <input
                                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                                    type="search"
                                    placeholder="Search agents or leads"
                                />
                            </label>

                            <button
                                className="relative flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="button"
                                aria-label="Notifications"
                            >
                                <FiBell className="size-5" aria-hidden="true" />
                                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-[#842cff]" />
                            </button>

                            <Link
                                className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                to="/admin/messages"
                                aria-label="Messages"
                            >
                                <FiMessageCircle className="size-5" aria-hidden="true" />
                            </Link>

                            <button
                                className="flex h-11 shrink-0 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] py-1.5 pl-1.5 pr-3 text-left transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                                type="button"
                            >
                                <span className="flex size-8 items-center justify-center rounded-md bg-[linear-gradient(135deg,#842cff,#4a0ebd)] text-sm font-semibold text-white">
                                    A
                                </span>
                                <span className="hidden min-w-0 sm:block">
                                    <span className="block truncate text-sm font-semibold text-white">Admin</span>
                                    <span className="block truncate text-xs text-white/45">Manager</span>
                                </span>
                                <FiChevronDown className="hidden size-4 text-white/45 sm:block" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </header>

                <div
                    className={[
                        "content-scroll min-h-0 flex-1 overflow-y-auto p-6",
                        isScrolling ? "is-scrolling" : "",
                    ].join(" ")}
                    onScroll={handleScroll}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
