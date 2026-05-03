import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BabuChat, BabuWidget } from "../ai";
import VoiceActivationButton from "../ai/VoiceActivationButton";
import { useBabu } from "../../hooks/useBabu";
import CommandPalette from "../ui/CommandPalette";
import QuickActionBar from "../ui/QuickActionBar";
import MobileNav from "../mobile/MobileNav";
import { Menu, Search } from "lucide-react";
import { Logo } from "./Logo";


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

    return (
        <div className="flex bg-[var(--bg-primary)] min-h-screen relative overflow-x-auto">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-lg shadow-md text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
                <Menu size={20} />
            </button>

            {/* Sidebar - Instant toggle (no sliding), sticky on left */}
            <div className={`
                ${isSidebarOpen ? 'block' : 'hidden lg:block'} 
                sticky left-0 top-0 h-screen w-64 border-r border-[var(--border-light)] bg-[var(--surface-base)] z-50 flex-shrink-0
            `}>
                <Sidebar />
            </div>

            {/* Main Content - Horizontally scrollable */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 pb-12 overflow-y-auto main-safe-area bg-[var(--bg-primary)] min-w-[1200px]">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Removed Mobile Bottom Navigation to match PC view */}

            {/* Global Command Palette (Ctrl+K) */}
            <CommandPalette />

            {/* Voice Activation Button */}
            {!voiceActivated && (
                <VoiceActivationButton onActivated={handleVoiceActivation} />
            )}

            {/* Floating Action Buttons */}
            <div className="fixed right-4 bottom-24 lg:bottom-6 lg:right-6 z-50 flex items-center gap-3">
                <div className="block">
                    <QuickActionBar />
                </div>
                <BabuWidget isOpen={isOpen} onToggle={toggle} />
            </div>

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
