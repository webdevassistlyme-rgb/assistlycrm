export type ThemeKey =
    | "theme-1"
    | "light-command"
    | "flat-amethyst"
    | "flat-turquoise"
    | "flat-emerald"
    | "flat-river"
    | "flat-alizarin"
    | "light-clouds"
    | "light-silver"
    | "light-turquoise"
    | "light-river"
    | "light-amethyst"
    | "mail-purple"
    | "mail-lavender"
    | "mail-indigo"
    | "mail-violet";

export type ThemeDefinition = {
    key: ThemeKey;
    name: string;
    description: string;
    colors: {
        app: string;
        shell: string;
        surface: string;
        panel: string;
        modal: string;
        primary: string;
        primaryDark: string;
        primarySoft: string;
        primaryText: string;
        secondary: string;
    };
};

export const themeOptions: ThemeDefinition[] = [
    {
        key: "theme-1",
        name: "Theme 1",
        description: "Current Assistly purple.",
        colors: {
            app: "#070910",
            shell: "#070910",
            surface: "#090b13",
            panel: "#11141d",
            modal: "#0d1018",
            primary: "#842cff",
            primaryDark: "#4a0ebd",
            primarySoft: "#9b5cff",
            primaryText: "#b994ff",
            secondary: "#238aff",
        },
    },
    {
        key: "light-command",
        name: "Command White",
        description: "Clean white workspace with slate navigation and multi-color operations signals.",
        colors: {
            app: "#eef3f9",
            shell: "#ffffff",
            surface: "#ffffff",
            panel: "#f1f5f9",
            modal: "#ffffff",
            primary: "#4f46e5",
            primaryDark: "#3730a3",
            primarySoft: "#6366f1",
            primaryText: "#4338ca",
            secondary: "#0891b2",
        },
    },
    {
        key: "flat-amethyst",
        name: "Amethyst",
        description: "Flat UI amethyst over midnight.",
        colors: {
            app: "#0b1018",
            shell: "#101722",
            surface: "#121b28",
            panel: "#1c2836",
            modal: "#162231",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#a569bd",
            primaryText: "#d2b4de",
            secondary: "#34495e",
        },
    },
    {
        key: "flat-turquoise",
        name: "Turquoise",
        description: "Purple main with Flat UI turquoise support.",
        colors: {
            app: "#071210",
            shell: "#0b1a18",
            surface: "#0d1f1c",
            panel: "#15332e",
            modal: "#102923",
            primary: "#8e44ad",
            primaryDark: "#6c3483",
            primarySoft: "#9b59b6",
            primaryText: "#d7bde2",
            secondary: "#1abc9c",
        },
    },
    {
        key: "flat-emerald",
        name: "Emerald",
        description: "Purple main with Flat UI emerald contrast.",
        colors: {
            app: "#08110d",
            shell: "#0f1b14",
            surface: "#13231a",
            panel: "#1e3327",
            modal: "#16281e",
            primary: "#8e44ad",
            primaryDark: "#6c3483",
            primarySoft: "#9b59b6",
            primaryText: "#d7bde2",
            secondary: "#2ecc71",
        },
    },
    {
        key: "flat-river",
        name: "Peter River",
        description: "Purple main with Flat UI blue depth.",
        colors: {
            app: "#07101b",
            shell: "#0b1726",
            surface: "#101f33",
            panel: "#172d49",
            modal: "#12243a",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#9b59b6",
            primaryText: "#d7bde2",
            secondary: "#3498db",
        },
    },
    {
        key: "flat-alizarin",
        name: "Alizarin",
        description: "Purple main with Flat UI red warmth.",
        colors: {
            app: "#140b10",
            shell: "#211018",
            surface: "#28131d",
            panel: "#3a1f2b",
            modal: "#2f1823",
            primary: "#8e44ad",
            primaryDark: "#6c3483",
            primarySoft: "#9b59b6",
            primaryText: "#e8daef",
            secondary: "#e74c3c",
        },
    },
    {
        key: "light-clouds",
        name: "Cloud White",
        description: "White workspace with purple controls.",
        colors: {
            app: "#f7f9fb",
            shell: "#ffffff",
            surface: "#ffffff",
            panel: "#ecf0f1",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#6c3483",
            primarySoft: "#9b59b6",
            primaryText: "#6c3483",
            secondary: "#bdc3c7",
        },
    },
    {
        key: "light-silver",
        name: "Silver Slate",
        description: "Flat UI clouds and silver base.",
        colors: {
            app: "#ecf0f1",
            shell: "#f8fafb",
            surface: "#ffffff",
            panel: "#dfe6e9",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#a569bd",
            primaryText: "#5b2c6f",
            secondary: "#95a5a6",
        },
    },
    {
        key: "light-turquoise",
        name: "White Turquoise",
        description: "White base with Flat UI turquoise support.",
        colors: {
            app: "#f4fbfa",
            shell: "#ffffff",
            surface: "#ffffff",
            panel: "#e8f8f5",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#6c3483",
            primarySoft: "#9b59b6",
            primaryText: "#6c3483",
            secondary: "#1abc9c",
        },
    },
    {
        key: "light-river",
        name: "White River",
        description: "White base with Flat UI blue accents.",
        colors: {
            app: "#f4f8fc",
            shell: "#ffffff",
            surface: "#ffffff",
            panel: "#eaf3fb",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#9b59b6",
            primaryText: "#5b2c6f",
            secondary: "#3498db",
        },
    },
    {
        key: "light-amethyst",
        name: "White Amethyst",
        description: "White base with richer purple contrast.",
        colors: {
            app: "#fbf7fd",
            shell: "#ffffff",
            surface: "#ffffff",
            panel: "#f1e7f6",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#a569bd",
            primaryText: "#5b2c6f",
            secondary: "#9b59b6",
        },
    },
    {
        key: "mail-purple",
        name: "Purple Mail",
        description: "Strong purple sidebar with white work surface.",
        colors: {
            app: "#f5f6fb",
            shell: "#1f2236",
            surface: "#ffffff",
            panel: "#eef3ff",
            modal: "#ffffff",
            primary: "#6f4bff",
            primaryDark: "#4b32c3",
            primarySoft: "#8b6cff",
            primaryText: "#4b32c3",
            secondary: "#2f80ed",
        },
    },
    {
        key: "mail-lavender",
        name: "Lavender Mail",
        description: "Strong purple sidebar with a soft lavender workspace.",
        colors: {
            app: "#f0ecfa",
            shell: "#1f2236",
            surface: "#f8f6ff",
            panel: "#e4ddf4",
            modal: "#fbfaff",
            primary: "#6f4bff",
            primaryDark: "#4b32c3",
            primarySoft: "#8b6cff",
            primaryText: "#4b32c3",
            secondary: "#2f80ed",
        },
    },
    {
        key: "mail-indigo",
        name: "Indigo Mail",
        description: "Deep indigo navigation and crisp white content.",
        colors: {
            app: "#f4f7fb",
            shell: "#1b1f3a",
            surface: "#ffffff",
            panel: "#e9efff",
            modal: "#ffffff",
            primary: "#7c3aed",
            primaryDark: "#4c1d95",
            primarySoft: "#a78bfa",
            primaryText: "#4c1d95",
            secondary: "#3b82f6",
        },
    },
    {
        key: "mail-violet",
        name: "Violet Mail",
        description: "Aubergine sidebar with soft violet inbox panels.",
        colors: {
            app: "#fbf7fb",
            shell: "#24152e",
            surface: "#ffffff",
            panel: "#f0e7ff",
            modal: "#ffffff",
            primary: "#8e44ad",
            primaryDark: "#5b2c6f",
            primarySoft: "#b084d6",
            primaryText: "#5b2c6f",
            secondary: "#f39c12",
        },
    },
];

export const defaultThemeKey: ThemeKey = "theme-1";

export function isThemeKey(value: string): value is ThemeKey {
    return themeOptions.some((theme) => theme.key === value);
}

export function getTheme(key?: string) {
    return themeOptions.find((theme) => theme.key === key) || themeOptions[0];
}
