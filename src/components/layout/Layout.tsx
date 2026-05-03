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

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex bg-[var(--bg-primary)] min-h-screen relative transition-colors duration-500 overflow-x-auto">
            {/* Sidebar - Always visible as part of the layout structure */}
            <div className="flex-shrink-0 w-64 border-r border-[var(--border-light)] z-50">
                <Sidebar />
            </div>

            {/* Main Content - Constant margin-left to accommodate sidebar */}
            <main className="flex-1 min-w-[1200px] p-4 sm:p-6 lg:p-8 pt-8 overflow-y-auto main-safe-area bg-[var(--bg-primary)]">
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
