import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Employee } from "../models/Employee";
import { Lead } from "../models/Lead";
import { scoreLeadsByPotential } from "../services/leadScoringService";
import { searchAllGooglePlaces, searchGooglePlaces, type GooglePlaceLead } from "../services/googlePlacesService";

const populateLead = ["assignedAgent", "assignedTeam"];
const AUTO_ASSIGNMENT_BATCH_SIZE = 100;
const AUTO_ASSIGNMENT_INTERVAL_MS = 24 * 60 * 60 * 1000;
let leadAutoAssignmentTimer: NodeJS.Timeout | null = null;

type PopulatedLead = Awaited<ReturnType<typeof Lead.find>>[number];
type AssignmentCandidate = {
  _id: Types.ObjectId;
  assignedCount: number;
};

const leadStatuses = ["NEW", "Follow up", "Ongoing comms", "Qualified", "Ongoing Negotiation", "Dead", "Archived"] as const;

type ImportedLead = {
  leadName: string;
  position: string;
  businessName: string;
  businessAddress: string;
  email: string;
  phone: string;
  website: string;
  source: string;
  category: string;
  status: (typeof leadStatuses)[number];
  assignedAgent: null;
  autoAssignedAt: null;
  assignedTeam: null;
  googlePlaceId: string;
  notes: string;
  followUpAt: null;
  followUpNote: string;
  followUpPriority: number;
  aiScore: number;
  aiScoreReason: string;
  aiScoreSource: string;
  aiScoredAt: null;
  assignedToName: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function normalizeLeadValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeLeadStatus(value: unknown): (typeof leadStatuses)[number] {
  const normalizedValue = normalizeLeadValue(String(value || ""));
  const statusMap: Record<string, (typeof leadStatuses)[number]> = {
    new: "NEW",
    followup: "Follow up",
    "follow up": "Follow up",
    follow_up: "Follow up",
    ongoing: "Ongoing comms",
    "ongoing comms": "Ongoing comms",
    contacted: "Ongoing comms",
    qualified: "Qualified",
    negotiation: "Ongoing Negotiation",
    "ongoing negotiation": "Ongoing Negotiation",
    dead: "Dead",
    lost: "Dead",
    archived: "Archived",
  };

  return statusMap[normalizedValue] || "NEW";
}

function parseOptionalDate(value: unknown) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return null;
  }

  const parsedDate = new Date(rawValue);

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function flexibleExactRegex(value: string) {
  const normalizedValue = normalizeLeadValue(value);
  const pattern = normalizedValue.split(" ").map(escapeRegex).join("\\s+");

  return new RegExp(`^\\s*${pattern}\\s*$`, "i");
}

function getLeadDuplicateFilters(lead: {
  googlePlaceId?: string;
  businessName?: string;
  businessAddress?: string;
  source?: string;
  category?: string;
  phone?: string;
  website?: string;
}) {
  const filters: Record<string, unknown>[] = [];
  const googlePlaceId = String(lead.googlePlaceId || "").trim();
  const businessName = String(lead.businessName || "").trim();
  const businessAddress = String(lead.businessAddress || "").trim();
  const phone = String(lead.phone || "").trim();
  const website = String(lead.website || "").trim();

  if (googlePlaceId) {
    filters.push({ googlePlaceId });
  }

  if (businessName && businessAddress) {
    filters.push({
      businessName: flexibleExactRegex(businessName),
      businessAddress: flexibleExactRegex(businessAddress),
    });
  }

  if (phone) {
    filters.push({ phone: flexibleExactRegex(phone) });
  }

  if (website) {
    filters.push({ website: flexibleExactRegex(website) });
  }

  return filters;
}

