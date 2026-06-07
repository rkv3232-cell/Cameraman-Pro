import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.ts";
import {
    LogOut, Home, Calendar, Briefcase, Settings, Package, Trash2, Wallet,
    Users, BarChart3, Sparkles, MessageSquare, LucideIcon, Image as ImageIcon,
    Star, Clock, Trophy, CreditCard, Camera, X,
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
    variant?: 'default' | 'gold' | 'purple';
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, path, isActive, badge, variant = 'default', onClick }: SidebarItemProps) => {
    const navigate = useNavigate();

    const getColors = () => {
        if (isActive) {
            if (variant === 'gold') {
                return "active-menu-gold font-semibold shadow-[0_2px_8px_rgba(212,175,55,0.08)]";
            }
            if (variant === 'purple') {
                return "active-menu-purple font-semibold shadow-[0_2px_8px_rgba(139,92,246,0.08)]";
            }
            return "active-menu-default font-semibold shadow-[0_2px_8px_rgba(124,58,237,0.08)]";
        }
        return "text-[var(--text-secondary)] border-transparent hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]";
    };

    const getDotColor = () => {
        if (variant === 'gold') return 'bg-yellow-500';
        if (variant === 'purple') return 'bg-purple-500';
        return 'bg-[var(--accent-primary)]';
    };

    return (
        <button
            onClick={() => {
                // Call onCloseMobile BEFORE navigate to prevent stale-closure race
                if (onClick) {
                    console.log("[MENU CLICK]", label, "→", path);
                    onClick();
                }
                navigate(path);
            }}
            className={cn(
                "w-auto flex items-center gap-3 px-4 py-2.5 mx-3 my-0.5 text-sm font-medium transition-all duration-200 rounded-[14px] border relative group",
                getColors()
            )}
        >
            {/* Active Left Indicator Pill */}
            {isActive && (
                <span className={cn("absolute left-1.5 w-1 h-3.5 rounded-full", getDotColor())} />
            )}
            
            <Icon size={18} className={cn("transition-transform duration-200 group-hover:scale-110", isActive && "scale-105")} />
            <span className="flex-1 text-left">{label}</span>
            {badge && (
                <span className={cn(
                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                    variant === 'gold' 
                        ? "bg-yellow-500/15 text-yellow-500"
                        : variant === 'purple'
                        ? "bg-purple-500/15 text-purple-400"
                        : "bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]"
                )}>
                    {badge}
                </span>
            )}
        </button>
    );
};

