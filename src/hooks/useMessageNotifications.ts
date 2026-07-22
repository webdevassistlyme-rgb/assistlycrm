import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAuthUser } from "../api/authStorage";
import { getConversations, type Conversation, type Message } from "../api/messages";
import { socket } from "../lib/socket";

type MessageNotificationPayload = {
    message: Message;
    conversation: Conversation | null;
};

export type MessageNotification = {
    id: string;
    conversationId: string;
    title: string;
    body: string;
    senderName: string;
    createdAt: string;
    href: string;
    isRead: boolean;
};

function getConversationTitle(conversation: Conversation | null, currentUserId: string) {
    if (!conversation) return "New message";
    if (conversation.type === "team") return conversation.team?.name || conversation.title || "Team chat";
    if (conversation.includeAdmin) return currentUserId === "admin" ? conversation.participants[0]?.name || "Employee" : "Admin";
    return conversation.participants.find((participant) => participant._id !== currentUserId)?.name || conversation.title || "Direct message";
}

function isRelevantConversation(conversation: Conversation | null, currentUserId: string, isAdmin: boolean) {
    if (!conversation) return false;
    if (isAdmin) return Boolean(conversation.includeAdmin) || conversation.type === "team";
    return conversation.participants.some((participant) => participant._id === currentUserId);
}

function isOwnMessage(message: Message, currentUserId: string, isAdmin: boolean) {
    if (isAdmin) return message.senderType === "admin";
    return message.sender?._id === currentUserId;
}

function readStoredNotifications(storageKey: string) {
    try {
        return JSON.parse(localStorage.getItem(storageKey) || "[]") as MessageNotification[];
    } catch {
        localStorage.removeItem(storageKey);
        return [];
    }
}

function messageHref(isAdmin: boolean, conversationId: string) {
    const basePath = isAdmin ? "/admin/messages" : "/messages";
    return conversationId ? `${basePath}?conversation=${encodeURIComponent(conversationId)}` : basePath;
}

export function useMessageNotifications() {
    const authUser = getAuthUser();
    const isAdmin = authUser?.userType === "admin";
    const currentUserId = authUser?.userType === "employee" ? authUser.user._id : isAdmin ? "admin" : "";
    const storageKey = `messageNotifications:${isAdmin ? "admin" : currentUserId || "guest"}`;
    const queryClient = useQueryClient();
    const [notifications, setNotifications] = useState<MessageNotification[]>(() => readStoredNotifications(storageKey));
    const { data: conversations = [] } = useQuery({
        queryKey: ["conversations"],
        queryFn: getConversations,
        enabled: Boolean(currentUserId),
        staleTime: 30_000,
    });

    useEffect(() => {
        setNotifications(readStoredNotifications(storageKey));
    }, [storageKey]);

    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(notifications.slice(0, 30)));
    }, [notifications, storageKey]);

    useEffect(() => {
        if (!currentUserId) return;

        socket.connect();

        const handleMessageNotification = ({ message, conversation }: MessageNotificationPayload) => {
            void queryClient.invalidateQueries({ queryKey: ["conversations"] });

            const resolvedConversation = conversation || conversations.find((item) => item._id === message.conversation) || null;
            if (isOwnMessage(message, currentUserId, Boolean(isAdmin)) || !isRelevantConversation(resolvedConversation, currentUserId, Boolean(isAdmin))) {
                return;
            }

            const notification: MessageNotification = {
                id: message._id,
                conversationId: message.conversation,
                title: getConversationTitle(resolvedConversation, currentUserId),
                body: message.body,
                senderName: message.sender?.name || message.senderName || (message.senderType === "admin" ? "Admin" : "Employee"),
                createdAt: message.createdAt,
                href: messageHref(Boolean(isAdmin), message.conversation),
                isRead: false,
            };

            setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 30));
        };

        socket.on("message:notification", handleMessageNotification);

        return () => {
            socket.off("message:notification", handleMessageNotification);
        };
    }, [conversations, currentUserId, isAdmin, queryClient]);

    const unreadCount = useMemo(() => notifications.filter((notification) => !notification.isRead).length, [notifications]);

    const markRead = (id: string) => {
        setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, isRead: true } : notification)));
    };

    const markAllRead = () => {
        setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
    };

    const messageNotifications = useMemo(
        () =>
            notifications.map((notification) => ({
                ...notification,
                href: messageHref(Boolean(isAdmin), notification.conversationId),
            })),
        [isAdmin, notifications]
    );

    return { messageNotifications, unreadMessageCount: unreadCount, markMessageRead: markRead, markAllMessagesRead: markAllRead };
}
