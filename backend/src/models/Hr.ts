// import { Schema, model, Types } from "mongoose";

// export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
// export type ApplicantStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

// export type JobPostingDocument = {
//   title: string;
//   department: string;
//   location: string;
//   employmentType: string;
//   salaryRange: string;
//   description: string;
//   requirements: string;
//   status: JobStatus;
//   isArchived: boolean;
// };

// export type ApplicantDocument = {
//   jobPosting: Types.ObjectId | null;
//   name: string;
//   email: string;
//   phone: string;
//   resumeUrl: string;
//   source: string;
//   stage: ApplicantStage;
//   rating: number;
//   notes: {
//     authorName: string;
//     body: string;
//     createdAt: Date;
//   }[];
//   isArchived: boolean;
// };

// const jobPostingSchema = new Schema<JobPostingDocument>(
//   {
//     title: { type: String, required: true, trim: true },
//     department: { type: String, trim: true, default: "General" },
//     location: { type: String, trim: true, default: "Remote" },
//     employmentType: { type: String, trim: true, default: "Full-time" },
//     salaryRange: { type: String, trim: true, default: "" },
//     description: { type: String, trim: true, default: "" },
//     requirements: { type: String, trim: true, default: "" },
//     status: { type: String, enum: ["Draft", "Open", "Paused", "Closed"], default: "Draft" },
//     isArchived: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const applicantSchema = new Schema<ApplicantDocument>(
//   {
//     jobPosting: { type: Schema.Types.ObjectId, ref: "JobPosting", default: null },
//     name: { type: String, required: true, trim: true },
//     email: { type: String, trim: true, lowercase: true, default: "" },
//     phone: { type: String, trim: true, default: "" },
//     resumeUrl: { type: String, trim: true, default: "" },
//     source: { type: String, trim: true, default: "Manual" },
//     stage: { type: String, enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"], default: "Applied" },
//     rating: { type: Number, min: 0, max: 5, default: 0 },
//     notes: {
//       type: [
//         {
//           authorName: { type: String, trim: true, default: "Admin" },
//           body: { type: String, required: true, trim: true },
//           createdAt: { type: Date, default: Date.now },
//         },
//       ],
//       default: [],
//     },
//     isArchived: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// jobPostingSchema.index({ status: 1, isArchived: 1, createdAt: -1 });
// applicantSchema.index({ jobPosting: 1, stage: 1, isArchived: 1, createdAt: -1 });

// export const JobPosting = tenantModel<JobPostingDocument>("JobPosting", jobPostingSchema);
// export const Applicant = tenantModel<ApplicantDocument>("Applicant", applicantSchema);

import { Schema, Types } from "mongoose";
import { tenantModel } from "../config/tenancy";

export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
export type ApplicantStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

export type JobPostingDocument = {
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
};

export type ApplicantDocument = {
  jobPosting: Types.ObjectId | null;
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
    createdAt: Date;
  }[];
  isArchived: boolean;
};

function cleanStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function cleanSkillArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item || "").split(/[\n,]/)).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

const textListField = {
  type: [String],
  default: [],
  set: cleanStringArray,
};

const skillsField = {
  type: [String],
  default: [],
  set: cleanSkillArray,
};

const jobPostingSchema = new Schema<JobPostingDocument>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "General" },
    location: { type: String, trim: true, default: "Remote" },
    employmentType: { type: String, trim: true, default: "Full-time" },
    salaryRange: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    summary: { type: String, trim: true, default: "" },
    applyEyebrow: { type: String, trim: true, default: "" },
    level: { type: String, trim: true, default: "" },
    skills: skillsField,
    responsibilities: textListField,
    requirements: textListField,
    niceToHave: textListField,
    whatYouWillBuild: textListField,
    status: { type: String, enum: ["Draft", "Open", "Paused", "Closed"], default: "Draft" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const applicantSchema = new Schema<ApplicantDocument>(
  {
    jobPosting: { type: Schema.Types.ObjectId, ref: "JobPosting", default: null },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    resumeUrl: { type: String, trim: true, default: "" },
    source: { type: String, trim: true, default: "Manual" },
    stage: { type: String, enum: ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"], default: "Applied" },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: {
      type: [
        {
          authorName: { type: String, trim: true, default: "Admin" },
          body: { type: String, required: true, trim: true },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

jobPostingSchema.index({ status: 1, isArchived: 1, createdAt: -1 });
jobPostingSchema.index({ title: 1, department: 1, location: 1 });
applicantSchema.index({ jobPosting: 1, stage: 1, isArchived: 1, createdAt: -1 });

export const JobPosting = tenantModel<JobPostingDocument>("JobPosting", jobPostingSchema);
export const Applicant = tenantModel<ApplicantDocument>("Applicant", applicantSchema);