export const Sidebar = ({ onCloseMobile }: { onCloseMobile?: () => void }) => {
    const { logout, studioId, isOwner } = useAuth();
    const location = useLocation();
    const currentPath = location.pathname;

    // Instance mount diagnostic — should see exactly:
    //   1x "MobileSidebar instance mounted" (with onCloseMobile=true)   ← mobile drawer
    //   1x "MobileSidebar instance mounted" (with onCloseMobile=false)  ← desktop sidebar
    // If you see MORE than 2 total mounts, Layout is rendering multiple times.
    const instanceId = useRef(`sidebar-${Math.random().toString(36).slice(2, 7)}`);
    useEffect(() => {
        console.log("MobileSidebar instance mounted", {
            id: instanceId.current,
            isMobile: !!onCloseMobile,
        });
        return () => {
            console.log("MobileSidebar instance UNMOUNTED", {
                id: instanceId.current,
                isMobile: !!onCloseMobile,
            });
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <aside className="sticky left-0 top-0 h-screen w-full lg:w-64 bg-[var(--surface-base)]/75 backdrop-blur-2xl lg:border-r lg:border-[var(--border-subtle)] flex flex-col z-50 overflow-hidden flex-shrink-0 animate-fade-in">
            <div className="h-16 flex items-center justify-between px-4 flex-shrink-0">
                <div className="flex items-center">
                    <Logo size="md" />
                    <span className="text-[10px] text-[var(--text-tertiary)] ml-2 opacity-50 font-mono">v2.1</span>
                </div>
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="p-2 -mr-1 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-all lg:hidden"
                        aria-label="Close menu"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto py-4 space-y-0.5 no-scrollbar">
                {/* MAIN */}
                <div className="px-4 py-2 mt-2">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">Main</p>
                </div>
                <SidebarItem icon={Home} label="Dashboard" path="/dashboard" isActive={currentPath === '/dashboard'} onClick={onCloseMobile} />

                {/* OWNER ONLY: Enquiries */}
                {isOwner && (
                    <SidebarItem icon={MessageSquare} label="Enquiries" path="/enquiries" isActive={currentPath === '/enquiries'} onClick={onCloseMobile} />
                )}

                <SidebarItem icon={Briefcase} label="Bookings" path="/bookings" isActive={currentPath.startsWith('/bookings')} onClick={onCloseMobile} />
                <SidebarItem icon={Clock} label="Upcoming Shoots" path="/upcoming-shoots" isActive={currentPath === '/upcoming-shoots'} onClick={onCloseMobile} />
                <SidebarItem icon={Trophy} label="Completed Shoots" path="/completed-shoots" isActive={currentPath === '/completed-shoots'} onClick={onCloseMobile} />
                <SidebarItem icon={Calendar} label="Calendar" path="/calendar" isActive={currentPath === '/calendar'} onClick={onCloseMobile} />

                {/* STUDIO */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">Studio</p>
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
                <SidebarItem icon={Camera} label="Photo Sessions" path="/studio/photo-sessions" isActive={currentPath.startsWith('/studio/photo-sessions')} onClick={onCloseMobile} />

                {/* FINANCE */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">Finance</p>
                </div>
                <SidebarItem icon={Wallet} label="Expenses" path="/expenses" isActive={currentPath === '/expenses'} onClick={onCloseMobile} />
                <SidebarItem icon={BarChart3} label="Analytics" path="/analytics" isActive={currentPath === '/analytics'} onClick={onCloseMobile} />

                {/* CREW OPERATIONS */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">Crew</p>
                </div>
                <SidebarItem
                    icon={CreditCard}
                    label="Crew Directory"
                    path="/crew"
                    isActive={currentPath.startsWith('/crew')}
                    badge="NEW"
                    variant="gold"
                    onClick={onCloseMobile}
                />

                {/* AI STUDIO */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">AI Studio</p>
                </div>
                <SidebarItem
                    icon={Sparkles}
                    label="AI Tools"
                    path="/ai-tools"
                    isActive={currentPath === '/ai-tools'}
                    variant="purple"
                    onClick={onCloseMobile}
                />

                {/* SYSTEM */}
                <div className="px-4 py-2 pt-4">
                    <p className="text-[9px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">System</p>
                </div>
                <SidebarItem icon={Trash2} label="Bin" path="/trash" isActive={currentPath === '/trash'} onClick={onCloseMobile} />
                <SidebarItem icon={Settings} label="Settings" path="/settings" isActive={currentPath === '/settings'} onClick={onCloseMobile} />
            </nav>

            <div className="p-4 space-y-3 flex-shrink-0 bg-[var(--surface-base)]/40">
                <div className="px-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest">Theme</span>
                    <ThemeToggle />
                </div>
                <div className="px-2">
                    <p className="text-[10px] font-bold text-[var(--text-tertiary)] opacity-60 uppercase tracking-widest mb-1">Studio ID</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate font-mono bg-[var(--bg-secondary)]/80 p-1.5 rounded-lg border border-[var(--border-subtle)]">
                        {isOwner ? "OWNER_MASTER" : (studioId || 'Connecting...')}
                    </p>
                </div>
                <button
                    onClick={() => { logout(); if (onCloseMobile) onCloseMobile(); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 border border-transparent hover:border-red-500/20 hover:bg-red-500/5 rounded-xl transition-all duration-200"
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};
