import { api } from "../lib/api";
import type { Employee } from "./employees";
import type { Team } from "./teams";

export type Conversation = {
    _id: string;
    type: "direct" | "team";
    title: string;
    participants: Employee[];
    team: Pick<Team, "_id" | "name" | "status"> | null;
    lastMessage: string;
    lastMessageAt: string | null;
};

export type Message = {
    _id: string;
    conversation: string;
    sender: Employee;
    body: string;
    createdAt: string;
};

export async function getConversations() {
    const response = await api.get<Conversation[]>("/messages/conversations");
    return response.data;
}

export async function createDirectConversation(participants: string[]) {
    const response = await api.post<Conversation>("/messages/conversations/direct", { participants });
    return response.data;
}

export async function createTeamConversation(team: string) {
    const response = await api.post<Conversation>("/messages/conversations/team", { team });
    return response.data;
}

export async function getMessages(conversationId: string) {
    const response = await api.get<Message[]>(`/messages/conversations/${conversationId}/messages`);
    return response.data;
}
