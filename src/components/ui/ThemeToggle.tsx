import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
                relative w-20 h-10 rounded-full transition-all duration-300 focus:outline-none 
                flex items-center cursor-pointer p-1 group select-none
                ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}
            `}
            aria-label="Toggle theme"
        >
            {/* Icons Track */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-[11px] z-20 pointer-events-none">
                <div className={`transition-all duration-300 flex items-center justify-center ${theme === 'light' ? 'text-amber-500 scale-110 opacity-100' : 'text-gray-400 opacity-40 scale-90'}`}>
                    <Sun size={18} strokeWidth={2.5} />
                </div>
                <div className={`transition-all duration-300 flex items-center justify-center ${theme === 'dark' ? 'text-indigo-400 scale-110 opacity-100' : 'text-gray-400 opacity-40 scale-90'}`}>
                    <Moon size={18} strokeWidth={2.5} />
                </div>
            </div>

            {/* Knob */}
            <div
                className={`
                    w-8 h-8 rounded-full bg-white shadow-md transition-all duration-300 ease-in-out z-10
                    flex items-center justify-center transform 
                    ${theme === 'dark' ? 'translate-x-10' : 'translate-x-0'}
                `}
            />
        </button>
    );
}
