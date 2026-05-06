import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiBriefcase, FiEdit2, FiFileText, FiPlus, FiSearch, FiStar, FiTrash2, FiUsers, FiX } from "react-icons/fi";
import AdminLayout from "../adminLayout";
import {
    archiveApplicant,
    archiveJobPosting,
    createApplicant,
    createJobPosting,
    getApplicants,
    getJobPostings,
    updateApplicant,
    updateApplicantStage,
    updateJobPosting,
    type Applicant,
    type ApplicantInput,
    type ApplicantStage,
    type JobPosting,
    type JobPostingInput,
    type JobStatus,
} from "../../../api/hr";

const tabs = ["Job Postings", "Applicants"] as const;
const jobStatuses: JobStatus[] = ["Draft", "Open", "Paused", "Closed"];
const applicantStages: ApplicantStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];
const emptyJob: JobPostingInput = {
    title: "",
    department: "",
    location: "",
    employmentType: "Full-time",
    salaryRange: "",
    description: "",
    requirements: "",
    status: "Draft",
};
const emptyApplicant: ApplicantInput = {
    jobPosting: null,
    name: "",
    email: "",
    phone: "",
    resumeUrl: "",
    source: "Manual",
    stage: "Applied",
    rating: 0,
};

const statusClass: Record<string, string> = {
    Open: "bg-emerald-400/10 text-emerald-200",
    Draft: "bg-white/[0.06] text-white/55",
    Paused: "bg-yellow-400/10 text-yellow-100/80",
    Closed: "bg-red-500/15 text-red-200",
    Applied: "bg-white/[0.06] text-white/55",
    Screening: "bg-sky-400/10 text-sky-100",
    Interview: "bg-violet-400/10 text-violet-100",
    Offer: "bg-emerald-400/10 text-emerald-200",
    Hired: "bg-emerald-500/15 text-emerald-100",
    Rejected: "bg-red-500/15 text-red-200",
};

