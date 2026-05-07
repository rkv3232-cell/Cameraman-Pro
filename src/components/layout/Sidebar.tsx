import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.ts";
import {
    LogOut, Home, Calendar, Briefcase, Settings, Package, Trash2, Wallet,
    Users, BarChart3, Sparkles, MessageSquare, LucideIcon, Image as ImageIcon,
    Star, 
} from "lucide-react";
import { cn } from "../../lib/utils";
import ThemeToggle from "../ui/ThemeToggle";
import { Logo } from "./Logo";

interface SidebarItemProps {
    icon: LucideIcon;
    label: string;
    path: string;
    isActive: boolean;
    badge?: string;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, path, isActive, badge, onClick }: SidebarItemProps) => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => {
                navigate(path);
                if (onClick) onClick();
            }}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4",
                isActive
                    ? "bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border-[var(--accent-primary)]"
                    : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            )}
        >
            <Icon size={20} />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]">
                    {badge}
                </span>
            )}
        </button>
    );
};

export const Sidebar = ({ onCloseMobile }: { onCloseMobile?: () => void }) => {
    const { logout, studioId, isOwner } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const currentPath = location.pathname;

    return (
        <aside className="sticky left-0 top-0 h-screen w-64 bg-[var(--surface-base)] border-r border-[var(--border-light)] flex flex-col z-50 overflow-y-auto flex-shrink-0">
            <div className="h-16 flex items-center px-4 border-b border-[var(--border-light)] flex-shrink-0">
                <Logo size="md" />
            </div>

            <nav className="flex-1 py-4 space-y-0.5">

                {/* MAIN */}
                <div className="px-4 py-2">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Main</p>
                </div>
                <SidebarItem icon={Home} label="Dashboard" path="/dashboard" isActive={currentPath === '/dashboard'} onClick={onCloseMobile} />

                {/* OWNER ONLY: Enquiries */}
                {isOwner && (
                    <SidebarItem icon={MessageSquare} label="Enquiries" path="/enquiries" isActive={currentPath === '/enquiries'} onClick={onCloseMobile} />
                )}

                <SidebarItem icon={Briefcase} label="Bookings" path="/bookings" isActive={currentPath.startsWith('/bookings')} onClick={onCloseMobile} />
                <SidebarItem icon={Calendar} label="Calendar" path="/calendar" isActive={currentPath === '/calendar'} onClick={onCloseMobile} />

                {/* STUDIO */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Studio</p>
                </div>

                {/* OWNER ONLY: Gallery & Reviews */}
                {isOwner && (
                    <>
                        <SidebarItem icon={ImageIcon} label="Studio Gallery" path="/studio-gallery" isActive={currentPath === '/studio-gallery'} onClick={onCloseMobile} />
                        <SidebarItem icon={Star} label="Reviews" path="/reviews" isActive={currentPath === '/reviews'} onClick={onCloseMobile} />
                    </>
                )}

                <SidebarItem icon={Users} label="Team" path="/team" isActive={currentPath === '/team'} onClick={onCloseMobile} />
                <SidebarItem icon={Package} label="Inventory" path="/inventory" isActive={currentPath.startsWith('/inventory')} onClick={onCloseMobile} />

                {/* FINANCE */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">Finance</p>
                </div>
                <SidebarItem icon={Wallet} label="Expenses" path="/expenses" isActive={currentPath === '/expenses'} onClick={onCloseMobile} />
                <SidebarItem icon={BarChart3} label="Analytics" path="/analytics" isActive={currentPath === '/analytics'} onClick={onCloseMobile} />

                {/* AI STUDIO */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">AI Studio</p>
                </div>
                <button
                    onClick={() => { navigate("/ai-tools"); if (onCloseMobile) onCloseMobile(); }}
                    className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all border-l-4",
                        currentPath === '/ai-tools'
                            ? "bg-violet-500/10 text-violet-500 border-violet-500"
                            : "text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
                    )}
                >
                    <Sparkles size={20} />
                    <span>AI Tools</span>
                </button>

                {/* SYSTEM */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">System</p>
                </div>
                <SidebarItem icon={Trash2} label="Bin" path="/trash" isActive={currentPath === '/trash'} onClick={onCloseMobile} />
                <SidebarItem icon={Settings} label="Settings" path="/settings" isActive={currentPath === '/settings'} onClick={onCloseMobile} />
            </nav>

            <div className="p-4 border-t border-[var(--border-light)] space-y-3 flex-shrink-0">
                <div className="px-2 flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Theme</span>
                    <ThemeToggle />
                </div>
                <div className="px-2">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-semibold mb-1">Studio ID</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate font-mono bg-[var(--bg-secondary)] p-1 rounded">
                        {isOwner ? "OWNER_MASTER" : (studioId || 'Connecting...')}
                    </p>
                </div>
                <button
                    onClick={() => { logout(); if (onCloseMobile) onCloseMobile(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};
