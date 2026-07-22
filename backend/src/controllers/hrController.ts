// import type { Request, Response } from "express";
// import { Applicant, JobPosting, type ApplicantStage, type JobStatus } from "../models/Hr";

// const populateApplicant = ["jobPosting"];
// const jobStatuses: JobStatus[] = ["Draft", "Open", "Paused", "Closed"];
// const applicantStages: ApplicantStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

// function cleanJobStatus(value: unknown) {
//   return jobStatuses.includes(value as JobStatus) ? (value as JobStatus) : "Draft";
// }

// function cleanApplicantStage(value: unknown) {
//   return applicantStages.includes(value as ApplicantStage) ? (value as ApplicantStage) : "Applied";
// }

// export async function listJobPostings(request: Request, response: Response) {
//   const search = String(request.query.search || "").trim();
//   const status = String(request.query.status || "").trim();
//   const archived = String(request.query.archived || "").trim() === "true";
//   const filter: Record<string, unknown> = { isArchived: archived };

//   if (jobStatuses.includes(status as JobStatus)) filter.status = status;
//   if (search) {
//     filter.$or = [
//       { title: { $regex: search, $options: "i" } },
//       { department: { $regex: search, $options: "i" } },
//       { location: { $regex: search, $options: "i" } },
//     ];
//   }

//   const jobs = await JobPosting.find(filter).sort({ createdAt: -1 });
//   response.json(jobs);
// }

// export async function createJobPosting(request: Request, response: Response) {
//   const job = await JobPosting.create({
//     title: request.body.title,
//     department: request.body.department || "General",
//     location: request.body.location || "Remote",
//     employmentType: request.body.employmentType || "Full-time",
//     salaryRange: request.body.salaryRange || "",
//     description: request.body.description || "",
//     requirements: request.body.requirements || "",
//     status: cleanJobStatus(request.body.status),
//   });

//   response.status(201).json(job);
// }

// export async function updateJobPosting(request: Request, response: Response) {
//   const job = await JobPosting.findByIdAndUpdate(
//     request.params.id,
//     {
//       title: request.body.title,
//       department: request.body.department || "General",
//       location: request.body.location || "Remote",
//       employmentType: request.body.employmentType || "Full-time",
//       salaryRange: request.body.salaryRange || "",
//       description: request.body.description || "",
//       requirements: request.body.requirements || "",
//       status: cleanJobStatus(request.body.status),
//     },
//     { returnDocument: "after", runValidators: true }
//   );

//   if (!job) {
//     response.status(404).json({ message: "Job posting not found" });
//     return;
//   }

//   response.json(job);
// }

// export async function archiveJobPosting(request: Request, response: Response) {
//   const job = await JobPosting.findByIdAndUpdate(request.params.id, { isArchived: true }, { returnDocument: "after" });

//   if (!job) {
//     response.status(404).json({ message: "Job posting not found" });
//     return;
//   }

//   response.json(job);
// }

// export async function listApplicants(request: Request, response: Response) {
//   const search = String(request.query.search || "").trim();
//   const stage = String(request.query.stage || "").trim();
//   const jobPosting = String(request.query.jobPosting || "").trim();
//   const archived = String(request.query.archived || "").trim() === "true";
//   const filter: Record<string, unknown> = { isArchived: archived };

//   if (applicantStages.includes(stage as ApplicantStage)) filter.stage = stage;
//   if (jobPosting) filter.jobPosting = jobPosting;
//   if (search) {
//     filter.$or = [
//       { name: { $regex: search, $options: "i" } },
//       { email: { $regex: search, $options: "i" } },
//       { phone: { $regex: search, $options: "i" } },
//       { source: { $regex: search, $options: "i" } },
//     ];
//   }

//   const applicants = await Applicant.find(filter).populate(populateApplicant).sort({ createdAt: -1 });
//   response.json(applicants);
// }

// export async function createApplicant(request: Request, response: Response) {
//   const applicant = await Applicant.create({
//     jobPosting: request.body.jobPosting || null,
//     name: request.body.name,
//     email: request.body.email || "",
//     phone: request.body.phone || "",
//     resumeUrl: request.body.resumeUrl || "",
//     source: request.body.source || "Manual",
//     stage: cleanApplicantStage(request.body.stage),
//     rating: Number(request.body.rating || 0),
//   });

//   response.status(201).json(await Applicant.findById(applicant._id).populate(populateApplicant));
// }

// export async function updateApplicant(request: Request, response: Response) {
//   const applicant = await Applicant.findByIdAndUpdate(
//     request.params.id,
//     {
//       jobPosting: request.body.jobPosting || null,
//       name: request.body.name,
//       email: request.body.email || "",
//       phone: request.body.phone || "",
//       resumeUrl: request.body.resumeUrl || "",
//       source: request.body.source || "Manual",
//       stage: cleanApplicantStage(request.body.stage),
//       rating: Number(request.body.rating || 0),
//     },
//     { returnDocument: "after", runValidators: true }
//   ).populate(populateApplicant);

