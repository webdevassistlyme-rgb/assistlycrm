// import { api } from "../lib/api";

import { api } from "../lib/api";

// export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
// export type ApplicantStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

// export type JobPosting = {
//     _id: string;
//     title: string;
//     department: string;
//     location: string;
//     employmentType: string;
//     salaryRange: string;
//     description: string;
//     requirements: string;
//     status: JobStatus;
//     createdAt?: string;
//     updatedAt?: string;
// };

// export type Applicant = {
//     _id: string;
//     jobPosting: JobPosting | null;
//     name: string;
//     email: string;
//     phone: string;
//     resumeUrl: string;
//     source: string;
//     stage: ApplicantStage;
//     rating: number;
//     notes: Array<{ _id?: string; authorName: string; body: string; createdAt: string }>;
//     createdAt?: string;
//     updatedAt?: string;
// };

// export type JobPostingInput = Omit<JobPosting, "_id" | "createdAt" | "updatedAt">;
// export type ApplicantInput = Omit<Applicant, "_id" | "jobPosting" | "notes" | "createdAt" | "updatedAt"> & {
//     jobPosting: string | null;
// };

// export async function getJobPostings(params: { search?: string; status?: string; archived?: boolean } = {}) {
//     const response = await api.get<JobPosting[]>("/hr/jobs", { params });
//     return response.data;
// }

// export async function createJobPosting(job: JobPostingInput) {
//     const response = await api.post<JobPosting>("/hr/jobs", job);
//     return response.data;
// }

// export async function updateJobPosting(id: string, job: JobPostingInput) {
//     const response = await api.put<JobPosting>(`/hr/jobs/${id}`, job);
//     return response.data;
// }

// export async function archiveJobPosting(id: string) {
//     const response = await api.patch<JobPosting>(`/hr/jobs/${id}/archive`);
//     return response.data;
// }

// export async function getApplicants(params: { search?: string; stage?: string; jobPosting?: string; archived?: boolean } = {}) {
//     const response = await api.get<Applicant[]>("/hr/applicants", { params });
//     return response.data;
// }

// export async function createApplicant(applicant: ApplicantInput) {
//     const response = await api.post<Applicant>("/hr/applicants", applicant);
//     return response.data;
// }

// export async function updateApplicant(id: string, applicant: ApplicantInput) {
//     const response = await api.put<Applicant>(`/hr/applicants/${id}`, applicant);
//     return response.data;
// }

// export async function updateApplicantStage(id: string, stage: ApplicantStage) {
//     const response = await api.patch<Applicant>(`/hr/applicants/${id}/stage`, { stage });
//     return response.data;
// }

// export async function addApplicantNote(id: string, body: string) {
//     const response = await api.post<Applicant>(`/hr/applicants/${id}/notes`, { body, authorName: "Admin" });
//     return response.data;
// }

// export async function archiveApplicant(id: string) {
//     const response = await api.patch<Applicant>(`/hr/applicants/${id}/archive`);
//     return response.data;
// }

export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
export type ApplicantStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

export type JobPosting = {
    _id: string;
    title: string;
    department: string;
    location: string;
    employmentType: string;
    salaryRange: string;
    description: string;
    summary: string;
    applyEyebrow: string;
    level: string;
    skills: string[];
    responsibilities: string[];
    requirements: string[];
    niceToHave: string[];
    whatYouWillBuild: string[];
    status: JobStatus;
    isArchived: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type JobPostingInput = {
    title: string;
    department: string;
    location: string;
    employmentType: string;
    salaryRange: string;
    description: string;
    summary?: string;
    applyEyebrow?: string;
    level?: string;
    skills?: string[];
    responsibilities?: string[];
    requirements: string[];
    niceToHave?: string[];
    whatYouWillBuild?: string[];
    status: JobStatus;
};

export type Applicant = {
    _id: string;
    jobPosting: JobPosting | null;
    name: string;
    email: string;
    phone: string;
    resumeUrl: string;
    source: string;
    stage: ApplicantStage;
    rating: number;
    notes: {
        authorName: string;
        body: string;
        createdAt: string;
    }[];
    isArchived: boolean;
    createdAt?: string;
    updatedAt?: string;
};

export type ApplicantInput = {
    jobPosting: string | null;
    name: string;
    email: string;
    phone: string;
    resumeUrl: string;
    source: string;
    stage: ApplicantStage;
    rating: number;
};

export async function getJobPostings(params: { search?: string; status?: string; archived?: boolean } = {}) {
    const response = await api.get<JobPosting[]>("/hr/jobs", { params });
    return response.data;
}

export async function createJobPosting(job: JobPostingInput) {
    const response = await api.post<JobPosting>("/hr/jobs", job);
    return response.data;
}

export async function updateJobPosting(id: string, job: JobPostingInput) {
    const response = await api.put<JobPosting>(`/hr/jobs/${id}`, job);
    return response.data;
}

export async function archiveJobPosting(id: string) {
    const response = await api.patch<JobPosting>(`/hr/jobs/${id}/archive`);
    return response.data;
}

export async function permanentlyDeleteJobPosting(id: string) {
    const response = await api.delete<JobPosting>(`/hr/jobs/${id}/permanent`);
    return response.data;
}

export async function getApplicants(params: { search?: string; stage?: string; jobPosting?: string; archived?: boolean } = {}) {
    const response = await api.get<Applicant[]>("/hr/applicants", { params });
    return response.data;
}

export async function createApplicant(applicant: ApplicantInput) {
    const response = await api.post<Applicant>("/hr/applicants", applicant);
    return response.data;
}

export async function updateApplicant(id: string, applicant: ApplicantInput) {
    const response = await api.put<Applicant>(`/hr/applicants/${id}`, applicant);
    return response.data;
}

export async function updateApplicantStage(id: string, stage: ApplicantStage) {
    const response = await api.patch<Applicant>(`/hr/applicants/${id}/stage`, { stage });
    return response.data;
}

export async function addApplicantNote(id: string, note: { authorName?: string; body: string }) {
    const response = await api.post<Applicant>(`/hr/applicants/${id}/notes`, note);
    return response.data;
}

export async function archiveApplicant(id: string) {
    const response = await api.patch<Applicant>(`/hr/applicants/${id}/archive`);
    return response.data;
}

export async function permanentlyDeleteApplicant(id: string) {
    const response = await api.delete<Applicant>(`/hr/applicants/${id}/permanent`);
    return response.data;
}
