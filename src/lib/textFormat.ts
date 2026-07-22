export function formatStoredMultilineText(value: unknown, fallback = "") {
    const rawText = typeof value === "string" ? value : value == null ? "" : String(value);
    const text = rawText || fallback;

    return text
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\n");
}
