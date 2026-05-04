import { useRef, useState } from "react";
import { FiBriefcase, FiCamera, FiCheckCircle, FiMail, FiMapPin, FiPhone, FiShield, FiTrendingUp } from "react-icons/fi";
import { getAuthUser } from "../../api/auth";
import MainLayout from "../layout";

const profileStats = [
    ["Active Leads", "18", "+12%"],
    ["Closed Deals", "42", "+8%"],
    ["Response Time", "8m", "-18%"],
];

const skills = ["Lead qualification", "Pipeline follow-up", "Client calls", "CRM updates", "Workflow demo"];

const activities = [
    ["Qualified Northstar Labs", "2 hours ago"],
    ["Sent follow-up to Daniel Kim", "5 hours ago"],
    ["Tagged Jordan Lee for next process", "Yesterday"],
];

export default function Profile() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const authUser = getAuthUser();
    const employee = authUser?.userType === "employee" ? authUser.user : null;
    const name = employee?.name || authUser?.user.name || "Admin";
    const role = employee?.role || "Sales Agent";
    const team = employee?.team || localStorage.getItem("activeDepartment") || "Sales";
    const email = employee?.email || "admin@assistly.com";
    const phone = employee?.phone || "+1 (415) 555-0101";
    const employeeCode = employee?.employeeCode || "00000003";
    const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    const [profileImage, setProfileImage] = useState(() => localStorage.getItem("profileImage") || "");

    const handleProfileImageChange = (file: File | undefined) => {
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const image = String(reader.result || "");
            setProfileImage(image);
            localStorage.setItem("profileImage", image);
        };
        reader.readAsDataURL(file);
    };

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)] space-y-5">
                <div className="overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80">
                    <div className="h-36 border-b border-white/10 bg-[radial-gradient(circle_at_18%_10%,rgba(132,44,255,0.36),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
                    <div className="px-5 pb-5">
                        <div className="-mt-14 flex flex-wrap items-end justify-between gap-4">
                            <div className="flex min-w-0 items-end gap-4">
                                <div className="relative">
                                    <div className="grid size-28 place-items-center overflow-hidden rounded-lg border-4 border-[#090b13] bg-[linear-gradient(135deg,#842cff,#4a0ebd)] text-3xl font-semibold text-white shadow-2xl shadow-black/30">
                                        {profileImage ? (
                                            <img className="size-full object-cover" src={profileImage} alt={name} />
                                        ) : (
                                            initials
                                        )}
                                    </div>
                                    <button
                                        className="absolute -bottom-2 -right-2 flex size-10 items-center justify-center rounded-lg border border-white/10 bg-[#171a23] text-white/80 shadow-lg shadow-black/30 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        aria-label="Change profile picture"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <FiCamera className="size-4" aria-hidden="true" />
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        className="hidden"
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => handleProfileImageChange(event.target.files?.[0])}
                                    />
                                </div>

                                <div className="min-w-0 pb-1">
                                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Agent Profile</p>
                                    <h2 className="mt-1 truncate text-2xl font-semibold text-white">{name}</h2>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {[role, team, "Active"].map((label) => (
                                            <span key={label} className="rounded-md border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/65">
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white transition hover:brightness-110"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Photo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid gap-5 xl:grid-cols-[22rem_1fr]">
                    <aside className="space-y-5">
                        <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Contact</p>
                            <div className="mt-4 space-y-3">
                                {[
                                    [FiMail, "Email", email],
                                    [FiPhone, "Phone", phone],
                                    [FiMapPin, "Location", "Asia/Taipei"],
                                ].map(([Icon, label, value]) => {
                                    const ContactIcon = Icon as typeof FiMail;
                                    return (
                                        <div key={label as string} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                                            <ContactIcon className="mt-0.5 size-4 shrink-0 text-[#b994ff]" aria-hidden="true" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/35">{label as string}</p>
                                                <p className="mt-1 break-words text-sm font-semibold text-white/75">{value as string}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5">
                            <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Skills</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {skills.map((skill) => (
                                    <span key={skill} className="rounded-md border border-[#842cff]/25 bg-[#842cff]/10 px-3 py-1.5 text-xs font-semibold text-[#b994ff]">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>
                    </aside>

                    <div className="space-y-5">
                        <div className="grid gap-3 md:grid-cols-3">
                            {profileStats.map(([label, value, trend]) => (
                                <article key={label} className="rounded-lg border border-white/10 bg-[#090b13]/80 p-4">
                                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</p>
                                    <div className="mt-3 flex items-end justify-between gap-3">
                                        <p className="text-2xl font-semibold text-white">{value}</p>
                                        <span className="text-xs font-semibold text-emerald-300">{trend}</span>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5">
                            <div className="flex items-center gap-2">
                                <FiBriefcase className="size-4 text-[#b994ff]" aria-hidden="true" />
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Work Information</p>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-2">
                                {[
                                    ["Employee Code", employeeCode],
                                    ["Department", team],
                                    ["Position", role],
                                    ["Status", "Active"],
                                    ["Manager", "Admin"],
                                    ["Work Mode", "Remote"],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 md:even:border-b-0">
                                        <span className="text-sm text-white/45">{label}</span>
                                        <span className="text-right text-sm font-semibold text-white">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5">
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <FiTrendingUp className="size-4 text-[#b994ff]" aria-hidden="true" />
                                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Recent Activity</p>
                                </div>
                                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-white/45">Latest updates</span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {activities.map(([activity, time]) => (
                                    <article key={activity} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                                            <FiCheckCircle className="size-4" aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-white">{activity}</p>
                                            <p className="mt-1 text-xs text-white/40">{name}</p>
                                        </div>
                                        <span className="text-xs text-white/35">{time}</span>
                                    </article>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-lg border border-white/10 bg-[#090b13]/80 p-5">
                            <div className="flex items-center gap-2">
                                <FiShield className="size-4 text-[#b994ff]" aria-hidden="true" />
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Account Security</p>
                            </div>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                {["Employee code login enabled", "Profile photo stored locally"].map((item) => (
                                    <div key={item} className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-sm font-semibold text-white/70">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
