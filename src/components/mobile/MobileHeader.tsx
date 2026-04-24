import { User, Bell } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';

interface MobileHeaderProps {
    userName?: string;
    userAvatar?: string;
    notifications?: number;
}

export default function MobileHeader({
    userName = 'Raj',
    userAvatar,
    notifications = 0,
}: MobileHeaderProps) {
    const hour = new Date().getHours();
    let greeting = 'शुभ संध्या';
    if (hour < 12) greeting = 'सुप्रभात';
    else if (hour < 17) greeting = 'नमस्ते';

    return (
        <header className="sticky top-0 z-50 bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] backdrop-blur-xl bg-opacity-80">
            <div className="px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Profile Section */}
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] p-0.5 shadow-glow">
                                <div className="w-full h-full rounded-[14px] bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden">
                                    {userAvatar ? (
                                        <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-6 h-6 text-[var(--accent-primary)]" />
                                    )}
                                </div>
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[var(--success)] border-2 border-[var(--bg-primary)] rounded-full animate-pulse"></div>
                        </div>

                        {/* Greeting */}
                        <div>
                            <p className="text-xs text-[var(--text-tertiary)] font-medium">
                                {greeting} 👋
                            </p>
                            <h1 className="text-lg font-bold text-[var(--text-primary)]">
                                {userName}
                            </h1>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle */}
                        <ThemeToggle />

                        {/* Notifications */}
                        <button
                            className="relative p-2.5 rounded-xl bg-[var(--surface-base)] border border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-all duration-200 active:scale-95"
                            aria-label="Notifications"
                        >
                            <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                            {notifications > 0 && (
                                <div className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[var(--error)] flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">
                                        {notifications > 99 ? '99+' : notifications}
                                    </span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
