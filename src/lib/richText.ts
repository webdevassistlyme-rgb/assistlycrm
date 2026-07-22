import DOMPurify from "dompurify";
import { formatStoredMultilineText } from "./textFormat";

const htmlPattern = /<\/?[a-z][\s\S]*>/i;

export function isRichTextContent(value: unknown) {
    return htmlPattern.test(formatStoredMultilineText(value));
}

export function sanitizeRichText(value: unknown, fallback = "") {
    return DOMPurify.sanitize(formatStoredMultilineText(value, fallback), {
        USE_PROFILES: { html: true },
        ADD_TAGS: ["figure", "figcaption"],
        ADD_ATTR: ["alt", "class", "height", "rel", "sizes", "src", "srcset", "style", "target", "width"],
    });
}

export function getPlainTextFromRichText(value: unknown, fallback = "") {
    const content = formatStoredMultilineText(value, fallback);

    if (!isRichTextContent(content)) {
        return content;
    }

    if (typeof document === "undefined") {
        return content
            .replace(/<[^>]*>/g, " ")
            .replace(/&nbsp;/gi, " ")
            .replace(/\s+/g, " ")
            .trim();
    }

    const container = document.createElement("div");
    container.innerHTML = sanitizeRichText(content);

    return (container.textContent || container.innerText || "").replace(/\s+/g, " ").trim();
}
