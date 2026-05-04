import type { ReactNode } from "react";
import { useRef, useState } from "react";
import Navbar from "./navbar";
import SideBar from "./sidebar";

type Props = {
    children: ReactNode;
};

export default function MainLayout({ children }: Props) {
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimer = useRef<number | undefined>(undefined);

    const handleScroll = () => {
        setIsScrolling(true);
        window.clearTimeout(scrollTimer.current);
        scrollTimer.current = window.setTimeout(() => setIsScrolling(false), 700);
    };

    return (
        <div className="h-screen overflow-hidden bg-[#070910] text-white">
            <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_0%_20%,rgba(105,41,255,0.18),transparent_28%),radial-gradient(circle_at_95%_0%,rgba(105,41,255,0.14),transparent_24%),linear-gradient(135deg,rgba(255,255,255,0.035),transparent_26%)]" />
            <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20" />
            <SideBar />
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