//   if (!applicant) {
//     response.status(404).json({ message: "Applicant not found" });
//     return;
//   }

//   response.json(applicant);
// }

// export async function updateApplicantStage(request: Request, response: Response) {
//   const applicant = await Applicant.findByIdAndUpdate(
//     request.params.id,
//     { stage: cleanApplicantStage(request.body.stage) },
//     { returnDocument: "after", runValidators: true }
//   ).populate(populateApplicant);

//   if (!applicant) {
//     response.status(404).json({ message: "Applicant not found" });
//     return;
//   }

//   response.json(applicant);
// }

// export async function addApplicantNote(request: Request, response: Response) {
//   const body = String(request.body.body || "").trim();

//   if (!body) {
//     response.status(400).json({ message: "Note body is required" });
//     return;
//   }

//   const applicant = await Applicant.findByIdAndUpdate(
//     request.params.id,
//     {
//       $push: {
//         notes: {
//           authorName: request.body.authorName || "Admin",
//           body,
//           createdAt: new Date(),
//         },
//       },
//     },
//     { returnDocument: "after", runValidators: true }
//   ).populate(populateApplicant);

//   if (!applicant) {
//     response.status(404).json({ message: "Applicant not found" });
//     return;
//   }

//   response.json(applicant);
// }

// export async function archiveApplicant(request: Request, response: Response) {
//   const applicant = await Applicant.findByIdAndUpdate(request.params.id, { isArchived: true }, { returnDocument: "after" }).populate(populateApplicant);

//   if (!applicant) {
//     response.status(404).json({ message: "Applicant not found" });
//     return;
//   }

//   response.json(applicant);
// }

import type { Request, Response } from "express";
import { Applicant, JobPosting, type ApplicantStage, type JobStatus } from "../models/Hr";

const populateApplicant = ["jobPosting"];
const jobStatuses: JobStatus[] = ["Draft", "Open", "Paused", "Closed"];
const applicantStages: ApplicantStage[] = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

function cleanJobStatus(value: unknown) {
  return jobStatuses.includes(value as JobStatus) ? (value as JobStatus) : "Draft";
}

function cleanApplicantStage(value: unknown) {
  return applicantStages.includes(value as ApplicantStage) ? (value as ApplicantStage) : "Applied";
}

function cleanString(value: unknown, fallback = "") {
  const cleanValue = String(value || "").trim();
  return cleanValue || fallback;
}

function cleanStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function cleanSkillList(value: unknown) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => String(item || "").split(/[\n,]/)).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
  }

  return [];
}

function buildJobPostingPayload(body: Record<string, unknown>) {
  return {
    title: cleanString(body.title),
    department: cleanString(body.department, "General"),
    location: cleanString(body.location, "Remote"),
    employmentType: cleanString(body.employmentType, "Full-time"),
    salaryRange: cleanString(body.salaryRange),
    description: cleanString(body.description),
    summary: cleanString(body.summary),
    applyEyebrow: cleanString(body.applyEyebrow),
    level: cleanString(body.level),
    skills: cleanSkillList(body.skills ?? body.tags ?? body.skillsTags),
    responsibilities: cleanStringList(body.responsibilities),
    requirements: cleanStringList(body.requirements),
    niceToHave: cleanStringList(body.niceToHave),
    whatYouWillBuild: cleanStringList(body.whatYouWillBuild),
    status: cleanJobStatus(body.status),
  };
}

export async function listJobPostings(request: Request, response: Response) {
  const search = String(request.query.search || "").trim();
  const status = String(request.query.status || "").trim();
  const archived = String(request.query.archived || "").trim() === "true";
  const filter: Record<string, unknown> = { isArchived: archived };

  if (jobStatuses.includes(status as JobStatus)) filter.status = status;
  if (search) {
    const searchRegex = { $regex: search, $options: "i" };
    filter.$or = [
      { title: searchRegex },
      { department: searchRegex },
      { location: searchRegex },
      { employmentType: searchRegex },
      { salaryRange: searchRegex },
      { description: searchRegex },
      { summary: searchRegex },
      { applyEyebrow: searchRegex },
      { level: searchRegex },
      { skills: searchRegex },
      { responsibilities: searchRegex },
      { requirements: searchRegex },
      { niceToHave: searchRegex },
      { whatYouWillBuild: searchRegex },
    ];
  }

  const jobs = await JobPosting.find(filter).sort({ createdAt: -1 });
  response.json(jobs);
}

export async function createJobPosting(request: Request, response: Response) {
  const payload = buildJobPostingPayload(request.body || {});

  if (!payload.title) {
    response.status(400).json({ message: "Job title is required" });
    return;
  }

  const job = await JobPosting.create(payload);
  response.status(201).json(job);
}

