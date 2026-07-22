import type { Request, Response } from "express";
import { Conversation } from "../models/Conversation";
import { Message } from "../models/Message";
import { Team } from "../models/Team";
import { emitMessageEvents } from "../socket";

const populateConversation = [
  { path: "participants", select: "name role team email status" },
  { path: "team", select: "name status" },
];

const populateMessageSender = { path: "sender", select: "name role team email status" };

function toText(value: unknown, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function resolveSenderType(value: unknown) {
  return value === "admin" ? "admin" : "employee";
}

export async function listConversations(_request: Request, response: Response) {
  const conversations = await Conversation.find()
    .populate(populateConversation)
    .sort({ lastMessageAt: -1, updatedAt: -1 });

  response.json(conversations);
}

export async function createDirectConversation(request: Request, response: Response) {
  const rawParticipants: unknown[] = Array.isArray(request.body.participants) ? request.body.participants : [];
  const participants: string[] = Array.from(
    new Set(
      rawParticipants
        .map((participant) => String(participant || "").trim())
        .filter(Boolean)
    )
  );
  const includeAdmin = Boolean(request.body.includeAdmin);

  if ((!includeAdmin && participants.length < 2) || (includeAdmin && participants.length < 1)) {
    response.status(400).json({ message: includeAdmin ? "Employee participant is required" : "At least two participants are required" });
    return;
  }

  const existingConversation = await Conversation.findOne({
    type: "direct",
    participants: { $all: participants, $size: participants.length },
    includeAdmin,
  }).populate(populateConversation);

  if (existingConversation) {
    response.json(existingConversation);
    return;
  }

  const conversation = await Conversation.create({
    type: "direct",
    title: request.body.title || (includeAdmin ? "Admin" : ""),
    participants,
    includeAdmin,
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
    includeAdmin: true,
  });

  const populatedConversation = await Conversation.findById(conversation.id).populate(populateConversation);
  response.status(201).json(populatedConversation);
}

export async function listMessages(request: Request, response: Response) {
  const messages = await Message.find({ conversation: request.params.conversationId })
    .populate(populateMessageSender)
    .sort({ createdAt: 1 });

  response.json(messages);
}

export async function createMessage(request: Request, response: Response) {
  const conversationId = toText(request.params.conversationId);
  const senderType = resolveSenderType(request.body.senderType);
  const senderName = toText(request.body.senderName, senderType === "admin" ? "Admin" : "Employee");
  const senderId = toText(request.body.senderId);
  const body = toText(request.body.body);

  if (!conversationId || !body || (senderType === "employee" && !senderId)) {
    response.status(400).json({ message: "conversation, sender, and message body are required" });
    return;
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    response.status(404).json({ message: "Conversation not found" });
    return;
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderType === "employee" ? senderId : null,
    senderName,
    senderType,
    body,
  });

  const populatedMessage = await Message.findById(message.id).populate(populateMessageSender);

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: body,
    lastMessageAt: new Date(),
  });

  const populatedConversation = await Conversation.findById(conversationId).populate(populateConversation);

  emitMessageEvents(conversationId, populatedMessage, populatedConversation);
  response.status(201).json(populatedMessage);
}
