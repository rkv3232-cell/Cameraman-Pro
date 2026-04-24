import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { Search, ArrowRight, Command } from 'lucide-react';

/**
 * Global Command Palette (Ctrl+K)
 * Searches across bookings, clients, equipment, expenses
 */
export default function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const { results, search, clear } = useGlobalSearch();
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Ctrl+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setInputValue('');
            clear();
            setSelectedIndex(0);
        }
    }, [isOpen, clear]);

    // Search on input change
    useEffect(() => {
        search(inputValue);
        setSelectedIndex(0);
    }, [inputValue, search]);

    // Keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter' && results[selectedIndex]) {
            navigate(results[selectedIndex].path);
            setIsOpen(false);
        }
    }, [results, selectedIndex, navigate]);

    // Group results by type
    const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
        const key = r.type;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
    }, {});

    const typeLabels: Record<string, string> = {
        booking: '📋 Bookings',
        client: '👤 Clients',
        equipment: '📦 Equipment',
        expense: '💸 Expenses'
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
            />

            {/* Palette */}
            <div className="relative w-full max-w-xl bg-[var(--surface-base)] rounded-2xl shadow-2xl border border-[var(--border-light)] overflow-hidden animate-scale-in">
                {/* Search Input */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-light)]">
                    <Search size={20} className="text-[var(--text-tertiary)] shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search bookings, clients, equipment..."
                        className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none text-base"
                    />
                    <div className="flex items-center gap-1.5">
                        <kbd className="px-2 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded text-[10px] font-mono text-[var(--text-tertiary)]">
                            ESC
                        </kbd>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto py-2">
                    {inputValue.length < 2 ? (
                        <div className="px-5 py-8 text-center">
                            <div className="inline-flex items-center gap-2 text-[var(--text-tertiary)] text-sm">
                                <Command size={14} />
                                <span>Type to search across your entire studio</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 justify-center">
                                {['Client name', 'Booking', 'Camera', 'Expense'].map(hint => (
                                    <button
                                        key={hint}
                                        onClick={() => setInputValue(hint.toLowerCase())}
                                        className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                    >
                                        {hint}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="px-5 py-8 text-center text-[var(--text-secondary)]">
                            No results found for "{inputValue}"
                        </div>
                    ) : (
                        Object.entries(grouped).map(([type, items]) => (
                            <div key={type}>
                                <p className="px-5 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                                    {typeLabels[type] || type}
                                </p>
                                {items.map((item) => {
                                    const globalIdx = results.indexOf(item);
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                navigate(item.path);
                                                setIsOpen(false);
                                            }}
                                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-colors ${globalIdx === selectedIndex
                                                ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'
                                                : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                                                }`}
                                        >
                                            <span className="text-lg shrink-0">{item.icon}</span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.title}</p>
                                                <p className="text-xs text-[var(--text-tertiary)] truncate">{item.subtitle}</p>
                                            </div>
                                            <ArrowRight size={14} className="shrink-0 opacity-50" />
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="px-5 py-2.5 border-t border-[var(--border-light)] flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded text-[10px] font-mono">↑↓</kbd>
                            Navigate
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded text-[10px] font-mono">↵</kbd>
                            Open
                        </span>
                        <span className="ml-auto">{results.length} results</span>
                    </div>
                )}
            </div>
        </div>
    );
}