export async function updateJobPosting(request: Request, response: Response) {
  const payload = buildJobPostingPayload(request.body || {});

  if (!payload.title) {
    response.status(400).json({ message: "Job title is required" });
    return;
  }

  const job = await JobPosting.findByIdAndUpdate(
    request.params.id,
    payload,
    { returnDocument: "after", runValidators: true }
  );

  if (!job) {
    response.status(404).json({ message: "Job posting not found" });
    return;
  }

  response.json(job);
}

export async function archiveJobPosting(request: Request, response: Response) {
  const job = await JobPosting.findByIdAndUpdate(request.params.id, { isArchived: true }, { returnDocument: "after" });

  if (!job) {
    response.status(404).json({ message: "Job posting not found" });
    return;
  }

  response.json(job);
}

export async function permanentlyDeleteJobPosting(request: Request, response: Response) {
  const job = await JobPosting.findOneAndDelete({ _id: request.params.id, isArchived: true });

  if (!job) {
    response.status(404).json({ message: "Archived job posting not found" });
    return;
  }

  response.json(job);
}

export async function listApplicants(request: Request, response: Response) {
  const search = String(request.query.search || "").trim();
  const stage = String(request.query.stage || "").trim();
  const jobPosting = String(request.query.jobPosting || "").trim();
  const archived = String(request.query.archived || "").trim() === "true";
  const filter: Record<string, unknown> = { isArchived: archived };

  if (applicantStages.includes(stage as ApplicantStage)) filter.stage = stage;
  if (jobPosting) filter.jobPosting = jobPosting;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { source: { $regex: search, $options: "i" } },
    ];
  }

  const applicants = await Applicant.find(filter).populate(populateApplicant).sort({ createdAt: -1 });
  response.json(applicants);
}

export async function createApplicant(request: Request, response: Response) {
  const applicant = await Applicant.create({
    jobPosting: request.body.jobPosting || null,
    name: request.body.name,
    email: request.body.email || "",
    phone: request.body.phone || "",
    resumeUrl: request.body.resumeUrl || "",
    source: request.body.source || "Manual",
    stage: cleanApplicantStage(request.body.stage),
    rating: Number(request.body.rating || 0),
  });

  response.status(201).json(await Applicant.findById(applicant._id).populate(populateApplicant));
}

export async function updateApplicant(request: Request, response: Response) {
  const applicant = await Applicant.findByIdAndUpdate(
    request.params.id,
    {
      jobPosting: request.body.jobPosting || null,
      name: request.body.name,
      email: request.body.email || "",
      phone: request.body.phone || "",
      resumeUrl: request.body.resumeUrl || "",
      source: request.body.source || "Manual",
      stage: cleanApplicantStage(request.body.stage),
      rating: Number(request.body.rating || 0),
    },
    { returnDocument: "after", runValidators: true }
  ).populate(populateApplicant);

  if (!applicant) {
    response.status(404).json({ message: "Applicant not found" });
    return;
  }

  response.json(applicant);
}

export async function permanentlyDeleteApplicant(request: Request, response: Response) {
  const applicant = await Applicant.findOneAndDelete({ _id: request.params.id, isArchived: true }).populate(populateApplicant);

  if (!applicant) {
    response.status(404).json({ message: "Archived applicant not found" });
    return;
  }

  response.json(applicant);
}

export async function updateApplicantStage(request: Request, response: Response) {
  const applicant = await Applicant.findByIdAndUpdate(
    request.params.id,
    { stage: cleanApplicantStage(request.body.stage) },
    { returnDocument: "after", runValidators: true }
  ).populate(populateApplicant);

  if (!applicant) {
    response.status(404).json({ message: "Applicant not found" });
    return;
  }

  response.json(applicant);
}

export async function addApplicantNote(request: Request, response: Response) {
  const body = String(request.body.body || "").trim();

  if (!body) {
    response.status(400).json({ message: "Note body is required" });
    return;
  }

  const applicant = await Applicant.findByIdAndUpdate(
    request.params.id,
    {
      $push: {
        notes: {
          authorName: request.body.authorName || "Admin",
          body,
          createdAt: new Date(),
        },
      },
    },
    { returnDocument: "after", runValidators: true }
  ).populate(populateApplicant);

  if (!applicant) {
    response.status(404).json({ message: "Applicant not found" });
    return;
  }

  response.json(applicant);
}

export async function archiveApplicant(request: Request, response: Response) {
  const applicant = await Applicant.findByIdAndUpdate(request.params.id, { isArchived: true }, { returnDocument: "after" }).populate(populateApplicant);

  if (!applicant) {
    response.status(404).json({ message: "Applicant not found" });
    return;
  }

  response.json(applicant);
}
