import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { AgentAlert } from '../../lib/babuAgent';

interface AgentAlertCardProps {
    alert: AgentAlert;
    onAction: (action: any) => void;
    onDismiss: (alertId: string) => void;
}

export function AgentAlertCard({ alert, onAction, onDismiss }: AgentAlertCardProps) {
    const severityConfig = {
        critical: {
            icon: AlertCircle,
            bgColor: 'bg-red-50 dark:bg-red-500/10',
            borderColor: 'border-red-100 dark:border-red-500/30',
            iconColor: 'text-red-600 dark:text-red-500',
            textColor: 'text-red-800 dark:text-red-300'
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-amber-50 dark:bg-orange-500/10',
            borderColor: 'border-amber-100 dark:border-orange-500/30',
            iconColor: 'text-amber-600 dark:text-orange-500',
            textColor: 'text-amber-800 dark:text-orange-300'
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-50 dark:bg-blue-500/10',
            borderColor: 'border-blue-100 dark:border-blue-500/30',
            iconColor: 'text-blue-600 dark:text-blue-500',
            textColor: 'text-blue-800 dark:text-blue-300'
        },
        success: {
            icon: CheckCircle,
            bgColor: 'bg-emerald-50 dark:bg-green-500/10',
            borderColor: 'border-emerald-100 dark:border-green-500/30',
            iconColor: 'text-emerald-600 dark:text-green-500',
            textColor: 'text-emerald-800 dark:text-green-300'
        }
    };

    const config = severityConfig[alert.severity];
    const Icon = config.icon;

    return (
        <div
            className={`relative rounded-xl p-4 border ${config.bgColor} ${config.borderColor} backdrop-blur-sm transition-all hover:shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}
        >
            {/* Dismiss Button */}
            <button
                onClick={() => onDismiss(alert.id)}
                className="absolute top-2 right-2 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-slate-800/50 transition-colors"
            >
                <X size={14} className="text-slate-400 dark:text-slate-500" />
            </button>

            <div className="flex gap-3">
                {/* Icon */}
                <div className={`${config.iconColor} mt-0.5 flex-shrink-0`}>
                    <Icon size={20} />
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                    {/* Title */}
                    <h3 className={`font-semibold text-sm ${config.textColor}`}>
                        {alert.title}
                    </h3>

                    {/* Message */}
                    <p className="text-sm text-[var(--text-secondary)] dark:text-slate-400 whitespace-pre-line leading-relaxed">
                        {alert.message}
                    </p>

                    {/* Actions */}
                    {alert.actions && alert.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                            {alert.actions.map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onAction(action)}
                                    className={`
                                        px-3 py-1.5 text-xs font-medium rounded-lg 
                                        transition-all border shadow-sm hover:shadow-md
                                        ${idx === 0
                                            ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }
                                    `}
                                >
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Auto-executable badge */}
                    {alert.autoExecutable && (
                        <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-slate-500 mt-2 font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Auto-executable</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
