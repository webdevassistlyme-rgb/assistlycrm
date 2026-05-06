import type { Request, Response } from "express";
import { Employee } from "../models/Employee";
import { Team } from "../models/Team";

const populateTeam = ["lead", "members"];

type PopulatedTeamEmployee = {
  status?: string;
};

async function syncEmployeeTeams(teamId: string, teamName: string, memberIds: string[]) {
  await Employee.updateMany({ team: teamName }, { team: "Unassigned" });

  if (memberIds.length > 0) {
    await Employee.updateMany({ _id: { $in: memberIds } }, { team: teamName });
  }

  return teamId;
}

export async function listTeams(_request: Request, response: Response) {
  const teams = await Team.find({ status: { $ne: "Archived" } })
    .populate(populateTeam)
    .sort({ createdAt: -1 });
  const normalizedTeams = teams.map((team) => {
    const teamObject = team.toObject() as typeof team extends { toObject: () => infer T } ? T & {
      lead: PopulatedTeamEmployee | null;
      members: PopulatedTeamEmployee[];
    } : never;
    const members = Array.isArray(teamObject.members)
      ? teamObject.members.filter((member) => member && member.status !== "Archived")
      : [];

    return {
      ...teamObject,
      lead: teamObject.lead && teamObject.lead.status !== "Archived" ? teamObject.lead : null,
      members,
    };
  });

  response.json(normalizedTeams);
}

export async function createTeam(request: Request, response: Response) {
  const team = await Team.create({
    name: request.body.name,
    lead: request.body.lead || null,
    members: request.body.members || [],
    activeLeads: request.body.activeLeads || 0,
    status: request.body.status || "Active",
  });

  await syncEmployeeTeams(team.id, team.name, request.body.members || []);

  const populatedTeam = await Team.findById(team.id).populate(populateTeam);
  response.status(201).json(populatedTeam);
}

export async function updateTeam(request: Request, response: Response) {
  const teamId = String(request.params.id);
  const existingTeam = await Team.findById(teamId);

  if (!existingTeam) {
    response.status(404).json({ message: "Team not found" });
    return;
  }

  const team = await Team.findByIdAndUpdate(
    teamId,
    {
      name: request.body.name,
      lead: request.body.lead || null,
      members: request.body.members || [],
      activeLeads: request.body.activeLeads || 0,
      status: request.body.status || "Active",
    },
    { new: true, runValidators: true }
  ).populate(populateTeam);

  await Employee.updateMany({ team: existingTeam.name }, { team: "Unassigned" });
  await syncEmployeeTeams(teamId, request.body.name, request.body.members || []);

  response.json(team);
}
