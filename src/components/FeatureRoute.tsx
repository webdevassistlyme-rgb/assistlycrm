import type { ReactNode } from "react";
import type { FeatureKey } from "../api/features";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

type Props = {
    children: ReactNode;
    feature: FeatureKey;
    scope: "admin" | "employee";
};

export default function FeatureRoute({ children, feature, scope }: Props) {
    const { isLoading, isEnabled } = useFeatureFlags();

    if (isLoading) {
        return <div className="theme-app-bg min-h-screen p-6 text-sm text-white/50">Loading feature access...</div>;
    }

    if (!isEnabled(feature, scope)) {
        return (
            <div className="theme-app-bg flex min-h-screen items-center justify-center p-6 text-white">
                <div className="max-w-[28rem] rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/35">Feature Disabled</p>
                    <h1 className="mt-2 text-xl font-semibold">This module is turned off</h1>
                    <p className="mt-2 text-sm leading-6 text-white/55">Ask an admin to enable it in Settings &gt; Features.</p>
                </div>
            </div>
        );
    }

    return children;
}
