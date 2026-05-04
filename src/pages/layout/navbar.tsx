import { useMemo, useState } from "react";
import { FiBell, FiChevronDown, FiMessageCircle, FiPlus, FiSearch } from "react-icons/fi";
import { Link, useLocation } from "react-router";
import { getAuthUser } from "../../api/auth";

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/leads": "Leads",
    "/teams": "Teams",
    "/sales": "Sales",
    "/calendar": "Calendar",
    "/profile": "Profile",
    "/settings": "Settings",
    "/messages": "Messages",
};

export default function Navbar() {
    const { pathname } = useLocation();
    const title = pageTitles[pathname] ?? "Workspace";
    const authUser = getAuthUser();
    const user = authUser?.user;
    const userName = user?.name || "Admin";
    const userInitial = userName.charAt(0).toUpperCase();
    const primaryDepartment = authUser?.userType === "employee" ? authUser.user.team : "Sales";
    const departments = useMemo(
        () => Array.from(new Set([primaryDepartment, "Sales", "Retention", "Enterprise", "Onboarding"].filter(Boolean))),
        [primaryDepartment]
    );
    const [activeDepartment, setActiveDepartment] = useState(() => {
        const savedDepartment = localStorage.getItem("activeDepartment");
        return savedDepartment || primaryDepartment || "Sales";
    });
    const [isDepartmentOpen, setIsDepartmentOpen] = useState(false);

    const handleDepartmentChange = (department: string) => {
        setActiveDepartment(department);
        localStorage.setItem("activeDepartment", department);
        setIsDepartmentOpen(false);
    };

    return (
        <header className="z-20 border-b border-white/10 bg-[#070910]/80 px-6 py-4 backdrop-blur-xl">
            <div className="flex min-h-12 items-center justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Workspace</p>
                    <h1 className="mt-1 truncate text-xl font-semibold text-white">{title}</h1>
                </div>

                <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
                    <label className="hidden h-11 w-full max-w-[22rem] items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 text-white/50 transition focus-within:border-[#842cff] focus-within:bg-white/[0.08] focus-within:ring-2 focus-within:ring-[#842cff]/20 md:flex">
                        <FiSearch className="size-5 shrink-0" aria-hidden="true" />
                        <input
                            className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35"
                            type="search"
                            placeholder="Search"
                        />
                    </label>

                    <button
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#842cff]/60"
                        type="button"
                        aria-label="Create"
                    >
                        <FiPlus className="size-5" aria-hidden="true" />
                    </button>

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
                        to="/messages"
                        aria-label="Messages"
                    >
                        <FiMessageCircle className="size-5" aria-hidden="true" />
                    </Link>

                    <div className="relative">
                        <button
                            className={[
                                "flex h-11 shrink-0 items-center gap-3 rounded-lg border py-1.5 pl-1.5 pr-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#842cff]/60",
                                isDepartmentOpen
                                    ? "border-[#842cff]/70 bg-white/[0.08]"
                                    : "border-white/10 bg-white/[0.06] hover:bg-white/10",
                            ].join(" ")}
                            type="button"
                            aria-haspopup="menu"
                            aria-expanded={isDepartmentOpen}
                            onClick={() => setIsDepartmentOpen((isOpen) => !isOpen)}
                        >
                            <span className="flex size-8 items-center justify-center rounded-md bg-[linear-gradient(135deg,#842cff,#4a0ebd)] text-sm font-semibold text-white">
                                {userInitial}
                            </span>
                            <span className="hidden min-w-0 sm:block">
                                <span className="block max-w-28 truncate text-sm font-semibold text-white">{userName}</span>
                                <span className="block max-w-28 truncate text-xs text-white/45">{activeDepartment}</span>
                            </span>
                            <FiChevronDown
                                className={[
                                    "hidden size-4 text-white/45 transition sm:block",
                                    isDepartmentOpen ? "rotate-180" : "",
                                ].join(" ")}
                                aria-hidden="true"
                            />
                        </button>

                        {isDepartmentOpen && (
                            <div className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-56 overflow-hidden rounded-lg border border-white/10 bg-[#11141d] p-1 shadow-2xl shadow-black/40">
                                <div className="border-b border-white/10 px-3 py-2">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">Switch Department</p>
                                    <p className="mt-1 truncate text-sm font-semibold text-white">{userName}</p>
                                </div>
                                <div className="py-1">
                                    {departments.map((department) => (
                                        <button
                                            key={department}
                                            className={[
                                                "flex h-10 w-full items-center justify-between rounded-md px-3 text-left text-sm font-semibold transition",
                                                activeDepartment === department
                                                    ? "bg-[#842cff]/15 text-[#b994ff]"
                                                    : "text-white/65 hover:bg-white/[0.06] hover:text-white",
                                            ].join(" ")}
                                            type="button"
                                            role="menuitem"
                                            onClick={() => handleDepartmentChange(department)}
                                        >
                                            <span>{department}</span>
                                            {activeDepartment === department && <span className="size-2 rounded-full bg-[#842cff]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
