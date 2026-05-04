import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router";
import { FiMessageCircle, FiPhone, FiPlus, FiSearch, FiSend, FiUsers, FiX } from "react-icons/fi";
import MainLayout from "../layout";
import {
    createDirectConversation,
    createTeamConversation,
    getConversations,
    getMessages,
    type Conversation,
    type Message,
} from "../../api/messages";
import { getEmployees } from "../../api/employees";
import { getTeams } from "../../api/teams";
import { getAuthUser } from "../../api/auth";
import { socket } from "../../lib/socket";

export default function Messages() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const authUser = getAuthUser();
    const { data: conversations = [] } = useQuery({
        queryKey: ["conversations"],
        queryFn: getConversations,
    });
    const { data: employees = [] } = useQuery({
        queryKey: ["employees"],
        queryFn: getEmployees,
    });
    const { data: teams = [] } = useQuery({
        queryKey: ["teams"],
        queryFn: getTeams,
    });
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [search, setSearch] = useState("");
    const [mode, setMode] = useState<"direct" | "team">("direct");
    const [pendingDirectTarget, setPendingDirectTarget] = useState(searchParams.get("to") || searchParams.get("call") || "");
    const [pendingCallTarget, setPendingCallTarget] = useState(searchParams.get("call") || "");
    const [activeCallTargetId, setActiveCallTargetId] = useState<string | null>(null);

    const currentUserEmail = authUser?.userType === "employee" ? authUser.user.email : "admin@assistly.com";
    const currentUser = employees.find((employee) => employee.email === currentUserEmail) || employees[0] || null;
    const selectedConversation = conversations.find((conversation) => conversation._id === selectedConversationId) || conversations[0] || null;
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", selectedConversation?._id],
        queryFn: () => getMessages(selectedConversation?._id || ""),
        enabled: Boolean(selectedConversation?._id),
    });

    const createDirectMutation = useMutation({
        mutationFn: createDirectConversation,
        onSuccess: (conversation) => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            setSelectedConversationId(conversation._id);
            setPendingDirectTarget("");
            setPendingCallTarget("");
            setSearchParams({}, { replace: true });
        },
    });

    const createTeamMutation = useMutation({
        mutationFn: createTeamConversation,
        onSuccess: (conversation) => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
            setSelectedConversationId(conversation._id);
        },
    });

    useEffect(() => {
        socket.connect();

        const handleNewMessage = (message: Message) => {
            queryClient.setQueryData<Message[]>(["messages", message.conversation], (current = []) => [...current, message]);
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        };

        const handleConversationUpdated = () => {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        };

        socket.on("message:new", handleNewMessage);
        socket.on("conversation:updated", handleConversationUpdated);

        return () => {
            socket.off("message:new", handleNewMessage);
            socket.off("conversation:updated", handleConversationUpdated);
        };
    }, [queryClient]);

    useEffect(() => {
        if (selectedConversation?._id) {
            socket.emit("conversation:join", selectedConversation._id);
        }
    }, [selectedConversation?._id]);

    useEffect(() => {
        const targetEmail = searchParams.get("to") || searchParams.get("call") || "";
        const callEmail = searchParams.get("call") || "";
        if (targetEmail !== pendingDirectTarget) {
            setPendingDirectTarget(targetEmail);
        }
        if (callEmail !== pendingCallTarget) {
            setPendingCallTarget(callEmail);
        }
    }, [pendingCallTarget, pendingDirectTarget, searchParams]);

    useEffect(() => {
        if (!pendingDirectTarget || !currentUser || createDirectMutation.isPending) {
            return;
        }

        const targetEmployee = employees.find(
            (employee) => employee.email.toLowerCase() === pendingDirectTarget.toLowerCase()
        );

        if (!targetEmployee || targetEmployee._id === currentUser._id) {
            return;
        }

        if (pendingCallTarget && targetEmployee.email.toLowerCase() === pendingCallTarget.toLowerCase()) {
            setActiveCallTargetId(targetEmployee._id);
        }

        const existingConversation = conversations.find(
            (conversation) =>
                conversation.type === "direct" &&
                conversation.participants.some((participant) => participant._id === currentUser._id) &&
                conversation.participants.some((participant) => participant._id === targetEmployee._id)
        );

        if (existingConversation) {
            setSelectedConversationId(existingConversation._id);
            setPendingDirectTarget("");
            setPendingCallTarget("");
            setSearchParams({}, { replace: true });
            return;
        }

        createDirectMutation.mutate([currentUser._id, targetEmployee._id]);
    }, [
        conversations,
        createDirectMutation,
        currentUser,
        employees,
        pendingCallTarget,
        pendingDirectTarget,
        setSearchParams,
    ]);

    const activeCallTarget = employees.find((employee) => employee._id === activeCallTargetId) || null;

    const filteredConversations = useMemo(
        () =>
            conversations.filter((conversation) => {
                const title = getConversationTitle(conversation, currentUser?._id || "");
                return title.toLowerCase().includes(search.toLowerCase());
            }),
        [conversations, currentUser?._id, search]
    );

    const startDirectConversation = (employeeId: string) => {
        if (!currentUser || employeeId === currentUser._id) {
            return;
        }

        createDirectMutation.mutate([currentUser._id, employeeId]);
    };

    const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!selectedConversation || !currentUser || !messageText.trim()) {
            return;
        }

        socket.emit("message:send", {
            conversationId: selectedConversation._id,
            senderId: currentUser._id,
            body: messageText.trim(),
        });
        setMessageText("");
    };

    return (
        <MainLayout>
            <section className="grid min-h-[calc(100vh-8.5rem)] overflow-hidden rounded-lg border border-white/10 bg-[#090b13]/80 lg:grid-cols-[20rem_1fr_18rem]">
                <aside className="border-r border-white/10">
                    <div className="border-b border-white/10 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Inbox</p>
                                <h2 className="mt-1 text-xl font-semibold text-white">Messages</h2>
                            </div>
                            <FiMessageCircle className="size-5 text-[#b994ff]" aria-hidden="true" />
                        </div>
                        <label className="mt-4 flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 text-white/45 focus-within:border-[#842cff]">
                            <FiSearch className="size-4" aria-hidden="true" />
                            <input
                                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search"
                            />
                        </label>
                    </div>

                    <div className="content-scroll max-h-[calc(100vh-15rem)] overflow-y-auto">
                        {filteredConversations.map((conversation) => {
                            const isActive = selectedConversation?._id === conversation._id;
                            return (
                                <button
                                    key={conversation._id}
                                    className={[
                                        "flex w-full items-start gap-3 border-b border-white/10 px-4 py-4 text-left transition",
                                        isActive ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => setSelectedConversationId(conversation._id)}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-sm font-semibold text-white">
                                        {conversation.type === "team" ? <FiUsers className="size-4" /> : getConversationTitle(conversation, currentUser?._id || "").charAt(0)}
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block truncate text-sm font-semibold text-white">
                                            {getConversationTitle(conversation, currentUser?._id || "")}
                                        </span>
                                        <span className="mt-1 block truncate text-xs text-white/45">
                                            {conversation.lastMessage || "No messages yet"}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex min-h-0 flex-col">
                    <header className="flex min-h-16 items-center justify-between border-b border-white/10 px-5">
                        <div>
                            <h3 className="text-base font-semibold text-white">
                                {selectedConversation ? getConversationTitle(selectedConversation, currentUser?._id || "") : "Select a conversation"}
                            </h3>
                            <p className="mt-1 text-xs text-white/45">
                                {selectedConversation?.type === "team" ? "Team conversation" : "Direct message"}
                            </p>
                        </div>
                    </header>

                    {activeCallTarget && (
                        <div className="border-b border-white/10 bg-[#11141d] px-5 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#842cff]/25 bg-[#842cff]/10 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-[#842cff] text-white">
                                        <FiPhone className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-white">Calling {activeCallTarget.name}</p>
                                        <p className="mt-1 text-xs text-white/45">Internal system call · {activeCallTarget.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="h-9 rounded-lg border border-emerald-400/25 bg-emerald-400/15 px-3 text-sm font-semibold text-emerald-100"
                                        type="button"
                                    >
                                        In call
                                    </button>
                                    <button
                                        className="flex size-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
                                        type="button"
                                        aria-label="End call"
                                        onClick={() => setActiveCallTargetId(null)}
                                    >
                                        <FiX className="size-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="content-scroll flex-1 space-y-3 overflow-y-auto p-5">
                        {messages.map((message) => {
                            const isMine = message.sender._id === currentUser?._id;

                            return (
                                <div key={message._id} className={["flex", isMine ? "justify-end" : "justify-start"].join(" ")}>
                                    <div className={["max-w-[70%] rounded-2xl px-4 py-3", isMine ? "bg-[#842cff] text-white" : "bg-white/[0.07] text-white"].join(" ")}>
                                        {!isMine && <p className="mb-1 text-xs font-semibold text-white/45">{message.sender.name}</p>}
                                        <p className="text-sm leading-6">{message.body}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <form className="flex items-center gap-3 border-t border-white/10 p-4" onSubmit={handleSendMessage}>
                        <input
                            className="h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#842cff] focus:ring-2 focus:ring-[#842cff]/20"
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            placeholder="Write a message"
                        />
                        <button
                            className="flex size-11 items-center justify-center rounded-lg bg-[linear-gradient(135deg,#842cff,#4a0ebd)] text-white transition hover:brightness-110"
                            type="submit"
                            aria-label="Send message"
                        >
                            <FiSend className="size-5" aria-hidden="true" />
                        </button>
                    </form>
                </main>

                <aside className="border-l border-white/10 p-4">
                    <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-1">
                        {(["direct", "team"] as const).map((option) => (
                            <button
                                key={option}
                                className={[
                                    "h-9 flex-1 rounded-md text-sm font-semibold capitalize transition",
                                    mode === option ? "bg-white text-[#070910]" : "text-white/55 hover:text-white",
                                ].join(" ")}
                                type="button"
                                onClick={() => setMode(option)}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    <div className="mt-4 space-y-2">
                        {mode === "direct" &&
                            employees
                                .filter((employee) => employee.status !== "Archived" && employee._id !== currentUser?._id)
                                .map((employee) => (
                                    <button
                                        key={employee._id}
                                        className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.08]"
                                        type="button"
                                        onClick={() => startDirectConversation(employee._id)}
                                    >
                                        <span>
                                            <span className="block text-sm font-semibold text-white">{employee.name}</span>
                                            <span className="mt-1 block text-xs text-white/45">{employee.role}</span>
                                        </span>
                                        <FiPlus className="size-4 text-white/45" aria-hidden="true" />
                                    </button>
                                ))}

                        {mode === "team" &&
                            teams.map((team) => (
                                <button
                                    key={team._id}
                                    className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.08]"
                                    type="button"
                                    onClick={() => createTeamMutation.mutate(team._id)}
                                >
                                    <span>
                                        <span className="block text-sm font-semibold text-white">{team.name}</span>
                                        <span className="mt-1 block text-xs text-white/45">{team.members.length} members</span>
                                    </span>
                                    <FiPlus className="size-4 text-white/45" aria-hidden="true" />
                                </button>
                            ))}
                    </div>
                </aside>
            </section>
        </MainLayout>
    );
}

function getConversationTitle(conversation: Conversation, currentUserId: string) {
    if (conversation.type === "team") {
        return conversation.team?.name || conversation.title || "Team chat";
    }

    const otherParticipant = conversation.participants.find((participant) => participant._id !== currentUserId);
    return otherParticipant?.name || conversation.title || "Direct message";
}
