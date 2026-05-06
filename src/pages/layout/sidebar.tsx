import { NavLink } from "react-router";
import {
    FiBarChart2,
    FiBookOpen,
    FiCalendar,
    FiCheckSquare,
    FiLogOut,
    FiSettings,
    FiShoppingBag,
    FiTarget,
    FiUsers,
    FiUser,
} from "react-icons/fi";
import type { FeatureKey } from "../../api/features";
import { useFeatureFlags } from "../../hooks/useFeatureFlags";

const navItems = [
    { label: "Dashboard", path: "/dashboard", icon: FiBarChart2, feature: "dashboard" },
    { label: "Leads", path: "/leads", icon: FiTarget, feature: "leads" },
    { label: "Tasks", path: "/tasks", icon: FiCheckSquare, feature: "tasks" },
    { label: "Knowledge Base", path: "/knowledge-base", icon: FiBookOpen, feature: "knowledge-base" },
    { label: "Teams", path: "/teams", icon: FiUsers, feature: "teams" },
    { label: "Sales", path: "/sales", icon: FiShoppingBag, feature: "sales" },
    { label: "Calendar", path: "/calendar", icon: FiCalendar, feature: "calendar" },
    { label: "Profile", path: "/profile", icon: FiUser, feature: "profile" },
    { label: "Settings", path: "/settings", icon: FiSettings, feature: "settings" },
];

export default function SideBar() {
    const { isEnabled } = useFeatureFlags();
    const visibleNavItems = navItems.filter((item) => isEnabled(item.feature as FeatureKey, "employee"));

    return (
        <aside className="fixed inset-y-0 left-0 z-10 flex w-[16rem] flex-col border-r border-white/10 bg-[#070910]/90 text-white shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex w-full items-center justify-center border-b border-white/10 px-6 py-5">
                <img className="max-w-[12rem]" src="/images/logoaside.png" alt="CRM" />
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between px-3 py-5">
                <nav className="content-scroll min-h-0 overflow-y-auto pr-1" aria-label="Main navigation">
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
                                    <span>{label}</span>
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <nav aria-label="Account navigation">
                    <NavLink
                        to="/login"
                        className="flex h-11 items-center gap-3 rounded-lg px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
                    >
                        <FiLogOut className="size-5 shrink-0" aria-hidden="true" />
                        <span>Logout</span>
                    </NavLink>
                </nav>
            </div>
        </aside>
    );
}