function Badge({ value }: { value: string }) {
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${statusClass[value] || "bg-white/[0.06] text-white/55"}`}>
            <span className="size-1.5 rounded-full bg-current" />
            {value}
        </span>
    );
}

export default function AdminHr() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Job Postings");
    const [search, setSearch] = useState("");
    const [jobModal, setJobModal] = useState<{ mode: "add" | "edit"; job?: JobPosting } | null>(null);
    const [applicantModal, setApplicantModal] = useState<{ mode: "add" | "edit"; applicant?: Applicant } | null>(null);
    const [jobForm, setJobForm] = useState<JobPostingInput>(emptyJob);
    const [applicantForm, setApplicantForm] = useState<ApplicantInput>(emptyApplicant);

    const { data: jobs = [], isLoading: jobsLoading, isError: jobsError } = useQuery({
        queryKey: ["hr-jobs", search],
        queryFn: () => getJobPostings({ search }),
    });
    const { data: applicants = [], isLoading: applicantsLoading, isError: applicantsError } = useQuery({
        queryKey: ["hr-applicants", search],
        queryFn: () => getApplicants({ search }),
    });

    const refreshHr = () => {
        queryClient.invalidateQueries({ queryKey: ["hr-jobs"] });
        queryClient.invalidateQueries({ queryKey: ["hr-applicants"] });
    };

    const createJobMutation = useMutation({ mutationFn: createJobPosting, onSuccess: () => { refreshHr(); closeJobModal(); } });
    const updateJobMutation = useMutation({
        mutationFn: ({ id, job }: { id: string; job: JobPostingInput }) => updateJobPosting(id, job),
        onSuccess: () => { refreshHr(); closeJobModal(); },
    });
    const archiveJobMutation = useMutation({ mutationFn: archiveJobPosting, onSuccess: refreshHr });
    const createApplicantMutation = useMutation({ mutationFn: createApplicant, onSuccess: () => { refreshHr(); closeApplicantModal(); } });
    const updateApplicantMutation = useMutation({
        mutationFn: ({ id, applicant }: { id: string; applicant: ApplicantInput }) => updateApplicant(id, applicant),
        onSuccess: () => { refreshHr(); closeApplicantModal(); },
    });
    const updateStageMutation = useMutation({
        mutationFn: ({ id, stage }: { id: string; stage: ApplicantStage }) => updateApplicantStage(id, stage),
        onSuccess: refreshHr,
    });
    const archiveApplicantMutation = useMutation({ mutationFn: archiveApplicant, onSuccess: refreshHr });

    const stats = useMemo(
        () => [
            { label: "Open Jobs", value: jobs.filter((job) => job.status === "Open").length.toString(), icon: FiBriefcase },
            { label: "Applicants", value: applicants.length.toString(), icon: FiUsers },
            { label: "Interviews", value: applicants.filter((applicant) => applicant.stage === "Interview").length.toString(), icon: FiFileText },
            { label: "Offers", value: applicants.filter((applicant) => applicant.stage === "Offer").length.toString(), icon: FiStar },
        ],
        [applicants, jobs]
    );

    const openAddJob = () => {
        setJobForm(emptyJob);
        setJobModal({ mode: "add" });
    };

    const openEditJob = (job: JobPosting) => {
        setJobForm({
            title: job.title,
            department: job.department,
            location: job.location,
            employmentType: job.employmentType,
            salaryRange: job.salaryRange,
            description: job.description,
            requirements: job.requirements,
            status: job.status,
        });
        setJobModal({ mode: "edit", job });
    };

    const closeJobModal = () => {
        setJobModal(null);
        setJobForm(emptyJob);
    };

    const openAddApplicant = () => {
        setApplicantForm(emptyApplicant);
        setApplicantModal({ mode: "add" });
    };

    const openEditApplicant = (applicant: Applicant) => {
        setApplicantForm({
            jobPosting: applicant.jobPosting?._id || null,
            name: applicant.name,
            email: applicant.email,
            phone: applicant.phone,
            resumeUrl: applicant.resumeUrl,
            source: applicant.source,
            stage: applicant.stage,
            rating: applicant.rating,
        });
        setApplicantModal({ mode: "edit", applicant });
    };

    const closeApplicantModal = () => {
        setApplicantModal(null);
        setApplicantForm(emptyApplicant);
    };

    const saveJob = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!jobForm.title.trim()) return;
        if (jobModal?.mode === "edit" && jobModal.job) {
            updateJobMutation.mutate({ id: jobModal.job._id, job: jobForm });
            return;
        }
        createJobMutation.mutate(jobForm);
    };

    const saveApplicant = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!applicantForm.name.trim()) return;
        if (applicantModal?.mode === "edit" && applicantModal.applicant) {
            updateApplicantMutation.mutate({ id: applicantModal.applicant._id, applicant: applicantForm });
            return;
        }
        createApplicantMutation.mutate(applicantForm);
    };

    return (
        <AdminLayout>
            <section className="min-h-[calc(100vh-8.5rem)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-white">HR</h2>
                        <p className="mt-1 text-sm text-white/50">Manage job postings, applicants, hiring stages, and recruitment notes.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <label className="flex h-11 w-[20rem] max-w-full items-center gap-3 rounded-lg border border-white/10 bg-[#090b13]/80 px-3 text-white/45 transition focus-within:border-[#842cff]">
                            <input className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search HR..." />
                            <FiSearch className="size-4" />
                        </label>
                        <button className="flex h-11 items-center gap-2 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-5 text-sm font-semibold text-white" type="button" onClick={activeTab === "Job Postings" ? openAddJob : openAddApplicant}>
                            <FiPlus className="size-4" />
                            Add {activeTab === "Job Postings" ? "Job" : "Applicant"}
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid gap-3 md:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <article key={stat.label} className="rounded-lg border border-white/10 bg-[#0c1018]/80 p-4 shadow-2xl shadow-black/10">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-[#842cff]/18 text-[#b78cff]"><Icon className="size-5" /></span>
                                    <span>
                                        <p className="text-xs text-white/55">{stat.label}</p>
                                        <p className="mt-1 text-xl font-semibold text-white">{stat.value}</p>
                                    </span>
                                </div>
                            </article>
                        );
                    })}
                </div>

                <div className="mt-5 border-b border-white/10">
                    <div className="flex gap-3">
                        {tabs.map((tab) => (
                            <button key={tab} className={["h-12 px-4 text-sm font-semibold transition", activeTab === tab ? "border-b-2 border-[#842cff] bg-[#842cff]/12 text-white" : "text-white/55 hover:text-white"].join(" ")} type="button" onClick={() => setActiveTab(tab)}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === "Job Postings" ? (
                    <DataShell footer={`Showing ${jobs.length} job posting${jobs.length === 1 ? "" : "s"}`}>
                        <table className="w-full min-w-[72rem] table-fixed border-separate border-spacing-0 text-left">
                            <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                <tr>
                                    <th className="w-[23%] px-4 py-4">Job</th>
                                    <th className="w-[15%] px-4 py-4">Department</th>
                                    <th className="w-[17%] px-4 py-4">Location</th>
                                    <th className="w-[13%] px-4 py-4">Type</th>
                                    <th className="w-[13%] px-4 py-4">Salary</th>
                                    <th className="w-[10%] px-4 py-4">Status</th>
                                    <th className="w-[9%] px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {jobsLoading && <EmptyRow colSpan={7} text="Loading job postings..." />}
                                {jobsError && <EmptyRow colSpan={7} text="Unable to load job postings." danger />}
                                {jobs.map((job) => (
                                    <tr key={job._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                        <td className="px-4 py-4"><p className="truncate font-semibold text-white">{job.title}</p><p className="mt-1 truncate text-xs text-white/42">{job.description || "No description"}</p></td>
                                        <td className="px-4 py-4 text-white/65">{job.department}</td>
                                        <td className="truncate px-4 py-4 text-white/65">{job.location}</td>
                                        <td className="px-4 py-4 text-white/65">{job.employmentType}</td>
                                        <td className="px-4 py-4 text-white/65">{job.salaryRange || "-"}</td>
                                        <td className="px-4 py-4"><Badge value={job.status} /></td>
                                        <td className="px-4 py-4 text-right"><RowActions onEdit={() => openEditJob(job)} onArchive={() => archiveJobMutation.mutate(job._id)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataShell>
                ) : (
                    <DataShell footer={`Showing ${applicants.length} applicant${applicants.length === 1 ? "" : "s"}`}>
                        <table className="w-full min-w-[78rem] table-fixed border-separate border-spacing-0 text-left">
                            <thead className="sticky top-0 z-10 bg-[#11151f] text-[0.74rem] font-medium text-white/65 shadow-[12px_0_0_#11151f]">
                                <tr>
                                    <th className="w-[19%] px-4 py-4">Applicant</th>
                                    <th className="w-[18%] px-4 py-4">Job</th>
                                    <th className="w-[13%] px-4 py-4">Phone</th>
                                    <th className="w-[12%] px-4 py-4">Source</th>
                                    <th className="w-[13%] px-4 py-4">Stage</th>
                                    <th className="w-[10%] px-4 py-4">Rating</th>
                                    <th className="w-[8%] px-4 py-4">Resume</th>
                                    <th className="w-[7%] px-4 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {applicantsLoading && <EmptyRow colSpan={8} text="Loading applicants..." />}
                                {applicantsError && <EmptyRow colSpan={8} text="Unable to load applicants." danger />}
                                {applicants.map((applicant) => (
                                    <tr key={applicant._id} className="text-sm text-white/80 transition hover:bg-white/[0.035]">
                                        <td className="px-4 py-4"><p className="truncate font-semibold text-white">{applicant.name}</p><p className="mt-1 truncate text-xs text-white/42">{applicant.email || "No email"}</p></td>
                                        <td className="truncate px-4 py-4 text-white/65">{applicant.jobPosting?.title || "No job selected"}</td>
                                        <td className="px-4 py-4 text-white/65">{applicant.phone || "-"}</td>
                                        <td className="px-4 py-4 text-white/65">{applicant.source}</td>
                                        <td className="px-4 py-4">
                                            <select className="h-9 rounded-lg border border-white/10 bg-[#0d1018] px-2 text-xs font-semibold text-white outline-none" value={applicant.stage} onChange={(event) => updateStageMutation.mutate({ id: applicant._id, stage: event.target.value as ApplicantStage })}>
                                                {applicantStages.map((stage) => <option key={stage}>{stage}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-4 text-white/65">{applicant.rating}/5</td>
                                        <td className="px-4 py-4">{applicant.resumeUrl ? <a className="text-[#b78cff] hover:text-white" href={applicant.resumeUrl} target="_blank" rel="noreferrer">View</a> : "-"}</td>
                                        <td className="px-4 py-4 text-right"><RowActions onEdit={() => openEditApplicant(applicant)} onArchive={() => archiveApplicantMutation.mutate(applicant._id)} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </DataShell>
                )}

                {jobModal && (
                    <JobModal form={jobForm} setForm={setJobForm} title={jobModal.mode === "add" ? "Add Job Posting" : "Edit Job Posting"} onClose={closeJobModal} onSubmit={saveJob} />
                )}

                {applicantModal && (
                    <ApplicantModal jobs={jobs} form={applicantForm} setForm={setApplicantForm} title={applicantModal.mode === "add" ? "Add Applicant" : "Edit Applicant"} onClose={closeApplicantModal} onSubmit={saveApplicant} />
                )}
            </section>
        </AdminLayout>
    );
}

function DataShell({ children, footer }: { children: React.ReactNode; footer: string }) {
    return (
        <section className="mt-5 flex h-[calc(100vh-28rem)] min-h-[34rem] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 shadow-2xl shadow-black/20">
            <div className="content-scroll min-h-0 flex-1 overflow-auto bg-[linear-gradient(to_bottom,#11151f_0,#11151f_3.25rem,transparent_3.25rem)] [scrollbar-gutter:stable]">{children}</div>
            <div className="flex min-h-14 items-center justify-between border-t border-white/10 px-4 py-3">
                <p className="text-xs text-white/45">{footer}</p>
                <span className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-semibold text-white/55">HR</span>
            </div>
        </section>
    );
}

function RowActions({ onEdit, onArchive }: { onEdit: () => void; onArchive: () => void }) {
    return (
        <div className="flex justify-end gap-1.5">
            <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white" type="button" onClick={onEdit}><FiEdit2 className="size-4" /></button>
            <button className="flex size-8 items-center justify-center rounded-lg border border-red-400/15 bg-red-400/10 text-red-100/60 transition hover:bg-red-400/15 hover:text-red-100" type="button" onClick={onArchive}><FiTrash2 className="size-4" /></button>
        </div>
    );
}

function EmptyRow({ colSpan, text, danger = false }: { colSpan: number; text: string; danger?: boolean }) {
    return <tr><td className={`px-4 py-8 text-center text-sm ${danger ? "text-red-200" : "text-white/45"}`} colSpan={colSpan}>{text}</td></tr>;
}

function JobModal({ title, form, setForm, onClose, onSubmit }: { title: string; form: JobPostingInput; setForm: React.Dispatch<React.SetStateAction<JobPostingInput>>; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
    return (
        <Modal title={title} subtitle="Create and publish job openings." onClose={onClose} onSubmit={onSubmit}>
            <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.title} onChange={(event) => setForm((job) => ({ ...job, title: event.target.value }))} placeholder="Job title" />
            <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.department} onChange={(event) => setForm((job) => ({ ...job, department: event.target.value }))} placeholder="Department" />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.location} onChange={(event) => setForm((job) => ({ ...job, location: event.target.value }))} placeholder="Location" />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.employmentType} onChange={(event) => setForm((job) => ({ ...job, employmentType: event.target.value }))} placeholder="Full-time" />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.salaryRange} onChange={(event) => setForm((job) => ({ ...job, salaryRange: event.target.value }))} placeholder="$50k - $70k" />
            </div>
            <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={form.status} onChange={(event) => setForm((job) => ({ ...job, status: event.target.value as JobStatus }))}>
                {jobStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <textarea className="min-h-24 rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none" value={form.description} onChange={(event) => setForm((job) => ({ ...job, description: event.target.value }))} placeholder="Description" />
            <textarea className="min-h-24 rounded-lg border border-white/10 bg-black/20 p-3 text-sm font-semibold text-white outline-none" value={form.requirements} onChange={(event) => setForm((job) => ({ ...job, requirements: event.target.value }))} placeholder="Requirements" />
        </Modal>
    );
}

function ApplicantModal({ title, jobs, form, setForm, onClose, onSubmit }: { title: string; jobs: JobPosting[]; form: ApplicantInput; setForm: React.Dispatch<React.SetStateAction<ApplicantInput>>; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
    return (
        <Modal title={title} subtitle="Add or update applicant information." onClose={onClose} onSubmit={onSubmit}>
            <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.name} onChange={(event) => setForm((applicant) => ({ ...applicant, name: event.target.value }))} placeholder="Applicant name" />
            <div className="grid gap-3 sm:grid-cols-2">
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.email} onChange={(event) => setForm((applicant) => ({ ...applicant, email: event.target.value }))} placeholder="Email" />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.phone} onChange={(event) => setForm((applicant) => ({ ...applicant, phone: event.target.value }))} placeholder="Phone" />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.source} onChange={(event) => setForm((applicant) => ({ ...applicant, source: event.target.value }))} placeholder="LinkedIn, Referral..." />
                <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" type="number" min="0" max="5" value={form.rating} onChange={(event) => setForm((applicant) => ({ ...applicant, rating: Number(event.target.value) }))} placeholder="Rating" />
            </div>
            <input className="h-11 rounded-lg border border-white/10 bg-black/20 px-3 text-sm font-semibold text-white outline-none" value={form.resumeUrl} onChange={(event) => setForm((applicant) => ({ ...applicant, resumeUrl: event.target.value }))} placeholder="Resume URL" />
            <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={form.jobPosting || ""} onChange={(event) => setForm((applicant) => ({ ...applicant, jobPosting: event.target.value || null }))}>
                <option value="">No job selected</option>
                {jobs.map((job) => <option key={job._id} value={job._id}>{job.title}</option>)}
            </select>
            <select className="h-11 rounded-lg border border-white/10 bg-[#0d1018] px-3 text-sm font-semibold text-white outline-none" value={form.stage} onChange={(event) => setForm((applicant) => ({ ...applicant, stage: event.target.value as ApplicantStage }))}>
                {applicantStages.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
        </Modal>
    );
}

function Modal({ title, subtitle, children, onClose, onSubmit }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
    return (
        <div className="modal-backdrop-enter fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
            <form className="modal-panel-enter flex max-h-[88vh] w-full max-w-[38rem] flex-col rounded-lg border border-white/10 bg-[#0d1018] shadow-2xl shadow-black/40" onSubmit={onSubmit}>
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                    <div>
                        <h3 className="text-base font-semibold text-white">{title}</h3>
                        <p className="mt-1 text-sm text-white/45">{subtitle}</p>
                    </div>
                    <button className="flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/60" type="button" onClick={onClose}><FiX /></button>
                </div>
                <div className="content-scroll grid gap-4 overflow-y-auto p-5">{children}</div>
                <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">
                    <button className="h-10 rounded-lg border border-white/10 bg-white/[0.05] px-4 text-sm font-semibold text-white/60" type="button" onClick={onClose}>Cancel</button>
                    <button className="h-10 rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] px-4 text-sm font-semibold text-white" type="submit">Save</button>
                </div>
            </form>
        </div>
    );
}
