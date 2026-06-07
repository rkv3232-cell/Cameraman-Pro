import { useState } from 'react';
import { Bot, Mic, Volume2, X, MessageCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UnifiedFloatingActionsProps {
    isOpen: boolean;
    onToggleChat: () => void;
    voiceActivated: boolean;
    handleVoiceActivation: () => void;
    isListening: boolean;
    startVoiceCommand: () => void;
}

export function UnifiedFloatingActions({
    isOpen,
    onToggleChat,
    voiceActivated,
    handleVoiceActivation,
    isListening,
    startVoiceCommand,
}: UnifiedFloatingActionsProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        if (isOpen) {
            onToggleChat();
        } else {
            setIsMenuOpen(!isMenuOpen);
        }
    };

    const handleAction = (callback: () => void) => {
        setIsMenuOpen(false);
        callback();
    };

    return (
        <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3 select-none">
            {/* Quick Actions List (Expandable) */}
            <AnimatePresence>
                {isMenuOpen && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="flex flex-col gap-2 mb-2 items-end"
                    >
                        {/* WhatsApp Support Option */}
                        <motion.a
                            href="https://wa.me/918601343232?text=Hello%20Cameraman%20Pro"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsMenuOpen(false)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white rounded-xl shadow-lg border border-emerald-500/20 text-sm font-semibold hover:shadow-emerald-500/20 transition-shadow"
                        >
                            <span>WhatsApp Support</span>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <MessageCircle size={18} />
                            </div>
                        </motion.a>

                        {/* Voice Control Option */}
                        <motion.button
                            onClick={() => handleAction(voiceActivated ? startVoiceCommand : handleVoiceActivation)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-3 px-4 py-2.5 text-white rounded-xl shadow-lg text-sm font-semibold transition-shadow ${
                                voiceActivated
                                    ? isListening
                                        ? 'bg-red-600 animate-pulse border-red-500/20'
                                        : 'bg-gradient-to-r from-amber-600 to-yellow-500 border-amber-500/20'
                                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500/20'
                            } border`}
                        >
                            <span>
                                {voiceActivated
                                    ? isListening
                                        ? 'Listening...'
                                        : 'Talk to BĀBU'
                                    : 'Activate BĀBU Voice'}
                            </span>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                {isListening ? (
                                    <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                    </span>
                                ) : voiceActivated ? (
                                    <Mic size={18} />
                                ) : (
                                    <Volume2 size={18} />
                                )}
                            </div>
                        </motion.button>

                        {/* BĀBU AI Chat Option */}
                        <motion.button
                            onClick={() => handleAction(onToggleChat)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white rounded-xl shadow-lg border border-[var(--accent-primary)]/20 text-sm font-semibold hover:shadow-[var(--accent-primary)]/20 transition-shadow"
                        >
                            <span>BĀBU AI Chat</span>
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <Bot size={18} />
                            </div>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Trigger Button */}
            <motion.button
                onClick={toggleMenu}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`relative flex items-center justify-center w-14 h-14 rounded-[18px] border transition-all duration-300 shadow-xl ${
                    isOpen
                        ? 'bg-red-500 hover:bg-red-600 border-red-500/30 text-white shadow-red-500/20'
                        : isMenuOpen
                        ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white'
                        : 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] hover:from-[var(--accent-secondary)] hover:to-[var(--accent-tertiary)] border-white/10 text-white shadow-[var(--accent-primary)]/20'
                }`}
                aria-label={isOpen ? 'Close BĀBU Chat' : isMenuOpen ? 'Close Menu' : 'Open Copilot Menu'}
            >
                {/* Glow ring */}
                {!isOpen && !isMenuOpen && (
                    <span className="absolute inset-0 rounded-[18px] bg-[var(--accent-primary)] blur-md opacity-30 animate-pulse pointer-events-none" />
                )}

                {isOpen ? (
                    <X size={24} className="rotate-90 transition-transform duration-300" />
                ) : isMenuOpen ? (
                    <X size={24} />
                ) : (
                    <div className="relative">
                        <Sparkles size={24} className="animate-pulse" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                    </div>
                )}
            </motion.button>
        </div>
    );
}