async function findDuplicateLead(
  lead: {
    googlePlaceId?: string;
    businessName?: string;
    businessAddress?: string;
    source?: string;
    phone?: string;
    website?: string;
  },
  excludeId = ""
) {
  const filters = getLeadDuplicateFilters(lead);

  if (filters.length === 0) {
    return null;
  }

  const query: Record<string, unknown> = {
    $or: filters,
    status: { $ne: "Archived" },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Lead.findOne(query).populate(populateLead).sort({ createdAt: -1 });
}

function getLeadDedupKey(lead: {
  googlePlaceId?: string;
  businessName?: string;
  businessAddress?: string;
  source?: string;
}) {
  if (lead.googlePlaceId) {
    return `place:${lead.googlePlaceId}`;
  }

  const businessName = normalizeLeadValue(lead.businessName || "");
  const businessAddress = normalizeLeadValue(lead.businessAddress || "");
  const source = normalizeLeadValue(lead.source || "");

  return `business:${businessName}|${businessAddress}|${source}`;
}

function dedupeLeads<T extends PopulatedLead>(leads: T[]) {
  const leadsByKey = new Map<string, T>();

  leads.forEach((lead) => {
    const key = getLeadDedupKey(lead);

    if (!leadsByKey.has(key)) {
      leadsByKey.set(key, lead);
    }
  });

  return Array.from(leadsByKey.values());
}

function dedupePlaces(places: GooglePlaceLead[]) {
  const placesByKey = new Map<string, GooglePlaceLead>();

  places.forEach((place) => {
    const googlePlaceId = place.googlePlaceId || "";
    const businessName = normalizeLeadValue(place.businessName || "");
    const businessAddress = normalizeLeadValue(place.businessAddress || "");
    const key = googlePlaceId ? `place:${googlePlaceId}` : `business:${businessName}|${businessAddress}|google places`;

    if (!placesByKey.has(key)) {
      placesByKey.set(key, place);
    }
  });

  return Array.from(placesByKey.values());
}

function getAutoSearchTargets(product: string) {
  const normalizedProduct = normalizeLeadValue(product);

  if (normalizedProduct.includes("popcorn") && normalizedProduct.includes("vending")) {
    return [
      { query: "movie theaters", fit: "cinemas already sell popcorn and have heavy snack traffic" },
      { query: "shopping malls", fit: "malls have repeat foot traffic and unattended vending placement areas" },
      { query: "arcades", fit: "arcades attract families and impulse snack buyers" },
      { query: "bowling alleys", fit: "bowling venues have long dwell time and snack demand" },
      { query: "family entertainment centers", fit: "family entertainment centers match casual snack vending" },
      { query: "trampoline parks", fit: "trampoline parks attract kids and parents with concession demand" },
      { query: "roller skating rinks", fit: "skating rinks have snack breaks and group visits" },
      { query: "event venues", fit: "event venues support grab-and-go concessions" },
      { query: "college student centers", fit: "student centers have high daily vending traffic" },
      { query: "laundromats", fit: "laundromats have wait time and unattended vending potential" },
    ];
  }

  return [
    { query: `${product} buyers`, fit: "direct product match" },
    { query: "shopping malls", fit: "high foot traffic" },
    { query: "family entertainment centers", fit: "consumer venue fit" },
    { query: "event venues", fit: "commercial placement opportunity" },
    { query: "retail stores", fit: "retail buyer profile" },
  ];
}

function getProductFitScore(lead: { businessName: string; category: string; phone: string; website: string }, product: string) {
  const text = `${lead.businessName} ${lead.category}`.toLowerCase();
  let score = 48;
  const reasons: string[] = [];

  if (product.toLowerCase().includes("popcorn")) {
    const highFitKeywords = ["movie", "cinema", "theater", "arcade", "bowling", "entertainment", "trampoline", "skating"];
    const mediumFitKeywords = ["mall", "event", "student", "college", "laundromat", "family"];

    if (highFitKeywords.some((keyword) => text.includes(keyword))) {
      score += 28;
      reasons.push("strong popcorn vending venue fit");
    } else if (mediumFitKeywords.some((keyword) => text.includes(keyword))) {
      score += 18;
      reasons.push("good foot-traffic placement fit");
    }
  }

  if (lead.phone) {
    score += 10;
    reasons.push("phone available");
  }

  if (lead.website) {
    score += 8;
    reasons.push("website available");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reason: reasons.slice(0, 3).join(", ") || "auto-matched by product lead search",
  };
}

function getFollowUpBucket(lead: { followUpAt?: Date | string | null }) {
  if (!lead.followUpAt) {
    return 0;
  }

  const followUpTime = new Date(lead.followUpAt).getTime();

  if (Number.isNaN(followUpTime)) {
    return 0;
  }

  const now = Date.now();

  if (followUpTime <= now) {
    return 3;
  }

  if (followUpTime <= now + AUTO_ASSIGNMENT_INTERVAL_MS) {
    return 2;
  }

  return 1;
}

function sortLeadsByFollowUpPriority<T extends { followUpAt?: Date | string | null; followUpPriority?: number; createdAt?: Date }>(leads: T[]) {
  return [...leads].sort((first, second) => {
    const bucketDelta = getFollowUpBucket(second) - getFollowUpBucket(first);

    if (bucketDelta !== 0) {
      return bucketDelta;
    }

    if (first.followUpAt && second.followUpAt) {
      const followUpTimeDelta = new Date(first.followUpAt).getTime() - new Date(second.followUpAt).getTime();

      if (followUpTimeDelta !== 0) {
        return followUpTimeDelta;
      }
    }

    const priorityDelta = (second.followUpPriority || 0) - (first.followUpPriority || 0);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
  });
}

async function createAssignmentCandidates(excludedAgentIds: string[] = []): Promise<AssignmentCandidate[]> {
  const excludedIds = excludedAgentIds.filter(Boolean);
  const employees = await Employee.find({
    status: "Active",
    $or: [{ role: /sales/i }, { team: /sales/i }],
    ...(excludedIds.length > 0 ? { _id: { $nin: excludedIds } } : {}),
  }).sort({ createdAt: 1 });

  if (employees.length === 0) {
    return [];
  }

  const assignmentCounts = await Lead.aggregate<{ _id: unknown; count: number }>([
    { $match: { status: { $ne: "Archived" }, assignedAgent: { $ne: null } } },
    { $group: { _id: "$assignedAgent", count: { $sum: 1 } } },
  ]);
  const countsByEmployeeId = new Map(assignmentCounts.map((item) => [String(item._id), item.count]));

  return employees.map((employee) => ({
    _id: employee._id,
    assignedCount: countsByEmployeeId.get(String(employee._id)) || 0,
  }));
}

function pickAssignmentCandidate(candidates: AssignmentCandidate[]): Types.ObjectId | null {
  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((first, second) => first.assignedCount - second.assignedCount || String(first._id).localeCompare(String(second._id)));
  const candidate = candidates[0];
  candidate.assignedCount += 1;

  return candidate._id;
}

export async function runLeadAutoAssignmentBatch(limit = AUTO_ASSIGNMENT_BATCH_SIZE) {
  const assignmentCandidates = await createAssignmentCandidates();

  if (assignmentCandidates.length === 0) {
    return { assignedCount: 0, availableAgents: 0 };
  }

  const candidateLeads = await Lead.find({
    status: { $nin: ["Archived", "Dead"] },
    $or: [{ assignedAgent: null }, { assignedAgent: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .limit(limit * 5);
  const leads = sortLeadsByFollowUpPriority(candidateLeads).slice(0, limit);

  if (leads.length === 0) {
    return { assignedCount: 0, availableAgents: assignmentCandidates.length };
  }

  const assignedAt = new Date();
  const operations = leads
    .map((lead) => {
      const assignedAgent = pickAssignmentCandidate(assignmentCandidates);

      if (!assignedAgent) {
        return null;
      }

      return {
        updateOne: {
          filter: { _id: lead._id },
          update: {
            $set: {
              assignedAgent,
              autoAssignedAt: assignedAt,
            },
          },
        },
      };
    })
    .filter((operation): operation is NonNullable<typeof operation> => Boolean(operation));

  if (operations.length === 0) {
    return { assignedCount: 0, availableAgents: assignmentCandidates.length };
  }

  const result = await Lead.bulkWrite(operations, { ordered: false });

  return {
    assignedCount: result.modifiedCount,
    availableAgents: assignmentCandidates.length,
  };
}

export async function reassignLeadsFromAgent(agentId: string) {
  const normalizedAgentId = String(agentId || "").trim();

  if (!normalizedAgentId) {
    return { reassignedCount: 0, unassignedCount: 0, availableAgents: 0 };
  }

  const leads = await Lead.find({
    assignedAgent: normalizedAgentId,
    status: { $nin: ["Archived", "Dead"] },
  }).sort({ createdAt: 1 });

  if (leads.length === 0) {
    return { reassignedCount: 0, unassignedCount: 0, availableAgents: 0 };
  }

  const assignmentCandidates = await createAssignmentCandidates([normalizedAgentId]);
  const assignedAt = new Date();
  const operations = sortLeadsByFollowUpPriority(leads).map((lead) => {
    const assignedAgent = pickAssignmentCandidate(assignmentCandidates);

    return {
      updateOne: {
        filter: { _id: lead._id },
        update: {
          $set: {
            assignedAgent,
            autoAssignedAt: assignedAgent ? assignedAt : null,
          },
        },
      },
    };
  });

  const result = await Lead.bulkWrite(operations, { ordered: false });

  return {
    reassignedCount: assignmentCandidates.length > 0 ? result.modifiedCount : 0,
    unassignedCount: assignmentCandidates.length > 0 ? 0 : result.modifiedCount,
    availableAgents: assignmentCandidates.length,
  };
}

export async function reassignNewLeadsBatch(_request: Request, response: Response) {
  const leads = await Lead.find({
    status: "NEW",
  }).sort({ createdAt: 1 });

  if (leads.length === 0) {
    response.json({ reassignedCount: 0, leads: [] });
    return;
  }

  const assignmentCandidates = await createAssignmentCandidates();

  if (assignmentCandidates.length === 0) {
    response.status(400).json({ message: "No active sales agents available" });
    return;
  }

  const assignedAt = new Date();
  const operations = sortLeadsByFollowUpPriority(leads).map((lead) => {
    const assignedAgent = pickAssignmentCandidate(assignmentCandidates);

    return {
      updateOne: {
        filter: { _id: lead._id },
        update: {
          $set: {
            assignedAgent,
            autoAssignedAt: assignedAt,
          },
        },
      },
    };
  });

  const result = await Lead.bulkWrite(operations, { ordered: false });
  const updatedLeads = await Lead.find({ _id: { $in: leads.map((lead) => lead._id) } }).populate(populateLead);

  response.json({
    reassignedCount: result.modifiedCount,
    leads: sortLeadsByFollowUpPriority(updatedLeads),
  });
}

export function startLeadAutoAssignmentScheduler() {
  if (leadAutoAssignmentTimer) {
    return;
  }

  void runLeadAutoAssignmentBatch().catch((error) => {
    console.error("Lead auto-assignment failed", error);
  });

  leadAutoAssignmentTimer = setInterval(() => {
    void runLeadAutoAssignmentBatch().catch((error) => {
      console.error("Lead auto-assignment failed", error);
    });
  }, AUTO_ASSIGNMENT_INTERVAL_MS);
}

async function upsertPlacesAsLeads(places: GooglePlaceLead[], category = "") {
  const validPlaces = dedupePlaces(places).filter((place) => String(place.businessName || "").trim());
  const placeCategory = String(category || "").trim();

  if (validPlaces.length === 0) {
    return [];
  }

  const assignmentCandidates = await createAssignmentCandidates();

  await Lead.bulkWrite(
    validPlaces.map((place) => {
      const googlePlaceId = place.googlePlaceId || "";
      const businessName = String(place.businessName).trim();
      const businessAddress = place.businessAddress || "";
      const duplicateFilters = getLeadDuplicateFilters({
        googlePlaceId,
        businessName,
        businessAddress,
        phone: place.phone || "",
        website: place.website || "",
      });
      const assignedAgent = pickAssignmentCandidate(assignmentCandidates);
      const autoAssignedAt = assignedAgent ? new Date() : null;

      return {
        updateOne: {
          filter: duplicateFilters.length > 0 ? { $or: duplicateFilters } : { businessName, businessAddress, source: "Google Places" },
          update: {
            $set: {
              businessName,
              businessAddress,
              phone: place.phone || "",
              website: place.website || "",
              googlePlaceId,
              source: "Google Places",
              category: placeCategory,
            },
            $setOnInsert: {
              status: "NEW",
              assignedAgent,
              autoAssignedAt,
            },
          },
          upsert: true,
        },
      };
    }),
    { ordered: false }
  );

  const googlePlaceIds = validPlaces
    .map((place) => place.googlePlaceId)
    .filter((googlePlaceId): googlePlaceId is string => typeof googlePlaceId === "string" && Boolean(googlePlaceId));
  const fallbackFilters = validPlaces
    .filter((place) => !place.googlePlaceId)
    .map((place) => ({
      businessName: String(place.businessName).trim(),
      businessAddress: place.businessAddress || "",
      source: "Google Places",
    }));

  const leads = await Lead.find({
    $or: [
      ...(googlePlaceIds.length > 0 ? [{ googlePlaceId: { $in: googlePlaceIds } }] : []),
      ...fallbackFilters,
    ],
  })
    .populate(populateLead)
    .sort({ createdAt: -1 });

  return dedupeLeads(leads);
}

export async function listLeads(request: Request, response: Response) {
  const assignedAgent = String(request.query.assignedAgent || "").trim();
  const filter: Record<string, unknown> = { status: { $ne: "Archived" } };

  if (assignedAgent) {
    filter.assignedAgent = assignedAgent;
  }

  const leads = await Lead.find(filter)
    .populate(populateLead)
    .sort({ createdAt: -1 });
  response.json(sortLeadsByFollowUpPriority(dedupeLeads(leads)));
}

export async function scoreLeadsByHighestPotential(request: Request, response: Response) {
  const leadIds = Array.isArray(request.body.leadIds)
    ? request.body.leadIds.filter((leadId: unknown): leadId is string => typeof leadId === "string" && Boolean(leadId))
    : [];
  const query: Record<string, unknown> = { status: { $ne: "Archived" } };

  if (leadIds.length > 0) {
    query._id = { $in: leadIds };
  }

  const leads = await Lead.find(query).sort({ createdAt: -1 });
  const scores = await scoreLeadsByPotential(leads);
  const scoredAt = new Date();

  if (scores.length > 0) {
    await Lead.bulkWrite(
      scores.map((score) => ({
        updateOne: {
          filter: { _id: score.leadId },
          update: {
            $set: {
              aiScore: score.score,
              aiScoreReason: score.reason,
              aiScoreSource: score.source,
              aiScoredAt: scoredAt,
            },
          },
        },
      })),
      { ordered: false }
    );
  }

  const sortedLeadIds = scores.map((score) => score.leadId);
  const sortedLeads = await Lead.find({ _id: { $in: sortedLeadIds } }).populate(populateLead);
  const leadsById = new Map(sortedLeads.map((lead) => [String(lead._id), lead]));

  response.json({
    usedAi: scores.some((score) => score.source === "openai"),
    leads: sortedLeadIds.map((leadId) => leadsById.get(leadId)).filter(Boolean),
  });
}

export async function createLead(request: Request, response: Response) {
  const assignmentCandidates = await createAssignmentCandidates();
  const assignedAgent = request.body.assignedAgent || pickAssignmentCandidate(assignmentCandidates);
  const leadInput = {
    leadName: request.body.leadName || "",
    position: request.body.position || "",
    businessName: request.body.businessName,
    businessAddress: request.body.businessAddress || "",
    email: request.body.email || "",
    phone: request.body.phone || "",
    website: request.body.website || "",
    source: request.body.source || "Manual",
    category: request.body.category || "",
    status: request.body.status || "NEW",
    assignedAgent,
    autoAssignedAt: assignedAgent && !request.body.assignedAgent ? new Date() : null,
    assignedTeam: request.body.assignedTeam || null,
    googlePlaceId: request.body.googlePlaceId || "",
    notes: request.body.notes || "",
    followUpAt: request.body.followUpAt || null,
    followUpNote: request.body.followUpNote || "",
    followUpPriority: request.body.followUpPriority || 0,
    aiScore: request.body.aiScore || 0,
    aiScoreReason: request.body.aiScoreReason || "",
    aiScoreSource: request.body.aiScoreSource || "",
    aiScoredAt: request.body.aiScoredAt || null,
  };

  const duplicateLead = await findDuplicateLead(leadInput);

  if (duplicateLead) {
    response.status(200).json(duplicateLead);
    return;
  }

  const lead = await Lead.create(leadInput);

  const populatedLead = await Lead.findById(lead.id).populate(populateLead);
  response.status(201).json(populatedLead);
}

export async function importLeads(request: Request, response: Response) {
  const rawLeads: Array<Record<string, unknown>> = Array.isArray(request.body.leads) ? request.body.leads : [];
  const validLeads = rawLeads
    .map((lead): ImportedLead | null => {
      const businessName = String(lead.businessName || lead["Business Name"] || "").trim();

      if (!businessName) {
        return null;
      }

      const createdAt = parseOptionalDate(lead.createdAt || lead["Created At"]);

      return {
        leadName: String(lead.leadName || lead.Name || "").trim(),
        position: String(lead.position || "").trim(),
        businessName,
        businessAddress: String(lead.businessAddress || lead.Address || "").trim(),
        email: String(lead.email || lead.Email || "").trim(),
        phone: String(lead.phone || lead.Phone || "").trim(),
        website: String(lead.website || lead.Website || "").trim(),
        source: String(lead.source || lead.Source || "CSV Import").trim() || "CSV Import",
        category: String(lead.category || lead["Biz Type"] || "").trim(),
        status: normalizeLeadStatus(lead.status || lead.Status),
        assignedAgent: null,
        autoAssignedAt: null,
        assignedToName: String(lead.assignedToName || lead["Assigned To"] || "").trim(),
        assignedTeam: null,
        googlePlaceId: String(lead.googlePlaceId || "").trim(),
        notes: String(lead.notes || lead.Notes || "").trim(),
        followUpAt: null,
        followUpNote: "",
        followUpPriority: 0,
        aiScore: 0,
        aiScoreReason: "",
        aiScoreSource: "",
        aiScoredAt: null,
        ...(createdAt ? { createdAt } : {}),
      };
    })
    .filter((lead): lead is ImportedLead => Boolean(lead));

  if (validLeads.length === 0) {
    response.status(400).json({ message: "No valid leads found in import" });
    return;
  }

  const assignmentCandidates = await createAssignmentCandidates();
  const importedLeadKeys = new Set<string>();
  const dedupedLeads = validLeads.filter((lead) => {
    const key = getLeadDedupKey(lead);

    if (importedLeadKeys.has(key)) {
      return false;
    }

    importedLeadKeys.add(key);
    return true;
  });
  const assignedToNames = Array.from(new Set(dedupedLeads.map((lead) => lead.assignedToName).filter(Boolean)));
  const assignedEmployees = assignedToNames.length > 0
    ? await Employee.find({
        status: { $ne: "Archived" },
        $or: assignedToNames.map((name) => ({ name: flexibleExactRegex(name) })),
      }).select("_id name employeeCode")
    : [];
  const employeesByAssignedTo = new Map(
    assignedEmployees.flatMap((employee) => [
      [normalizeLeadValue(employee.name), employee._id],
      [normalizeLeadValue(employee.employeeCode), employee._id],
    ])
  );

  await Lead.bulkWrite(
    dedupedLeads.map((lead) => {
      const duplicateFilters = getLeadDuplicateFilters(lead);
      const importedAssignedAgent = employeesByAssignedTo.get(normalizeLeadValue(lead.assignedToName)) || null;
      const assignedAgent = importedAssignedAgent || pickAssignmentCandidate(assignmentCandidates);
      const autoAssignedAt = assignedAgent && !importedAssignedAgent ? new Date() : null;
      const { createdAt, assignedToName, ...leadFields } = lead;
      const setFields: Record<string, unknown> = {
        leadName: leadFields.leadName,
        position: leadFields.position,
        businessName: leadFields.businessName,
        businessAddress: leadFields.businessAddress,
        email: leadFields.email,
        phone: leadFields.phone,
        website: leadFields.website,
        source: leadFields.source,
        category: leadFields.category,
        notes: leadFields.notes,
        googlePlaceId: leadFields.googlePlaceId,
      };
      const noteComment = leadFields.notes
        ? {
            authorName: "CSV Import",
            authorType: "admin" as const,
            body: leadFields.notes,
            createdAt: createdAt || new Date(),
          }
        : null;

      if (importedAssignedAgent) {
        setFields.assignedAgent = importedAssignedAgent;
        setFields.autoAssignedAt = null;
      }

      return {
        updateOne: {
          filter: duplicateFilters.length > 0 ? { $or: duplicateFilters } : { businessName: lead.businessName, businessAddress: lead.businessAddress },
          update: {
            $set: setFields,
            ...(noteComment ? { $push: { comments: noteComment } } : {}),
            $setOnInsert: {
              status: leadFields.status,
              ...(!importedAssignedAgent ? { assignedAgent, autoAssignedAt } : {}),
              assignedTeam: leadFields.assignedTeam,
              followUpAt: leadFields.followUpAt,
              followUpNote: leadFields.followUpNote,
              followUpPriority: leadFields.followUpPriority,
              aiScore: leadFields.aiScore,
              aiScoreReason: leadFields.aiScoreReason,
              aiScoreSource: leadFields.aiScoreSource,
              aiScoredAt: leadFields.aiScoredAt,
              ...(createdAt ? { createdAt } : {}),
            },
          },
          upsert: true,
        },
      };
    }),
    { ordered: false }
  );

  const importedLeadFilters = dedupedLeads.flatMap((lead) => {
    const duplicateFilters = getLeadDuplicateFilters(lead);

    return duplicateFilters.length > 0 ? duplicateFilters : [{ businessName: lead.businessName, businessAddress: lead.businessAddress }];
  });
  const importedLeads = await Lead.find({
    $or: importedLeadFilters,
  })
    .populate(populateLead)
    .sort({ createdAt: -1 });

  response.status(201).json({
    importedCount: dedupedLeads.length,
    skippedCount: rawLeads.length - dedupedLeads.length,
    leads: sortLeadsByFollowUpPriority(dedupeLeads(importedLeads)),
  });
}

export async function updateLead(request: Request, response: Response) {
  const leadId = String(request.params.id);
  const leadInput = {
    leadName: request.body.leadName || "",
    position: request.body.position || "",
    businessName: request.body.businessName,
    businessAddress: request.body.businessAddress || "",
    email: request.body.email || "",
    phone: request.body.phone || "",
    website: request.body.website || "",
    source: request.body.source || "Manual",
    category: request.body.category || "",
    status: request.body.status || "NEW",
    assignedAgent: request.body.assignedAgent || null,
    assignedTeam: request.body.assignedTeam || null,
    googlePlaceId: request.body.googlePlaceId || "",
    notes: request.body.notes || "",
    followUpAt: request.body.followUpAt || null,
    followUpNote: request.body.followUpNote || "",
    followUpPriority: request.body.followUpPriority || 0,
    aiScore: request.body.aiScore || 0,
    aiScoreReason: request.body.aiScoreReason || "",
    aiScoreSource: request.body.aiScoreSource || "",
    aiScoredAt: request.body.aiScoredAt || null,
  };
  const duplicateLead = await findDuplicateLead(leadInput, leadId);

  if (duplicateLead) {
    response.status(409).json({ message: "Duplicate lead already exists", lead: duplicateLead });
    return;
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    leadInput,
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function scheduleLeadFollowUp(request: Request, response: Response) {
  const leadId = String(request.params.id);
  const followUpAt = request.body.followUpAt ? new Date(String(request.body.followUpAt)) : null;

  if (!followUpAt || Number.isNaN(followUpAt.getTime())) {
    response.status(400).json({ message: "Valid followUpAt is required" });
    return;
  }

  const lead = await Lead.findByIdAndUpdate(
    leadId,
    {
      followUpAt,
      followUpNote: request.body.followUpNote || "",
      followUpPriority: request.body.followUpPriority ?? 100,
      status: "Follow up",
    },
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function addLeadComment(request: Request, response: Response) {
  const body = String(request.body.body || "").trim();

  if (!body) {
    response.status(400).json({ message: "Comment body is required" });
    return;
  }

  const authorName = String(request.body.authorName || "Employee").trim() || "Employee";
  const authorType = request.body.authorType === "admin" ? "admin" : "employee";
  const comment = {
    authorName,
    authorType,
    body,
    createdAt: new Date(),
  };

  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    {
      $push: { comments: comment },
      $set: { notes: body },
    },
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function updateLeadStatus(request: Request, response: Response) {
  const statuses = ["NEW", "Follow up", "Ongoing comms", "Qualified", "Ongoing Negotiation", "Dead", "Archived"];
  const status = String(request.body.status || "").trim();

  if (!statuses.includes(status)) {
    response.status(400).json({ message: "Valid status is required" });
    return;
  }

  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function autoAssignLead(request: Request, response: Response) {
  const assignedAgent = pickAssignmentCandidate(await createAssignmentCandidates());

  if (!assignedAgent) {
    response.status(400).json({ message: "No active agents available" });
    return;
  }

  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    { assignedAgent, autoAssignedAt: new Date() },
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function archiveLead(request: Request, response: Response) {
  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    { status: "Archived" },
    { new: true, runValidators: true }
  ).populate(populateLead);

  if (!lead) {
    response.status(404).json({ message: "Lead not found" });
    return;
  }

  response.json(lead);
}

export async function searchPlacesForLeads(request: Request, response: Response) {
  const textQuery = String(request.body.textQuery || "").trim();
  const pageToken = String(request.body.pageToken || "").trim();

  if (!textQuery) {
    response.status(400).json({ message: "textQuery is required" });
    return;
  }

  const result = await searchGooglePlaces(textQuery, pageToken);
  response.json(result);
}

export async function importPlacesAsLeads(request: Request, response: Response) {
  const places = Array.isArray(request.body.places) ? request.body.places : [];
  const category = String(request.body.category || "").trim();
  const validPlaces = places.filter((place: GooglePlaceLead) => String(place.businessName || "").trim());

  if (validPlaces.length === 0) {
    response.status(400).json({ message: "places are required" });
    return;
  }

  const leads = await upsertPlacesAsLeads(validPlaces, category);

  response.status(201).json(leads);
}

export async function searchAndImportPlacesAsLeads(request: Request, response: Response) {
  const textQuery = String(request.body.textQuery || "").trim();
  const category = String(request.body.category || "").trim();

  if (!textQuery) {
    response.status(400).json({ message: "textQuery is required" });
    return;
  }

  const result = await searchAllGooglePlaces(textQuery);
  const places = dedupePlaces(result.places);
  const leads = await upsertPlacesAsLeads(places, category);

  response.status(201).json({
    places,
    leads,
    nextPageToken: result.nextPageToken,
  });
}

export async function autoSearchPlacesForProduct(request: Request, response: Response) {
  const product = String(request.body.product || "").trim();
  const location = String(request.body.location || "").trim();
  const maxResults = Math.min(Math.max(Number(request.body.maxResults || 10000), 1), 10000);

  if (!product) {
    response.status(400).json({ message: "product is required" });
    return;
  }

  const targets = getAutoSearchTargets(product);
  const allPlaces: GooglePlaceLead[] = [];
  const searchedQueries: string[] = [];

  for (const target of targets) {
    if (allPlaces.length >= maxResults) {
      break;
    }

    const textQuery = [target.query, location].filter(Boolean).join(" in ");
    searchedQueries.push(textQuery);

    const result = await searchAllGooglePlaces(textQuery);
    allPlaces.push(...result.places);
  }

  const places = dedupePlaces(allPlaces).slice(0, maxResults);
  const leads = await upsertPlacesAsLeads(places, product);
  const scoredAt = new Date();

  if (leads.length > 0) {
    await Lead.bulkWrite(
      leads.map((lead) => {
        const fit = getProductFitScore(
          {
            businessName: lead.businessName,
            category: lead.category,
            phone: lead.phone,
            website: lead.website,
          },
          product
        );

        return {
          updateOne: {
            filter: { _id: lead._id },
            update: {
              $set: {
                aiScore: fit.score,
                aiScoreReason: fit.reason,
                aiScoreSource: "product-fit",
                aiScoredAt: scoredAt,
              },
            },
          },
        };
      }),
      { ordered: false }
    );
  }

  const refreshedLeads = await Lead.find({ _id: { $in: leads.map((lead) => lead._id) } }).populate(populateLead);

  response.status(201).json({
    product,
    location,
    searchedQueries,
    places,
    leads: refreshedLeads.sort((first, second) => (second.aiScore || 0) - (first.aiScore || 0)),
  });
}
