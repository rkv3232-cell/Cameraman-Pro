import { Search } from 'lucide-react';
import { useState } from 'react';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
}

export default function SearchBar({
    placeholder = 'Search bookings, clients...',
    onSearch,
}: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        onSearch?.(e.target.value);
    };

    return (
        <div className="relative px-4 sm:px-6 py-4">
            <div
                className={`
          relative flex items-center gap-3
          bg-[var(--surface-base)]
          border-2 transition-all duration-300
          rounded-2xl px-4 py-3.5
          shadow-md
          ${isFocused
                        ? 'border-[var(--accent-primary)] shadow-glow'
                        : 'border-[var(--border-subtle)]'
                    }
        `}
            >
                <Search
                    className={`w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                        }`}
                />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none text-base"
                />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            onSearch?.('');
                        }}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
