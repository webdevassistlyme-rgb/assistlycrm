import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { reportEmployeeActivity } from "../../api/attendance";
import { getAuthUser } from "../../api/authStorage";
import EmployeeLiveShare from "../../components/EmployeeLiveShare";
import Navbar from "./navbar";
import SideBar from "./sidebar";

type Props = {
    children: ReactNode;
};

export default function MainLayout({ children }: Props) {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimer = useRef<number | undefined>(undefined);
    const idleTimer = useRef<number | undefined>(undefined);
    const activityState = useRef<"active" | "idle">("active");
    const lastActiveReport = useRef(0);
    const lastInteractionAt = useRef(Date.now());
    const awayStartedAt = useRef<number | null>(null);
    const awayReason = useRef<"tab-hidden" | "window-blur">("tab-hidden");
    const lastAcceptedMouse = useRef<{ x: number; y: number; at: number } | null>(null);
    const repeatedInput = useRef({ fingerprint: "", firstAt: 0, count: 0 });

    const handleScroll = () => {
        setIsScrolling(true);
        window.clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => setIsScrolling(false), 700);
    };

    useEffect(() => {
        const authUser = getAuthUser();
        const employeeId = authUser?.userType === "employee" ? authUser.user._id : "";

        if (!employeeId) {
            return;
        }

        const idleMs = 10 * 60 * 1000;
        const activeReportThrottleMs = 60 * 1000;
        const repeatedInputWindowMs = 60 * 1000;
        const repeatedInputLimit = 30;
        const mouseMoveThresholdPx = 12;
        const mouseMoveFallbackMs = 5 * 1000;

        const markIdle = (idleStartedAt = lastInteractionAt.current, reason = "inactivity-timeout") => {
            if (activityState.current === "idle") {
                return Promise.resolve();
            }

            activityState.current = "idle";
            return reportEmployeeActivity(employeeId, "idle", {
                idleStartedAt: new Date(idleStartedAt).toISOString(),
                reason,
            }).catch(() => undefined);
        };

        const resetIdleTimer = () => {
            window.clearTimeout(idleTimer.current);
            const idleStartedAt = awayStartedAt.current || lastInteractionAt.current;
            const reason = awayStartedAt.current ? awayReason.current : "inactivity-timeout";
            idleTimer.current = window.setTimeout(() => {
                void markIdle(idleStartedAt, reason);
            }, idleMs);
        };

        const inputFingerprint = (event: Event) => {
            if (event instanceof KeyboardEvent) return `${event.type}:${event.code || event.key}`;
            if (event instanceof MouseEvent) return `${event.type}:${Math.round(event.clientX / 10)}:${Math.round(event.clientY / 10)}:${event.button}`;
            if (event instanceof WheelEvent) return `${event.type}:${Math.sign(event.deltaX)}:${Math.sign(event.deltaY)}`;
            if (event instanceof TouchEvent) return `${event.type}:${event.touches.length}`;
            return event.type;
        };

        const isRepeatedOrNoiseInput = (event: Event) => {
            const now = Date.now();

            if (!event.isTrusted || document.visibilityState !== "visible") {
                return true;
            }

            if (event instanceof KeyboardEvent && event.repeat) {
                return true;
            }

            if (event.type === "mousemove" && event instanceof MouseEvent) {
                const lastMouse = lastAcceptedMouse.current;
                const distance = lastMouse ? Math.hypot(event.clientX - lastMouse.x, event.clientY - lastMouse.y) : Number.POSITIVE_INFINITY;

                if (lastMouse && distance < mouseMoveThresholdPx && now - lastMouse.at < mouseMoveFallbackMs) {
                    return true;
                }

                lastAcceptedMouse.current = { x: event.clientX, y: event.clientY, at: now };
            }

            const fingerprint = inputFingerprint(event);
            const repeated = repeatedInput.current;

            if (repeated.fingerprint === fingerprint && now - repeated.firstAt <= repeatedInputWindowMs) {
                repeated.count += 1;
            } else {
                repeatedInput.current = { fingerprint, firstAt: now, count: 1 };
            }

            return repeatedInput.current.count > repeatedInputLimit;
        };

        const markActive = (event?: Event, reason = "browser-input", force = false) => {
            if (!force && event && isRepeatedOrNoiseInput(event)) {
                return;
            }

            const now = Date.now();
            awayStartedAt.current = null;
            lastInteractionAt.current = now;

            if (activityState.current === "idle") {
                activityState.current = "active";
                lastActiveReport.current = now;
                void reportEmployeeActivity(employeeId, "active", { reason }).catch(() => undefined);
            } else if (now - lastActiveReport.current >= activeReportThrottleMs) {
                lastActiveReport.current = now;
                void reportEmployeeActivity(employeeId, "active", { reason }).catch(() => undefined);
            }

            resetIdleTimer();
        };

        const markAway = (reason: "tab-hidden" | "window-blur") => {
            if (!awayStartedAt.current) {
                awayStartedAt.current = Date.now();
                awayReason.current = reason;
                lastInteractionAt.current = awayStartedAt.current;
            }

            resetIdleTimer();
        };

        const markReturned = () => {
            if (document.visibilityState !== "visible" || !document.hasFocus()) {
                return;
            }

            const now = Date.now();
            const idleStartedAt = awayStartedAt.current;
            const reason = awayReason.current;

            if (idleStartedAt && now - idleStartedAt >= idleMs) {
                void markIdle(idleStartedAt, reason).finally(() => markActive(undefined, "tab-return", true));
                return;
            }

            markActive(undefined, "tab-return", true);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "hidden") {
                markAway("tab-hidden");
                return;
            }

            markReturned();
        };

        const handleWindowBlur = () => {
            if (document.visibilityState === "visible") {
                markAway("window-blur");
            }
        };

        const activityEvents = ["mousemove", "mousedown", "keydown", "wheel", "scroll", "touchstart"] as const;
        activityEvents.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleWindowBlur);
        window.addEventListener("focus", markReturned);
        markActive(undefined, "layout-mounted", true);

        return () => {
            window.clearTimeout(idleTimer.current);
            activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActive));
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleWindowBlur);
            window.removeEventListener("focus", markReturned);
        };
    }, []);

    return (
        <div className="theme-app-bg h-screen overflow-hidden text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_20%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_28%),radial-gradient(circle_at_95%_0%,color-mix(in_srgb,var(--secondary)_14%,transparent),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_26%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
            <SideBar />
            <EmployeeLiveShare />
            <main className="relative flex h-screen flex-col pl-[16rem]">
                <Navbar />
                <div
                    className={[
                        "content-scroll min-h-0 flex-1 overflow-y-auto p-6",
                        isScrolling ? "is-scrolling" : "",
                    ].join(" ")}
                    onScroll={handleScroll}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
