import { useMemo } from 'react';
import { Heart, Star, Flame, XCircle, Download, Lock, Clock } from 'lucide-react';
import { SelectionType } from '../../types';

interface SelectionProgressBarProps {
    totalPhotos: number;
    selectedCount: number;
    deadlineAt?: Date | null;
    isLocked: boolean;
    isSubmitted: boolean;
    countByType: Record<SelectionType, number>;
}

const TYPE_CONFIG: { type: SelectionType; icon: React.ElementType; color: string; label: string }[] = [
    { type: 'favorite', icon: Heart,    color: 'text-rose-400',   label: 'Fav' },
    { type: 'album',    icon: Star,     color: 'text-amber-400',  label: 'Album' },
    { type: 'priority', icon: Flame,    color: 'text-orange-400', label: 'Priority' },
    { type: 'rejected', icon: XCircle,  color: 'text-slate-400',  label: 'Reject' },
    { type: 'download', icon: Download, color: 'text-sky-400',    label: 'Save' },
];

function useDeadlineCountdown(deadlineAt?: Date | null) {
    // Re-render every second while deadline is near (< 24h) using a simple approach
    return useMemo(() => {
        if (!deadlineAt) return null;
        const now = new Date();
        const diff = deadlineAt.getTime() - now.getTime();
        if (diff <= 0) return { label: 'EXPIRED', urgent: true, expired: true };

        const totalSecs = Math.floor(diff / 1000);
        const hours = Math.floor(totalSecs / 3600);
        const mins = Math.floor((totalSecs % 3600) / 60);
        const secs = totalSecs % 60;

        const urgent = hours < 2;
        const warning = hours < 24;

        if (hours >= 48) {
            const days = Math.floor(hours / 24);
            return { label: `${days}d ${hours % 24}h`, urgent: false, expired: false, warning: false };
        }
        return {
            label: `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
            urgent, warning, expired: false
        };
    }, [deadlineAt]);
}

export const SelectionProgressBar = ({
    totalPhotos, selectedCount, deadlineAt, isLocked, isSubmitted, countByType
}: SelectionProgressBarProps) => {
    const deadline = useDeadlineCountdown(deadlineAt);
    const pct = totalPhotos > 0 ? Math.min(100, Math.round((selectedCount / totalPhotos) * 100)) : 0;

    return (
        <div className="sticky top-0 z-30 w-full bg-[var(--surface-base)]/90 backdrop-blur-lg border-b border-[var(--border-light)] shadow-sm">
            <div className="max-w-6xl mx-auto px-4 py-2.5">
                <div className="flex items-center gap-3 flex-wrap">

                    {/* Selected count */}
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-2xl font-black text-[var(--accent-primary)] tabular-nums leading-none">
                            {selectedCount}
                        </span>
                        <div className="flex flex-col leading-none">
                            <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">selected</span>
                            <span className="text-xs text-[var(--text-secondary)] font-medium">/ {totalPhotos}</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex-1 min-w-[80px] h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: isLocked || isSubmitted
                                    ? 'linear-gradient(90deg, #10b981, #059669)'
                                    : 'linear-gradient(90deg, var(--accent-primary), #818cf8)',
                            }}
                        />
                    </div>

                    <span className="text-xs text-[var(--text-tertiary)] tabular-nums font-mono">{pct}%</span>

                    {/* Per-type mini counts */}
                    <div className="hidden sm:flex items-center gap-2 ml-1">
                        {TYPE_CONFIG.map(({ type, icon: Icon, color, label }) =>
                            countByType[type] > 0 ? (
                                <div key={type} className={`flex items-center gap-0.5 ${color}`} title={label}>
                                    <Icon size={12} />
                                    <span className="text-xs font-bold tabular-nums">{countByType[type]}</span>
                                </div>
                            ) : null
                        )}
                    </div>

                    {/* Status badges */}
                    <div className="flex items-center gap-2 ml-auto">
                        {isSubmitted && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 text-xs font-bold">
                                <Lock size={11} /> Submitted
                            </span>
                        )}
                        {isLocked && !isSubmitted && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 text-xs font-bold">
                                <Lock size={11} /> Locked
                            </span>
                        )}
                        {deadline && !isLocked && !isSubmitted && (
                            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold tabular-nums font-mono ${
                                deadline.expired
                                    ? 'bg-red-500/20 text-red-500 animate-pulse'
                                    : deadline.urgent
                                        ? 'bg-red-500/15 text-red-400'
                                        : deadline.warning
                                            ? 'bg-amber-500/15 text-amber-400'
                                            : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                            }`}>
                                <Clock size={11} />
                                {deadline.expired ? 'EXPIRED' : deadline.label}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
