import * as React from 'react';
import { useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import VoiceIndicator from './VoiceIndicator';

import { BabuAction } from '../../lib/babuIntelligence';

export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    metadata?: any;
    ui_components?: any[];
    actions?: BabuAction[];
}

interface BabuChatProps {
    isOpen: boolean;
    messages: Message[];
    isLoading: boolean;
    onSendMessage: (text: string) => void;
    executeAction?: (action: BabuAction) => void;
    className?: string;
}

export function BabuChat({ isOpen, messages, isLoading, onSendMessage, executeAction, className }: BabuChatProps) {
    const [inputText, setInputText] = React.useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim() || isLoading) return;

        onSendMessage(inputText);
        setInputText('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className={twMerge(
                clsx(
                    "fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)]",
                    "bg-white dark:bg-gray-900 rounded-xl shadow-lg shadow-purple-900/20 border border-white/10",
                    "flex flex-col overflow-hidden z-40 transition-all duration-300 animate-in slide-in-from-bottom-10 fade-in",
                    className
                )
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-indigo-600 dark:bg-indigo-900 text-white shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500 rounded-full">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-none">BABU</h3>
                        <p className="text-xs text-indigo-200 mt-1">Studio Intelligence Manager</p>
                    </div>
                </div>
                <VoiceIndicator className="text-indigo-100" />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950/50">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-6 opacity-70">
                        <Bot className="w-12 h-12 mb-3 text-indigo-300 opacity-50" />
                        <p className="font-medium text-sm">नमस्ते! मैं बाबू हूँ।</p>
                        <p className="text-xs mt-1">आपका स्टूडियो मैनेजर। बताइए आज क्या काम है?</p>
                        <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-xs">
                            <button
                                onClick={() => onSendMessage("आज का schedule क्या है?")}
                                className="text-xs p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left"
                            >
                                📅 आज का schedule क्या है?
                            </button>
                            <button
                                onClick={() => onSendMessage("Pending payments दिखाओ")}
                                className="text-xs p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left"
                            >
                                💰 Pending payments दिखाओ
                            </button>
                            <button
                                onClick={() => onSendMessage("Nayi booking create karni hai")}
                                className="text-xs p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-left"
                            >
                                ➕ नई बुकिंग बनानी है
                            </button>
                        </div>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={clsx(
                                "flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300",
                                msg.role === 'user' ? "justify-end" : "justify-start"
                            )}
                        >
                            <div
                                className={clsx(
                                    "max-w-[85%] rounded-2xl p-3 shadow-sm relative group",
                                    msg.role === 'user'
                                        ? "bg-indigo-600 text-white rounded-br-none"
                                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-700"
                                )}
                            >
                                {/* Message Content - Custom Markdown-like Rendering */}
                                <div className="text-sm leading-relaxed font-sans">
                                    {msg.content.split('\n').map((line, i) => {
                                        // Check if line is a bullet point
                                        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('• ');
                                        const cleanLine = isBullet ? line.trim().substring(2) : line;

                                        // Process bold (**text**) and italic (*text*)
                                        const parts = cleanLine.split(/(\*\*.*?\*\*|\*.*?\*)/g).map((part, j) => {
                                            if (part.startsWith('**') && part.endsWith('**')) {
                                                return <strong key={j} className="font-bold text-indigo-700 dark:text-indigo-300">{part.slice(2, -2)}</strong>;
                                            }
                                            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                                                // Ensure it's not actually bold (already handled above, but just in case)
                                                return <em key={j} className="italic text-gray-600 dark:text-gray-400">{part.slice(1, -1)}</em>;
                                            }
                                            return part;
                                        });

                                        if (isBullet) {
                                            return (
                                                <div key={i} className="flex gap-2 ml-1 mb-1 items-start">
                                                    <span className="text-indigo-500 mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                                    <span className="flex-1">{parts}</span>
                                                </div>
                                            );
                                        }

                                        // Only add line break if it's not the last line and not empty
                                        if (line.trim() === '') {
                                            return <div key={i} className="h-2" />;
                                        }

                                        return (
                                            <div key={i} className="min-h-[1.2em]">
                                                {parts}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Enhanced Action Buttons from Intelligence */}
                                {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        {msg.actions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => executeAction?.(action)}
                                                className={clsx(
                                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-all border shadow-sm hover:shadow-md",
                                                    action.style === 'primary'
                                                        ? "bg-indigo-600 text-white border-transparent hover:bg-indigo-700"
                                                        : action.style === 'success'
                                                            ? "bg-green-50 text-green-600 border-green-200 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                                                            : action.style === 'danger'
                                                                ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                                                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Dynamic UI Components from AI */}
                                {msg.role === 'assistant' && (msg.ui_components?.length || msg.metadata?.requires_confirmation) && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                                        {/* Render Generic UI Components */}
                                        {msg.ui_components?.map((component: any, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    if (component.type === 'button') {
                                                        const action = component.action || component.label;
                                                        if (action.startsWith('tel:') || action.startsWith('http')) {
                                                            window.open(action, '_blank');
                                                        } else {
                                                            onSendMessage(action);
                                                        }
                                                    }
                                                }}
                                                className={clsx(
                                                    "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border shadow-sm",
                                                    component.style === 'primary'
                                                        ? "bg-indigo-600 text-white border-transparent hover:bg-indigo-700"
                                                        : component.style === 'danger'
                                                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                                                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                )}
                                            >
                                                {component.label}
                                            </button>
                                        ))}

                                        {/* Fallback for explicit confirmation metadata if not covered by ui_components */}
                                        {msg.metadata?.requires_confirmation && !msg.ui_components && (
                                            <div className="flex flex-col gap-2 w-full">
                                                <p className="text-xs font-semibold text-red-500 flex items-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Confirmation Required
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onSendMessage("Confirmed. Please proceed.")}
                                                        className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors font-medium"
                                                    >
                                                        Yes, I'm sure
                                                    </button>
                                                    <button
                                                        onClick={() => onSendMessage("Cancel")}
                                                        className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors font-medium"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={clsx(
                                    "text-[10px] mt-1 opacity-70",
                                    msg.role === 'user' ? "text-indigo-100" : "text-gray-400"
                                )}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))
                )}

                {isLoading && (
                    <div className="flex justify-start w-full animate-pulse">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-bl-none p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                            <span className="text-xs text-gray-500 font-medium">BABU सोच रहा है...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
                <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                    <textarea
                        ref={inputRef}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="बाबू से पूछें... (e.g. आज की bookings दिखाओ)"
                        className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl p-3 pr-10 text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none max-h-32 min-h-[44px]"
                        rows={1}
                        style={{ height: 'auto', minHeight: '44px' }}
                    />
                    <button
                        type="submit"
                        disabled={!inputText.trim() || isLoading}
                        className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
                <div className="text-center mt-2">
                    <p className="text-[10px] text-gray-400">Context-Aware AI • Created by Raj Verma</p>
                </div>
            </div>
        </div>
    );
}
