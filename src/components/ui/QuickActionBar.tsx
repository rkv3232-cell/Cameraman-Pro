import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, CreditCard, Package, X, Zap } from 'lucide-react';

/**
 * Floating Quick Action Bar
 * One-click access to: New Booking, Add Payment, Add Equipment
 */
export default function QuickActionBar() {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const actions = [
        {
            label: 'New Booking',
            icon: Calendar,
            color: 'bg-blue-500 hover:bg-blue-600',
            onClick: () => navigate('/bookings?action=new')
        },
        {
            label: 'Add Expense',
            icon: CreditCard,
            color: 'bg-orange-500 hover:bg-orange-600',
            onClick: () => navigate('/expenses?action=new')
        },
        {
            label: 'Add Equipment',
            icon: Package,
            color: 'bg-emerald-500 hover:bg-emerald-600',
            onClick: () => navigate('/inventory?action=new')
        }
    ];

    return (
        <div className="relative">
            {/* Main FAB */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className={`
                    w-14 h-14 rounded-full shadow-lg flex items-center justify-center
                    transition-all duration-300 active:scale-90
                    ${isOpen
                        ? 'bg-[var(--text-primary)] rotate-45'
                        : 'bg-[var(--accent-primary)] hover:shadow-xl hover:-translate-y-0.5'
                    }
                `}
                aria-label="Quick Actions"
            >
                {isOpen
                    ? <X size={24} className="text-[var(--bg-primary)]" />
                    : <Zap size={24} className="text-white" />
                }
            </button>

            {/* Action Items */}
            {isOpen && (
                <div className="absolute bottom-full right-0 mb-4 flex flex-col-reverse items-end gap-2 animate-fade-in">
                    {actions.map((action, idx) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.label}
                                onClick={() => {
                                    action.onClick();
                                    setIsOpen(false);
                                }}
                                className="flex items-center gap-3 group"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Label */}
                                <span className="px-3 py-1.5 bg-[var(--surface-base)] border border-[var(--border-light)] rounded-lg text-sm font-medium text-[var(--text-primary)] shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                    {action.label}
                                </span>
                                {/* Icon Button */}
                                <span className={`w-11 h-11 rounded-full ${action.color} flex items-center justify-center shadow-lg transition-all active:scale-90`}>
                                    <Icon size={20} className="text-white" />
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
