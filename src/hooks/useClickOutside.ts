import { useEffect, type RefObject } from "react";

export function useClickOutside<T extends HTMLElement>(
    ref: RefObject<T | null>,
    onOutsideClick: () => void,
    enabled = true,
    ignoredRefs: RefObject<HTMLElement | null>[] = []
) {
    useEffect(() => {
        if (!enabled) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as Node | null;

            if (!target || ref.current?.contains(target) || ignoredRefs.some((ignoredRef) => ignoredRef.current?.contains(target))) {
                return;
            }

            onOutsideClick();
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () => document.removeEventListener("pointerdown", handlePointerDown);
    }, [enabled, ignoredRefs, onOutsideClick, ref]);
}
