import { useNavigate, useLocation } from "react-router-dom";
import { Home, Calendar, Briefcase, Package, Sparkles, LucideIcon } from "lucide-react";

interface NavItem {
    icon: LucideIcon;
    label: string;
    path: string;
}

const navItems: NavItem[] = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Briefcase, label: "Bookings", path: "/bookings" },
    { icon: Calendar, label: "Calendar", path: "/calendar" },
    { icon: Package, label: "Inventory", path: "/inventory" },
    { icon: Sparkles, label: "AI Tools", path: "/ai-tools" },
];

/**
 * Mobile Bottom Navigation Bar
 * Thumb-friendly, fixed at bottom on mobile/tablet
 */
export default function MobileNav() {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--surface-base)] border-t border-[var(--border-light)] px-2 pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-around items-center py-2">
                {navItems.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl transition-all min-w-[56px] active:scale-90
                                ${isActive
                                    ? 'text-[var(--accent-primary)]'
                                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5}
                                className={isActive && item.path === '/ai-tools' ? 'text-violet-500' : undefined}
                            />
                            <span className={`text-[10px] font-medium ${isActive ? 'font-semibold' : ''}`}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div className={`w-1 h-1 rounded-full mt-0.5 ${item.path === '/ai-tools' ? 'bg-violet-500' : 'bg-[var(--accent-primary)]'}`} />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
