import { LucideIcon } from 'lucide-react';
import { Calendar, Users, Camera, DollarSign, Package, FileText, Settings, TrendingUp } from 'lucide-react';

interface QuickAction {
    icon: LucideIcon;
    label: string;
    color: string;
    onClick?: () => void;
}

const quickActions: QuickAction[] = [
    { icon: Calendar, label: 'Schedule', color: 'from-purple-500 to-indigo-500' },
    { icon: Users, label: 'Clients', color: 'from-blue-500 to-cyan-500' },
    { icon: Camera, label: 'Equipment', color: 'from-green-500 to-emerald-500' },
    { icon: DollarSign, label: 'Payments', color: 'from-yellow-500 to-orange-500' },
    { icon: Package, label: 'Inventory', color: 'from-red-500 to-pink-500' },
    { icon: FileText, label: 'Reports', color: 'from-indigo-500 to-purple-500' },
    { icon: TrendingUp, label: 'Analytics', color: 'from-teal-500 to-cyan-500' },
    { icon: Settings, label: 'Settings', color: 'from-gray-500 to-slate-500' },
];

interface QuickActionsMenuProps {
    onActionClick?: (label: string) => void;
}

export default function QuickActionsMenu({ onActionClick }: QuickActionsMenuProps) {
    return (
        <div className="px-4 sm:px-6 py-6">
            {/* Section Header */}
            <div className="mb-4">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Quick Actions</h2>
                <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Access your tools</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                    <button
                        key={action.label}
                        onClick={() => onActionClick?.(action.label)}
                        className="group relative flex flex-col items-center gap-2 p-3 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-all duration-300 active:scale-95 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Icon Container */}
                        <div
                            className={`
                w-12 h-12 rounded-xl bg-gradient-to-br ${action.color}
                flex items-center justify-center
                shadow-lg group-hover:shadow-xl group-hover:scale-110
                transition-all duration-300
              `}
                        >
                            <action.icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Label */}
                        <span className="text-xs font-medium text-[var(--text-secondary)] group-hover:text-[var(--accent-primary)] transition-colors text-center">
                            {action.label}
                        </span>

                        {/* Glow Effect on Hover */}
                        <div
                            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                            style={{
                                background: `linear-gradient(135deg, ${action.color.split(' ')[0].replace('from-', '')} 0%, ${action.color.split(' ')[1].replace('to-', '')} 100%)`,
                            }}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}
