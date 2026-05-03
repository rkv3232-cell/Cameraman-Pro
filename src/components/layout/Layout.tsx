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
        <div className="flex bg-[var(--bg-primary)] min-h-screen relative transition-colors duration-500 overflow-x-auto">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-lg shadow-lg text-[var(--text-primary)] active:scale-95 transition-transform"
            >
                <Menu size={20} />
            </button>

            {/* Sidebar - Collapsible on mobile, fixed width on desktop */}
            <div className={`
                fixed lg:sticky top-0 left-0 h-screen z-50 transition-all duration-300 ease-in-out border-r border-[var(--border-light)] bg-[var(--surface-base)]
                ${isSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0'}
                flex-shrink-0
            `}>
                <Sidebar />
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-fade-in"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content - No margin-left on mobile to use full width, sticky margin on desktop */}
            <main className="flex-1 lg:ml-0 p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 overflow-y-auto main-safe-area bg-[var(--bg-primary)] min-w-[1000px] lg:min-w-0">
                <div className="max-w-7xl mx-auto animate-fade-in">
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
