import { useState, useEffect, useCallback, useRef, Component, ReactNode } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BabuChat } from "../ai";
import { UnifiedFloatingActions } from "./UnifiedFloatingActions";
import { useBabu } from "../../hooks/useBabu";
import CommandPalette from "../ui/CommandPalette";
import { useNotifications } from "../../hooks/useNotifications";
import { Logo } from "./Logo";
import ThemeToggle from "../ui/ThemeToggle";
import { Menu } from "lucide-react";

// ─── RouteErrorBoundary ────────────────────────────────────────────────────────
class RouteErrorBoundary extends Component<
    { children: ReactNode; title: string },
    { hasError: boolean; error: any }
> {
    state: { hasError: boolean; error: any } = { hasError: false, error: null };

    static getDerivedStateFromError(error: any) {
        return { hasError: true, error };
    }

    componentDidCatch(error: any, errorInfo: any) {
        console.error("RouteErrorBoundary caught an error:", error, errorInfo);
    }

    componentDidUpdate(prevProps: { title: string }) {
        if (prevProps.title !== this.props.title && this.state.hasError) {
            this.setState({ hasError: false, error: null });
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="bg-[var(--surface-base)] rounded-[24px] border border-red-500/20 p-8 text-center max-w-md mx-auto my-12 shadow-lg animate-fade-in">
                    <h2 className="text-xl font-bold text-red-500 mb-2">{this.props.title}</h2>
                    <p className="text-[var(--text-secondary)] mb-6 text-sm">
                        {this.state.error?.message || "There was an error loading this section. Please try reloading the page."}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-sm font-medium py-2.5 px-5 rounded-xl transition-all"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Layout ────────────────────────────────────────────────────────────────────
export const Layout = () => {
    const {
        isOpen,
        toggle,
        messages,
        sendMessage,
        isLoading,
        executeAction,
        voiceActivated,
        handleVoiceActivation,
        isListening,
        startVoiceCommand
    } = useBabu();

    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // ── Instance ID: verify only ONE Layout is ever mounted ──────────────────
    const instanceId = useRef(`layout-${Math.random().toString(36).slice(2, 7)}`);
    useEffect(() => {
        console.log("[LAYOUT] MobileSidebar instance mounted →", instanceId.current);
        return () => {
            console.log("[LAYOUT] MobileSidebar instance UNMOUNTED →", instanceId.current);
        };
    }, []);

    // ── Stable close handler ─────────────────────────────────────────────────
    // useCallback([]) guarantees the SAME function reference across all renders.
    // This prevents SidebarItem from capturing a stale onCloseMobile closure.
    const closeSidebar = useCallback(() => {
        console.log("[SIDEBAR STATE]", false, "← CLOSE REQUEST fired");
        setIsSidebarOpen(false);
    }, []);

    // ── Route change → auto-close ─────────────────────────────────────────────
    useEffect(() => {
        console.log("[ROUTE CHANGE]", location.pathname);
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // ── Escape key ───────────────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isSidebarOpen) {
                console.log("[SIDEBAR STATE]", false, "← ESC key");
                closeSidebar();
            }
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isSidebarOpen, closeSidebar]);

    // ── Body scroll lock ─────────────────────────────────────────────────────
    useEffect(() => {
        console.log("[SIDEBAR STATE]", isSidebarOpen);
        if (isSidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isSidebarOpen]);

    // ── Notifications ────────────────────────────────────────────────────────
    const { permission, requestPermission } = useNotifications();
    useEffect(() => {
        if (permission === 'default') {
            const timer = setTimeout(() => { requestPermission(); }, 3000);
            return () => clearTimeout(timer);
        }
    }, [permission, requestPermission]);

    const isBookings = location.pathname.startsWith('/bookings');
    const routeErrorTitle = isBookings ? "Bookings page unavailable" : "Section unavailable";

    return (
        <div className="flex bg-[var(--bg-primary)] h-screen overflow-hidden w-full max-w-full">

            {/* ── Mobile Header ─────────────────────────────────────────────── */}
            <header className="topbar lg:hidden fixed top-0 left-0 right-0 w-full z-30">
                <div className="topbar-inner">
                    <div className="topbar-logo-group">
                        {!isSidebarOpen && (
                            <button
                                onClick={() => {
                                    console.log("[MENU CLICK]");
                                    console.log("[SIDEBAR STATE]", true, "← hamburger");
                                    setIsSidebarOpen(true);
                                }}
                                className="p-2 -ml-1 rounded-xl text-white/90 hover:bg-white/10 active:scale-95 transition-all"
                                aria-label="Open menu"
                            >
                                <Menu size={22} />
                            </button>
                        )}
                        <Logo size="sm" />
                    </div>
                    <div className="topbar-actions">
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            {/*
             * ── NO FRAMER MOTION — CSS-ONLY SIDEBAR (DIAGNOSTIC MODE) ─────────
             *
             * RATIONALE: AnimatePresence + spring animations were suspected of
             * causing the inconsistent close. To isolate, we:
             *   1. Keep sidebar ALWAYS MOUNTED (never conditionally rendered)
             *   2. Use CSS translateX + transition to slide in/out
             *   3. Use a plain <div> backdrop controlled by pointer-events + opacity
             *
             * If the bug disappears → animations were the root cause.
             * If the bug persists  → state ownership is the root cause.
             *
             * INSTANCE CHECK: Only ONE <Sidebar onCloseMobile={...}> exists here.
             * The desktop sidebar (<Sidebar />) has no onCloseMobile prop, so its
             * SidebarItem onClick handlers receive `undefined` for that slot —
             * they cannot accidentally call closeSidebar.
             */}

            {/* Backdrop — always in DOM, toggled via opacity + pointer-events */}
            <div
                className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-200"
                style={{
                    opacity: isSidebarOpen ? 1 : 0,
                    pointerEvents: isSidebarOpen ? "auto" : "none",
                }}
                onClick={() => {
                    console.log("[BACKDROP CLICK]");
                    closeSidebar();
                }}
                aria-hidden="true"
            />

            {/* Mobile Sidebar Drawer — always in DOM, slide via CSS translate */}
            <div
                className="lg:hidden fixed left-0 top-0 h-screen w-[min(82vw,320px)] z-50 overflow-hidden rounded-r-[24px] shadow-2xl transition-transform duration-300 ease-in-out"
                style={{ transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)" }}
                aria-hidden={!isSidebarOpen}
            >
                <Sidebar onCloseMobile={closeSidebar} />
            </div>

            {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
            <div className="hidden lg:block sticky left-0 top-0 h-screen w-64 flex-shrink-0">
                <Sidebar />
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <main className="flex-1 w-full min-w-0 max-w-full p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-12 overflow-y-auto main-safe-area bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto w-full min-w-0">
                    <RouteErrorBoundary title={routeErrorTitle}>
                        <Outlet />
                    </RouteErrorBoundary>
                </div>
            </main>

            {/* ── Global Command Palette ────────────────────────────────────── */}
            <CommandPalette />

            {/* ── Unified Floating Actions ──────────────────────────────────── */}
            <UnifiedFloatingActions
                isOpen={isOpen}
                onToggleChat={toggle}
                voiceActivated={voiceActivated}
                handleVoiceActivation={handleVoiceActivation}
                isListening={isListening}
                startVoiceCommand={startVoiceCommand}
            />

            <BabuChat
                isOpen={isOpen}
                messages={messages}
                isLoading={isLoading}
                isListening={isListening}
                onSendMessage={sendMessage}
                onStartVoice={startVoiceCommand}
                executeAction={executeAction}
            />
        </div>
    );
};
