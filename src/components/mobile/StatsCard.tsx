import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    color?: string;
}

export default function StatsCard({
    icon: Icon,
    label,
    value,
    change,
    changeLabel = 'vs last month',
    color = 'from-purple-500 to-indigo-500',
}: StatsCardProps) {
    const isPositive = change && change > 0;
    const hasChange = change !== undefined;

    return (
        <div className="relative group">
            {/* Card */}
            <div className="relative bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                {/* Background Gradient Glow */}
                <div
                    className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${color} opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity duration-300`}
                />

                {/* Content */}
                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Change Badge */}
                        {hasChange && (
                            <div
                                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${isPositive
                                        ? 'bg-green-500/10 text-[var(--success)]'
                                        : 'bg-red-500/10 text-[var(--error)]'
                                    }`}
                            >
                                {isPositive ? (
                                    <TrendingUp className="w-3 h-3" />
                                ) : (
                                    <TrendingDown className="w-3 h-3" />
                                )}
                                <span>{Math.abs(change)}%</span>
                            </div>
                        )}
                    </div>

                    {/* Value */}
                    <div className="mb-1">
                        <h3 className="text-3xl font-bold text-[var(--text-primary)]">
                            {value}
                        </h3>
                    </div>

                    {/* Label */}
                    <p className="text-sm text-[var(--text-tertiary)] font-medium">
                        {label}
                    </p>

                    {/* Change Label */}
                    {hasChange && (
                        <p className="text-xs text-[var(--text-disabled)] mt-1">
                            {changeLabel}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
