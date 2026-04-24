import { Bot, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BabuWidgetProps {
    isOpen: boolean;
    onToggle: () => void;
    className?: string;
}

export function BabuWidget({ isOpen, onToggle, className }: BabuWidgetProps) {
    return (
        <button
            onClick={onToggle}
            className={twMerge(
                clsx(
                    "relative flex items-center justify-center transition-all duration-300 shadow-lg shadow-purple-900/20 hover:shadow-xl hover:shadow-purple-900/30",
                    "w-14 h-14 rounded-xl border border-white/10",
                    isOpen
                        ? "bg-red-500 hover:bg-red-600 rotate-90"
                        : "bg-indigo-600 hover:bg-indigo-700 hover:scale-110",
                    className
                )
            )}
            aria-label={isOpen ? "Close BABU Assistant" : "Open BABU Assistant"}
        >
            {isOpen ? (
                <X className="w-8 h-8 text-white transition-transform duration-300" />
            ) : (
                <div className="relative">
                    <Bot className="w-8 h-8 text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                </div>
            )}
        </button>
    );
}
