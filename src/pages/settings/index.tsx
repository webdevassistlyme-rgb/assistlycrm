import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiCheck, FiMonitor, FiRefreshCcw } from "react-icons/fi";
import { getSystemSettings } from "../../api/systemSettings";
import { getStoredThemeKey, hasAppThemeOverride, setAppTheme } from "../../components/ThemeProvider";
import { defaultThemeKey, themeOptions, type ThemeKey } from "../../lib/themes";
import MainLayout from "../layout";

export default function Settings() {
    const [activeThemeKey, setActiveThemeKey] = useState<ThemeKey>(() => getStoredThemeKey());
    const [isPersonalTheme, setIsPersonalTheme] = useState(() => hasAppThemeOverride());
    const { data: systemSettings, isLoading: systemSettingsLoading } = useQuery({
        queryKey: ["system-settings"],
        queryFn: getSystemSettings,
    });
    const companyThemeKey = systemSettings?.themeKey || defaultThemeKey;
    const activeTheme = useMemo(
        () => themeOptions.find((theme) => theme.key === activeThemeKey) || themeOptions[0],
        [activeThemeKey]
    );
    const companyTheme = useMemo(
        () => themeOptions.find((theme) => theme.key === companyThemeKey) || themeOptions[0],
        [companyThemeKey]
    );

    useEffect(() => {
        if (!isPersonalTheme) {
            setActiveThemeKey(companyThemeKey);
        }
    }, [companyThemeKey, isPersonalTheme]);

    const chooseTheme = (themeKey: ThemeKey) => {
        setAppTheme(themeKey, { userOverride: true });
        setActiveThemeKey(themeKey);
        setIsPersonalTheme(true);
    };

    const useCompanyTheme = () => {
        setAppTheme(companyThemeKey, { userOverride: false });
        setActiveThemeKey(companyThemeKey);
        setIsPersonalTheme(false);
    };

    return (
        <MainLayout>
            <section className="min-h-[calc(100vh-8.5rem)] rounded-lg border border-white/10 bg-[#090b13]/80">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/35">Preferences</p>
                        <h2 className="mt-1 text-xl font-semibold text-white">Settings</h2>
                        <p className="mt-1 text-sm text-white/45">Choose a workspace theme for your employee account.</p>
                    </div>
                    <button
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-sm font-semibold text-white/65 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
                        type="button"
                        disabled={!isPersonalTheme || systemSettingsLoading}
                        onClick={useCompanyTheme}
                    >
                        <FiRefreshCcw className="size-4" aria-hidden="true" />
                        Company Theme
                    </button>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-3">
                    {[
                        ["Active Theme", activeTheme.name],
                        ["Preference", isPersonalTheme ? "Personal" : "Company default"],
                        ["Company Default", companyTheme.name],
                    ].map(([label, value]) => (
                        <div key={label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/35">{label}</p>
                            <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                        </div>
                    ))}
                </div>

                <div className="px-5 pb-5">
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {themeOptions.map((theme) => {
                            const isActive = activeThemeKey === theme.key;
                            const isCompanyDefault = companyThemeKey === theme.key;
                            const isLightTheme = theme.key.startsWith("light-") || theme.key.startsWith("mail-");

                            return (
                                <button
                                    key={theme.key}
                                    className={[
                                        "group rounded-lg border p-4 text-left transition",
                                        isActive
                                            ? "theme-primary-border theme-primary-soft-bg text-white shadow-xl shadow-black/15"
                                            : "border-white/10 bg-white/[0.035] text-white/70 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
                                    ].join(" ")}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => chooseTheme(theme.key)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="min-w-0">
                                            <span className="block truncate text-sm font-semibold text-white">{theme.name}</span>
                                            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-white/45">{theme.description}</span>
                                        </span>
                                        <span
                                            className={[
                                                "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                                                isActive ? "border-white/20 bg-white text-[var(--primary-dark)]" : "border-white/10 bg-black/20 text-white/35",
                                            ].join(" ")}
                                        >
                                            {isActive ? <FiCheck className="size-4" aria-hidden="true" /> : <FiMonitor className="size-4" aria-hidden="true" />}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex items-center gap-1.5">
                                        {[theme.colors.primary, theme.colors.secondary, theme.colors.app, theme.colors.panel].map((color) => (
                                            <span key={color} className="size-6 rounded-md border border-white/10" style={{ backgroundColor: color }} />
                                        ))}
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/55">
                                            {isLightTheme ? "Light" : "Dark"}
                                        </span>
                                        {isCompanyDefault && (
                                            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs font-semibold text-white/55">
                                                Company
                                            </span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>
        </MainLayout>
    );
}
