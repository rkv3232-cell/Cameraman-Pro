import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { BabuChat, BabuWidget } from "../ai";
import VoiceActivationButton from "../ai/VoiceActivationButton";
import { useBabu } from "../../hooks/useBabu";
import CommandPalette from "../ui/CommandPalette";
import QuickActionBar from "../ui/QuickActionBar";
import { useNotifications } from "../../hooks/useNotifications";

import { Menu } from "lucide-react";

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
    const { permission, requestPermission } = useNotifications();

    // Show a prompt for notification permission if not yet decided
    useEffect(() => {
        if (permission === 'default') {
            const timer = setTimeout(() => {
                if (window.confirm("Allow Cameraman Pro notifications to receive booking reminders?")) {
                    requestPermission();
                }
            }, 3000); // Wait 3 seconds before asking
            return () => clearTimeout(timer);
        }
    }, [permission, requestPermission]);

    return (
        <div className="flex bg-[var(--bg-primary)] min-h-screen relative overflow-x-hidden w-full max-w-full">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-lg shadow-md text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
            >
                <Menu size={20} />
            </button>

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-[45] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
                fixed lg:sticky left-0 top-0 h-screen w-64 border-r border-[var(--border-light)] bg-[var(--surface-base)] z-50 flex-shrink-0 transition-transform duration-200 ease-in-out
            `}>
                <Sidebar onCloseMobile={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content */}
            <main className="flex-1 w-full min-w-0 max-w-full p-4 sm:p-6 lg:p-8 pt-20 lg:pt-8 pb-24 lg:pb-12 overflow-y-auto main-safe-area bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto w-full min-w-0">
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
