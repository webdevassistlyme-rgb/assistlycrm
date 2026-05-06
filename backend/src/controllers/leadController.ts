import type { Request, Response } from "express";
import { Types } from "mongoose";
import { Employee } from "../models/Employee";
import { Lead } from "../models/Lead";
import { scoreLeadsByPotential } from "../services/leadScoringService";
import { searchAllGooglePlaces, searchGooglePlaces, type GooglePlaceLead } from "../services/googlePlacesService";

const populateLead = ["assignedAgent", "assignedTeam"];

type PopulatedLead = Awaited<ReturnType<typeof Lead.find>>[number];
type AssignmentCandidate = {
  _id: Types.ObjectId;
  assignedCount: number;
};

function normalizeLeadValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
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

function getFollowUpWeight(lead: { followUpAt?: Date | string | null; followUpPriority?: number }) {
  if (!lead.followUpAt) {
    return 0;
  }

  const followUpTime = new Date(lead.followUpAt).getTime();

  if (Number.isNaN(followUpTime)) {
    return 0;
  }

  const now = Date.now();
  const isDue = followUpTime <= now;
  const isSoon = followUpTime <= now + 24 * 60 * 60 * 1000;

  return (lead.followUpPriority || 0) + (isDue ? 1000 : isSoon ? 500 : 100);
}

function sortLeadsByFollowUpPriority<T extends { followUpAt?: Date | string | null; followUpPriority?: number; createdAt?: Date }>(leads: T[]) {
  return [...leads].sort((first, second) => {
    const priorityDelta = getFollowUpWeight(second) - getFollowUpWeight(first);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(second.createdAt || 0).getTime() - new Date(first.createdAt || 0).getTime();
  });
}

async function createAssignmentCandidates(): Promise<AssignmentCandidate[]> {
  const employees = await Employee.find({ status: { $in: ["Active", "Training"] } }).sort({ createdAt: 1 });

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
    assignedAgent: request.body.assignedAgent || pickAssignmentCandidate(assignmentCandidates),
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
    { assignedAgent },
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
