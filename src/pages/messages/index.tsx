import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useSearchParams } from "react-router";
import { FiChevronLeft, FiChevronRight, FiHash, FiMessageCircle, FiPhone, FiPlus, FiSearch, FiSend, FiUsers, FiX } from "react-icons/fi";
import MainLayout from "../layout";
import AdminLayout from "../admin/adminLayout";
import {
    createDirectConversation,
    createTeamConversation,
    getConversations,
    getMessages,
    sendMessage,
    type Conversation,
    type Message,
} from "../../api/messages";
import { getEmployees } from "../../api/employees";
import { getTeams } from "../../api/teams";
import { getAuthUser } from "../../api/authStorage";
import { socket } from "../../lib/socket";
import { formatPhDateTime } from "../../lib/dateTime";

const ADMIN_USER = {
    _id: "admin",
    name: "Admin",
    email: "admin@assistly.com",
    role: "Admin",
    team: "Admin",
};

function appendMessageIfNew(current: Message[] = [], message: Message) {
    if (current.some((item) => item._id === message._id)) {
        return current;
    }

    return [...current, message];
}

function getInitials(value: string) {
    const words = value.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return "?";
    }

    return words.slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join("");
}

export default function Messages() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();
    const authUser = getAuthUser();
    const isAdminRoute = location.pathname.startsWith("/admin");
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
    const [directorySearch, setDirectorySearch] = useState("");
    const [mode, setMode] = useState<"direct" | "team">("direct");
    const [pendingDirectTarget, setPendingDirectTarget] = useState(searchParams.get("to") || searchParams.get("call") || "");
    const [pendingCallTarget, setPendingCallTarget] = useState(searchParams.get("call") || "");
    const [pendingTeamTarget, setPendingTeamTarget] = useState(searchParams.get("team") || "");
    const [activeCallTargetId, setActiveCallTargetId] = useState<string | null>(null);
    const [isDirectoryOpen, setIsDirectoryOpen] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const directorySearchRef = useRef<HTMLInputElement>(null);

    const currentUser = authUser?.userType === "employee" ? authUser.user : ADMIN_USER;
    const visibleConversations = useMemo(
        () =>
            conversations.filter((conversation) =>
                isAdminRoute
                    ? Boolean(conversation.includeAdmin) || conversation.type === "team"
                    : conversation.participants.some((participant) => participant._id === currentUser._id)
            ),
        [conversations, currentUser._id, isAdminRoute]
    );
    const selectedConversation = visibleConversations.find((conversation) => conversation._id === selectedConversationId) || visibleConversations[0] || null;
    const { data: messages = [] } = useQuery({
        queryKey: ["messages", selectedConversation?._id],
        queryFn: () => getMessages(selectedConversation?._id || ""),
        enabled: Boolean(selectedConversation?._id),
    });

    const createDirectMutation = useMutation({
        mutationFn: ({ participants, includeAdmin }: { participants: string[]; includeAdmin?: boolean }) => createDirectConversation(participants, includeAdmin),
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
            setPendingTeamTarget("");
            setSearchParams({}, { replace: true });
        },
    });
    const sendMessageMutation = useMutation({
        mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
            sendMessage(conversationId, {
                senderId: isAdminRoute ? null : currentUser._id,
                senderName: currentUser.name,
                senderType: isAdminRoute ? "admin" : "employee",
                body,
            }),
        onSuccess: (message) => {
            queryClient.setQueryData<Message[]>(["messages", message.conversation], (current = []) => appendMessageIfNew(current, message));
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
        },
    });

    useEffect(() => {
        socket.connect();

        const handleNewMessage = (message: Message) => {
            queryClient.setQueryData<Message[]>(["messages", message.conversation], (current = []) => appendMessageIfNew(current, message));
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
        const targetConversationId = searchParams.get("conversation") || "";
        if (!targetConversationId) {
            return;
        }

        const targetConversation = visibleConversations.find((conversation) => conversation._id === targetConversationId);
        if (!targetConversation) {
            return;
        }

        setSelectedConversationId(targetConversation._id);
        setMode(targetConversation.type === "team" ? "team" : "direct");
        setSearch("");

        const nextSearchParams = new URLSearchParams(searchParams);
        nextSearchParams.delete("conversation");
        setSearchParams(nextSearchParams, { replace: true });
    }, [searchParams, setSearchParams, visibleConversations]);

    useEffect(() => {
        const targetEmail = searchParams.get("to") || searchParams.get("call") || "";
        const callEmail = searchParams.get("call") || "";
        const teamId = searchParams.get("team") || "";
        if (targetEmail !== pendingDirectTarget) {
            setPendingDirectTarget(targetEmail);
        }
        if (callEmail !== pendingCallTarget) {
            setPendingCallTarget(callEmail);
        }
        if (teamId !== pendingTeamTarget) {
            setPendingTeamTarget(teamId);
        }
    }, [pendingCallTarget, pendingDirectTarget, pendingTeamTarget, searchParams]);

    useEffect(() => {
        if (!pendingDirectTarget || !currentUser || createDirectMutation.isPending) {
            return;
        }

        const targetEmployee = employees.find(
            (employee) => employee.email.toLowerCase() === pendingDirectTarget.toLowerCase()
        );

        if (!targetEmployee || (!isAdminRoute && targetEmployee._id === currentUser._id)) {
            return;
        }

        if (pendingCallTarget && targetEmployee.email.toLowerCase() === pendingCallTarget.toLowerCase()) {
            setActiveCallTargetId(targetEmployee._id);
        }

        const existingConversation = conversations.find((conversation) =>
            isAdminRoute
                ? conversation.type === "direct" && Boolean(conversation.includeAdmin) && conversation.participants.some((participant) => participant._id === targetEmployee._id)
                : conversation.type === "direct" &&
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

        createDirectMutation.mutate({
            participants: isAdminRoute ? [targetEmployee._id] : [currentUser._id, targetEmployee._id],
            includeAdmin: isAdminRoute,
        });
    }, [
        conversations,
        createDirectMutation,
        employees,
        isAdminRoute,
        pendingCallTarget,
        pendingDirectTarget,
        setSearchParams,
    ]);

    useEffect(() => {
        if (!pendingTeamTarget || createTeamMutation.isPending) {
            return;
        }

        const existingConversation = conversations.find(
            (conversation) => conversation.type === "team" && conversation.team?._id === pendingTeamTarget
        );

        if (existingConversation) {
            setSelectedConversationId(existingConversation._id);
            setPendingTeamTarget("");
            setSearchParams({}, { replace: true });
            return;
        }

        createTeamMutation.mutate(pendingTeamTarget);
    }, [conversations, createTeamMutation, pendingTeamTarget, setSearchParams]);

    const activeCallTarget = employees.find((employee) => employee._id === activeCallTargetId) || null;
    const activeEmployees = useMemo(
        () => employees.filter((employee) => employee.status !== "Archived"),
        [employees]
    );
    const directorySearchText = directorySearch.trim().toLowerCase();
    const directContacts = useMemo(
        () =>
            activeEmployees.filter((employee) => {
                if (!isAdminRoute && employee._id === currentUser._id) {
                    return false;
                }

                if (!directorySearchText) {
                    return true;
                }

                return [employee.name, employee.role, employee.team, employee.email, employee.employeeCode]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(directorySearchText);
            }),
        [activeEmployees, currentUser._id, directorySearchText, isAdminRoute]
    );
    const filteredTeams = useMemo(
        () =>
            teams.filter((team) => {
                if (!directorySearchText) {
                    return true;
                }

                return [team.name, team.status]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase()
                    .includes(directorySearchText);
            }),
        [directorySearchText, teams]
    );
    const selectedTitle = selectedConversation ? getConversationTitle(selectedConversation, currentUser._id) : "Select a conversation";
    const selectedSubtitle = selectedConversation
        ? selectedConversation.type === "team"
            ? `${selectedConversation.participants.length} member${selectedConversation.participants.length === 1 ? "" : "s"}`
            : selectedConversation.includeAdmin
              ? "Admin direct message"
              : "Direct message"
        : "Choose a thread or start a new one";

    const filteredConversations = useMemo(
        () =>
            visibleConversations.filter((conversation) => {
                const title = getConversationTitle(conversation, currentUser?._id || "");
                return title.toLowerCase().includes(search.toLowerCase());
            }),
        [currentUser?._id, search, visibleConversations]
    );

    const startDirectConversation = (employeeId: string) => {
        if (!currentUser || (!isAdminRoute && employeeId === currentUser._id)) {
            return;
        }

        createDirectMutation.mutate({
            participants: isAdminRoute ? [employeeId] : [currentUser._id, employeeId],
            includeAdmin: isAdminRoute,
        });
    };

    const startAdminConversation = () => {
        if (!authUser || authUser.userType !== "employee") {
            return;
        }

        createDirectMutation.mutate({
            participants: [authUser.user._id],
            includeAdmin: true,
        });
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ block: "end" });
    }, [messages.length, selectedConversation?._id]);

    const sendCurrentMessage = () => {
        const body = messageText.trim();

        if (!selectedConversation || !currentUser || !body || sendMessageMutation.isPending) {
            return;
        }

        sendMessageMutation.mutate({ conversationId: selectedConversation._id, body });
        setMessageText("");
    };

    const handleSendMessage = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        sendCurrentMessage();
    };

    const handleMessageKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
            return;
        }

        event.preventDefault();
        sendCurrentMessage();
    };

    const Layout = isAdminRoute ? AdminLayout : MainLayout;

    return (
        <Layout>
            <section
                className={[
                    "grid min-h-[calc(100vh-8.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-[#f0f2f5] text-slate-950 shadow-sm transition-[grid-template-columns]",
                    isDirectoryOpen
                        ? isAdminRoute
                            ? "lg:grid-cols-[20rem_minmax(0,1fr)_20rem]"
                            : "lg:grid-cols-[21rem_minmax(0,1fr)_20rem]"
                        : isAdminRoute
                          ? "lg:grid-cols-[20rem_minmax(0,1fr)_4.5rem]"
                          : "lg:grid-cols-[21rem_minmax(0,1fr)_4.5rem]",
                ].join(" ")}
            >
                <aside className="flex min-h-0 flex-col border-r border-slate-200 bg-white">
                    <div className="border-b border-slate-100 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-950">Chats</h2>
                                <p className="mt-1 text-xs text-slate-500">{visibleConversations.length} active thread{visibleConversations.length === 1 ? "" : "s"}</p>
                            </div>
                            <span className="flex size-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                                <FiMessageCircle className="size-5" aria-hidden="true" />
                            </span>
                        </div>
                        <label className="mt-4 flex h-10 items-center gap-2 rounded-full bg-[#f0f2f5] px-3 text-slate-500 focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                            <FiSearch className="size-4" aria-hidden="true" />
                            <input
                                className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search"
                            />
                        </label>
                    </div>

                    <div className="content-scroll min-h-0 flex-1 overflow-y-auto p-2">
                        {filteredConversations.length === 0 && (
                            <div className="m-2 rounded-2xl border border-dashed border-slate-200 bg-[#f7f8fa] p-4 text-sm text-slate-500">
                                No conversations match your search.
                            </div>
                        )}
                        {filteredConversations.map((conversation) => {
                            const isActive = selectedConversation?._id === conversation._id;
                            const title = getConversationTitle(conversation, currentUser._id);
                            const ConversationIcon = conversation.type === "team" ? FiUsers : conversation.includeAdmin ? FiMessageCircle : FiHash;
                            return (
                                <button
                                    key={conversation._id}
                                    className={[
                                        "mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                                        isActive
                                            ? "bg-[#e7f3ff]"
                                            : "hover:bg-[#f0f2f5]",
                                    ].join(" ")}
                                    type="button"
                                    onClick={() => setSelectedConversationId(conversation._id)}
                                >
                                    <span className={["flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold", conversation.type === "team" ? "bg-slate-200 text-slate-700" : "bg-[#0084ff] text-white"].join(" ")}>
                                        {conversation.type === "team" ? <ConversationIcon className="size-4" /> : getInitials(title)}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-start justify-between gap-2">
                                            <span className="block truncate text-sm font-semibold text-slate-950">{title}</span>
                                            {conversation.lastMessageAt && <span className="shrink-0 text-[0.65rem] text-slate-400">{formatPhDateTime(conversation.lastMessageAt).replace(", 2026", "")}</span>}
                                        </span>
                                        <span className="mt-1 block truncate text-xs text-slate-500">
                                            {conversation.lastMessage || "No messages yet"}
                                        </span>
                                        <span className="mt-1 block text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-slate-400">
                                            {conversation.type === "team" ? "Team" : conversation.includeAdmin ? "Admin" : "Direct"}
                                        </span>
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                <main className="flex min-h-0 flex-col bg-white">
                    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-sm font-bold text-white shadow-sm shadow-[#0084ff]/20">
                                {selectedConversation?.type === "team" ? <FiUsers className="size-4" /> : getInitials(selectedTitle)}
                            </span>
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-semibold text-slate-950">{selectedTitle}</h3>
                                <p className="mt-0.5 text-xs text-slate-500">{selectedSubtitle}</p>
                            </div>
                        </div>
                        {selectedConversation && selectedConversation.type === "direct" && !isAdminRoute && (
                            <button
                                className="flex h-9 items-center gap-2 rounded-full bg-[#e7f3ff] px-3 text-xs font-semibold text-[#0084ff] transition hover:bg-[#dceeff]"
                                type="button"
                                onClick={() => {
                                    const target = selectedConversation.participants.find((participant) => participant._id !== currentUser._id);
                                    if (target) setActiveCallTargetId(target._id);
                                }}
                            >
                                <FiPhone className="size-4" aria-hidden="true" />
                                Call
                            </button>
                        )}
                    </header>

                    {activeCallTarget && (
                        <div className="border-b border-slate-100 bg-white px-5 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#e7f3ff] px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-full bg-[#0084ff] text-white">
                                        <FiPhone className="size-5" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-950">Calling {activeCallTarget.name}</p>
                                        <p className="mt-1 text-xs text-slate-500">Internal system call · {activeCallTarget.role}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="h-9 rounded-full bg-emerald-500 px-3 text-sm font-semibold text-white"
                                        type="button"
                                    >
                                        In call
                                    </button>
                                    <button
                                        className="flex size-9 items-center justify-center rounded-full bg-white text-slate-600 transition hover:bg-slate-100"
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

                    <div className="content-scroll flex-1 space-y-4 overflow-y-auto bg-[#f7f8fa] px-6 py-5">
                        {!selectedConversation && (
                            <div className="grid h-full place-items-center">
                                <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm">
                                    <FiMessageCircle className="mx-auto size-8 text-[#0084ff]" aria-hidden="true" />
                                    <p className="mt-3 text-sm font-semibold text-slate-950">Select a conversation</p>
                                    <p className="mt-1 text-sm text-slate-500">Start a direct or team chat from the panel on the right.</p>
                                </div>
                            </div>
                        )}
                        {messages.map((message) => {
                            const senderId = message.sender?._id || (message.senderType === "admin" ? "admin" : "");
                            const senderName = message.sender?.name || message.senderName || (message.senderType === "admin" ? "Admin" : "Employee");
                            const isMine = senderId === currentUser?._id;

                            return (
                                <div key={message._id} className={["flex items-end gap-2", isMine ? "justify-end" : "justify-start"].join(" ")}>
                                    {!isMine && (
                                        <span className="mb-5 flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[0.68rem] font-bold text-slate-700">
                                            {getInitials(senderName)}
                                        </span>
                                    )}
                                    <div className={["flex max-w-[min(34rem,78%)] flex-col", isMine ? "items-end" : "items-start"].join(" ")}>
                                        {!isMine && <p className="mb-1 ml-2 text-[0.68rem] font-semibold text-slate-500">{senderName}</p>}
                                        <div className={["rounded-[1.35rem] px-4 py-2.5 shadow-sm", isMine ? "rounded-br-md bg-[#0084ff] !text-white shadow-[#0084ff]/15" : "rounded-bl-md border border-slate-200 bg-white text-slate-950"].join(" ")}>
                                            <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.body}</p>
                                        </div>
                                        <p className="mt-1 px-2 text-[0.68rem] font-medium text-slate-400">{formatPhDateTime(message.createdAt)}</p>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="border-t border-slate-200 bg-white px-5 py-3" onSubmit={handleSendMessage}>
                        <div className="flex items-end gap-2 rounded-[1.65rem] border border-slate-200 bg-[#f0f2f5] p-2 focus-within:border-[#0084ff]/40 focus-within:ring-2 focus-within:ring-[#0084ff]/15">
                        <textarea
                            className="max-h-28 min-h-10 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
                            value={messageText}
                            onChange={(event) => setMessageText(event.target.value)}
                            onKeyDown={handleMessageKeyDown}
                            placeholder="Write a message"
                            rows={1}
                            disabled={!selectedConversation || sendMessageMutation.isPending}
                        />
                        <button
                            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-white transition hover:bg-[#0073df] disabled:cursor-not-allowed disabled:bg-slate-300"
                            type="submit"
                            aria-label="Send message"
                            disabled={!selectedConversation || !messageText.trim() || sendMessageMutation.isPending}
                        >
                            <FiSend className="size-5" aria-hidden="true" />
                        </button>
                        </div>
                    </form>
                </main>

                <aside className={["flex h-[calc(100vh-8.5rem)] min-h-0 flex-col border-l border-slate-200 bg-white", isDirectoryOpen ? "p-4" : "items-center p-3"].join(" ")}>
                    {!isDirectoryOpen ? (
                        <div className="flex flex-col items-center gap-3">
                            <button
                                className="flex size-10 items-center justify-center rounded-full bg-[#f0f2f5] text-slate-700 transition hover:bg-[#e4e6eb]"
                                type="button"
                                aria-label="Expand contact panel"
                                title="Expand"
                                onClick={() => setIsDirectoryOpen(true)}
                            >
                                <FiChevronLeft className="size-4" aria-hidden="true" />
                            </button>
                            <span className="flex size-10 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                                {mode === "team" ? <FiUsers className="size-4" aria-hidden="true" /> : <FiMessageCircle className="size-4" aria-hidden="true" />}
                            </span>
                            <span className="rotate-90 whitespace-nowrap pt-6 text-xs font-semibold text-slate-500">
                                People
                            </span>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-950">People</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">{mode === "direct" ? `${directContacts.length} employees` : `${filteredTeams.length} teams`}</p>
                                </div>
                                <button
                                    className="flex size-9 items-center justify-center rounded-full bg-[#f0f2f5] text-slate-700 transition hover:bg-[#e4e6eb]"
                                    type="button"
                                    aria-label="Collapse contact panel"
                                    title="Collapse"
                                    onClick={() => setIsDirectoryOpen(false)}
                                >
                                    <FiChevronRight className="size-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="flex rounded-full bg-[#f0f2f5] p-1">
                                {(["direct", "team"] as const).map((option) => (
                                    <button
                                        key={option}
                                        className={[
                                            "h-9 flex-1 rounded-full text-sm font-semibold capitalize transition",
                                            mode === option ? "bg-white text-slate-950 shadow-sm" : "text-slate-700 hover:bg-white/70",
                                        ].join(" ")}
                                        type="button"
                                        onClick={() => setMode(option)}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <label className="flex h-10 min-w-0 flex-1 items-center rounded-full bg-[#f0f2f5] px-3 focus-within:ring-2 focus-within:ring-[#0084ff]/20">
                                    <FiSearch className="mr-2 size-4 shrink-0 text-slate-400" aria-hidden="true" />
                                    <input
                                        ref={directorySearchRef}
                                        className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-400"
                                        value={directorySearch}
                                        onChange={(event) => setDirectorySearch(event.target.value)}
                                        placeholder={mode === "direct" ? "Search employees" : "Search teams"}
                                        type="search"
                                    />
                                </label>
                                <button
                                    className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff] transition hover:bg-[#dceeff]"
                                    type="button"
                                    aria-label={mode === "direct" ? "Search employees" : "Search teams"}
                                    onClick={() => directorySearchRef.current?.focus()}
                                >
                                    <FiSearch className="size-4" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="content-scroll mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto">
                                {mode === "direct" && !isAdminRoute && (!directorySearchText || "admin support operations".includes(directorySearchText)) && (
                                    <button
                                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#f0f2f5]"
                                        type="button"
                                        onClick={startAdminConversation}
                                    >
                                        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-bold text-white">A</span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold text-slate-950">Admin</span>
                                            <span className="mt-0.5 block truncate text-xs text-slate-500">Support and operations</span>
                                        </span>
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                                            <FiPlus className="size-4" aria-hidden="true" />
                                        </span>
                                    </button>
                                )}
                                {mode === "direct" &&
                                    directContacts
                                        .map((employee) => (
                                            <button
                                                key={employee._id}
                                                className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#f0f2f5]"
                                                type="button"
                                                onClick={() => startDirectConversation(employee._id)}
                                            >
                                                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#0084ff] text-sm font-bold text-white">
                                                    {getInitials(employee.name)}
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold text-slate-950">{employee.name}</span>
                                                    <span className="mt-0.5 block truncate text-xs text-slate-500">{employee.role}{employee.team ? ` · ${employee.team}` : ""}</span>
                                                </span>
                                                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                                                    <FiPlus className="size-4" aria-hidden="true" />
                                                </span>
                                            </button>
                                        ))}
                                {mode === "direct" && directContacts.length === 0 && (isAdminRoute || directorySearchText) && (
                                    <p className="rounded-2xl border border-dashed border-slate-200 bg-[#f7f8fa] p-4 text-sm text-slate-500">
                                        No employees match your search.
                                    </p>
                                )}

                                {mode === "team" &&
                                    filteredTeams.map((team) => (
                                        <button
                                            key={team._id}
                                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-[#f0f2f5]"
                                            type="button"
                                            onClick={() => createTeamMutation.mutate(team._id)}
                                        >
                                            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                                                <FiUsers className="size-4" aria-hidden="true" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-sm font-semibold text-slate-950">{team.name}</span>
                                                <span className="mt-0.5 block truncate text-xs text-slate-500">{team.members.length} members</span>
                                            </span>
                                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e7f3ff] text-[#0084ff]">
                                                <FiPlus className="size-4" aria-hidden="true" />
                                            </span>
                                        </button>
                                    ))}
                                {mode === "team" && filteredTeams.length === 0 && (
                                    <p className="rounded-2xl border border-dashed border-slate-200 bg-[#f7f8fa] p-4 text-sm text-slate-500">
                                        No teams match your search.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </aside>
            </section>
        </Layout>
    );
}

function getConversationTitle(conversation: Conversation, currentUserId: string) {
    if (conversation.type === "team") {
        return conversation.team?.name || conversation.title || "Team chat";
    }

    if (conversation.includeAdmin) {
        if (currentUserId === "admin") {
            return conversation.participants[0]?.name || conversation.title || "Employee";
        }

        return "Admin";
    }

    const otherParticipant = conversation.participants.find((participant) => participant._id !== currentUserId);
    return otherParticipant?.name || conversation.title || "Direct message";
}
