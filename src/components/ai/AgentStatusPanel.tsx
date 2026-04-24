import { Bot, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { AgentAlert } from '../../lib/babuAgent';
import { AgentAlertCard } from './AgentAlertCard';
import { format } from 'date-fns';

interface AgentStatusPanelProps {
    alerts: AgentAlert[];
    stats: {
        critical: number;
        warnings: number;
        info: number;
        lastCheck: Date;
        monitoring: {
            bookings: number;
            pending: number;
            confirmed: number;
            completed: number;
        };
    };
    onAction: (action: any) => void;
    onDismiss: (alertId: string) => void;
}

export function AgentStatusPanel({ alerts, stats, onAction, onDismiss }: AgentStatusPanelProps) {
    const hasAlerts = alerts.length > 0;
    const criticalCount = stats.critical;
    const warningCount = stats.warnings;

    return (
        <div className="space-y-4">
            {/* Agent Header */}
            <div className="bg-indigo-50/80 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-500/20 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="p-3 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/20">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-indigo-950 dark:text-slate-100">BĀBU Agent</h2>
                            <p className="text-xs text-indigo-600/80 dark:text-slate-400 flex items-center gap-1 font-medium">
                                <Activity size={12} className="animate-pulse text-emerald-500" />
                                Monitoring {stats.monitoring.bookings} bookings
                            </p>
                        </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex items-center gap-2">
                        {criticalCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-500/20 border border-red-100 dark:border-red-500/30 rounded-lg shadow-sm">
                                <AlertCircle size={14} className="text-red-600 dark:text-red-500" />
                                <span className="text-xs font-bold text-red-700 dark:text-red-400">{criticalCount}</span>
                            </div>
                        )}
                        {warningCount > 0 && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 dark:bg-orange-500/20 border border-amber-100 dark:border-orange-500/30 rounded-lg shadow-sm">
                                <AlertCircle size={14} className="text-amber-600 dark:text-orange-500" />
                                <span className="text-xs font-bold text-amber-700 dark:text-orange-400">{warningCount}</span>
                            </div>
                        )}
                        {!hasAlerts && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/30 rounded-lg shadow-sm">
                                <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-500" />
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All Clear</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Last Check */}
                <div className="mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-500/10">
                    <p className="text-xs text-indigo-400 dark:text-slate-500 font-medium">
                        Last check: {format(stats.lastCheck, 'hh:mm a')}
                    </p>
                </div>
            </div>

            {/* Alerts */}
            {hasAlerts ? (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] flex items-center gap-2 px-1">
                        <AlertCircle size={16} />
                        Active Alerts ({alerts.length})
                    </h3>
                    {alerts.map(alert => (
                        <AgentAlertCard
                            key={alert.id}
                            alert={alert}
                            onAction={onAction}
                            onDismiss={onDismiss}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-8 px-4 bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] shadow-sm">
                    <CheckCircle size={32} className="mx-auto text-emerald-500/80 mb-2" />
                    <p className="text-sm font-medium text-[var(--text-primary)]">सब कुछ ठीक चल रहा है! 👍</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">No issues detected</p>
                </div>
            )}
        </div>
    );
}
