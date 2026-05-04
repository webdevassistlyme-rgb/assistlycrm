import type { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Team } from "../models/Team";

const populateConversation = [
  { path: "participants", select: "name role team email status" },
  { path: "team", select: "name status" },
];

export async function listConversations(_request: Request, response: Response) {
  const conversations = await Conversation.find()
    .populate(populateConversation)
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  response.json(conversations);
}

export async function createDirectConversation(request: Request, response: Response) {
  const participants = request.body.participants || [];

  if (!Array.isArray(participants) || participants.length < 2) {
    response.status(400).json({ message: "At least two participants are required" });
    return;
  }

  const existingConversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: participants, $size: participants.length },
  }).populate(populateConversation);

  if (existingConversation) {
    response.json(existingConversation);
    return;
  }

  const conversation = await Conversation.create({
    type: "direct",
    title: request.body.title || "",
    participants,
  });

  const populatedConversation = await Conversation.findById(conversation.id).populate(populateConversation);
  response.status(201).json(populatedConversation);
}

export async function createTeamConversation(request: Request, response: Response) {
  const teamId = request.body.team;

  if (!teamId) {
    response.status(400).json({ message: "team is required" });
    return;
  }

  const existingConversation = await Conversation.findOne({ type: "team", team: teamId }).populate(populateConversation);

  if (existingConversation) {
    response.json(existingConversation);
    return;
  }

  const team = await Team.findById(teamId);

  if (!team) {
    response.status(404).json({ message: "Team not found" });
    return;
  }

  const conversation = await Conversation.create({
    type: "team",
    title: team.name,
    team: team.id,
    participants: team.members,
  });

  const populatedConversation = await Conversation.findById(conversation.id).populate(populateConversation);
  response.status(201).json(populatedConversation);
}

export async function listMessages(request: Request, response: Response) {
  const messages = await Message.find({ conversation: request.params.conversationId })
    .populate({ path: "sender", select: "name role team email status" })
    .sort({ createdAt: 1 });

  response.json(messages);
}
