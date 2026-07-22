import type { KnowledgeBaseEntry } from "../api/knowledgeBase";

export const ANNOUNCEMENT_SEEN_EVENT = "assistly-announcements-seen";

const ANNOUNCEMENT_SEEN_KEY_PREFIX = "assistly-announcements-seen-at";

export function getAnnouncementSeenStorageKey(employeeId?: string | null) {
    return `${ANNOUNCEMENT_SEEN_KEY_PREFIX}:${employeeId || "anonymous"}`;
}

export function getAnnouncementTimestamp(entry: Pick<KnowledgeBaseEntry, "createdAt" | "updatedAt">) {
    const value = entry.updatedAt || entry.createdAt || "";
    const timestamp = value ? new Date(value).getTime() : 0;

    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getLatestAnnouncementTimestamp(entries: KnowledgeBaseEntry[]) {
    return entries.reduce((latest, entry) => Math.max(latest, getAnnouncementTimestamp(entry)), 0);
}

export function readAnnouncementSeenAt(employeeId?: string | null) {
    if (typeof window === "undefined") return 0;

    const value = window.localStorage.getItem(getAnnouncementSeenStorageKey(employeeId));
    const timestamp = value ? Number(value) : 0;

    return Number.isFinite(timestamp) ? timestamp : 0;
}

export function writeAnnouncementSeenAt(employeeId: string | null | undefined, timestamp: number) {
    if (typeof window === "undefined" || !employeeId || !timestamp) return;

    const nextTimestamp = Math.max(readAnnouncementSeenAt(employeeId), timestamp);

    window.localStorage.setItem(getAnnouncementSeenStorageKey(employeeId), String(nextTimestamp));
    window.dispatchEvent(
        new CustomEvent(ANNOUNCEMENT_SEEN_EVENT, {
            detail: { employeeId, timestamp: nextTimestamp },
        })
    );
}
