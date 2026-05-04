import type { Request, Response } from "express";
import { Lead } from "../models/Lead";
import { searchGooglePlaces } from "../services/googlePlacesService";

const populateLead = ["assignedAgent", "assignedTeam"];

export async function listLeads(_request: Request, response: Response) {
  const leads = await Lead.find({ status: { $ne: "Archived" } })
    .populate(populateLead)
    .sort({ createdAt: -1 });
  response.json(leads);
}

export async function createLead(request: Request, response: Response) {
  const lead = await Lead.create({
    leadName: request.body.leadName || "",
    position: request.body.position || "",
    businessName: request.body.businessName,
    businessAddress: request.body.businessAddress || "",
    email: request.body.email || "",
    phone: request.body.phone || "",
    website: request.body.website || "",
    source: request.body.source || "Manual",
    status: request.body.status || "NEW",
    assignedAgent: request.body.assignedAgent || null,
    assignedTeam: request.body.assignedTeam || null,
    googlePlaceId: request.body.googlePlaceId || "",
    notes: request.body.notes || "",
  });

  const populatedLead = await Lead.findById(lead.id).populate(populateLead);
  response.status(201).json(populatedLead);
}

export async function updateLead(request: Request, response: Response) {
  const lead = await Lead.findByIdAndUpdate(
    request.params.id,
    {
      leadName: request.body.leadName || "",
      position: request.body.position || "",
      businessName: request.body.businessName,
      businessAddress: request.body.businessAddress || "",
      email: request.body.email || "",
      phone: request.body.phone || "",
      website: request.body.website || "",
      source: request.body.source || "Manual",
      status: request.body.status || "NEW",
      assignedAgent: request.body.assignedAgent || null,
      assignedTeam: request.body.assignedTeam || null,
      googlePlaceId: request.body.googlePlaceId || "",
      notes: request.body.notes || "",
    },
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

  if (!textQuery) {
    response.status(400).json({ message: "textQuery is required" });
    return;
  }

  const places = await searchGooglePlaces(textQuery);
  response.json(places);
}

export async function importPlacesAsLeads(request: Request, response: Response) {
  const places = Array.isArray(request.body.places) ? request.body.places : [];

  const leads = await Lead.insertMany(
    places.map((place: {
      businessName: string;
      businessAddress?: string;
      phone?: string;
      website?: string;
      googlePlaceId?: string;
    }) => ({
      businessName: place.businessName,
      businessAddress: place.businessAddress || "",
      phone: place.phone || "",
      website: place.website || "",
      googlePlaceId: place.googlePlaceId || "",
      source: "Google Places",
      status: "NEW",
    })),
    { ordered: false }
  );

  response.status(201).json(leads);
}
