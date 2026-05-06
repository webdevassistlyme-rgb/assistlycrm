import { Schema, model, Types } from "mongoose";

export type JobStatus = "Draft" | "Open" | "Paused" | "Closed";
export type ApplicantStage = "Applied" | "Screening" | "Interview" | "Offer" | "Hired" | "Rejected";

export type JobPostingDocument = {
  title: string;
  department: string;
  location: string;
  employmentType: string;
  salaryRange: string;
  description: string;
  requirements: string;
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

const jobPostingSchema = new Schema<JobPostingDocument>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, trim: true, default: "General" },
    location: { type: String, trim: true, default: "Remote" },
    employmentType: { type: String, trim: true, default: "Full-time" },
    salaryRange: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    requirements: { type: String, trim: true, default: "" },
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
applicantSchema.index({ jobPosting: 1, stage: 1, isArchived: 1, createdAt: -1 });

export const JobPosting = model<JobPostingDocument>("JobPosting", jobPostingSchema);
export const Applicant = model<ApplicantDocument>("Applicant", applicantSchema);
