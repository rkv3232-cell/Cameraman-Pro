import { Camera, DollarSign, Calendar, Clock } from 'lucide-react';
import MobileHeader from '../components/mobile/MobileHeader';
import SearchBar from '../components/mobile/SearchBar';
import QuickActionsMenu from '../components/mobile/QuickActionsMenu';
import StatsCard from '../components/mobile/StatsCard';

export default function ModernDashboard() {
    const stats = [
        {
            icon: Camera,
            label: 'Total Bookings',
            value: '45',
            change: 12,
            color: 'from-purple-500 to-indigo-500',
        },
        {
            icon: DollarSign,
            label: 'Revenue',
            value: '₹2.4L',
            change: 8,
            color: 'from-green-500 to-emerald-500',
        },
        {
            icon: Calendar,
            label: 'This Month',
            value: '12',
            change: -5,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            icon: Clock,
            label: 'Pending',
            value: '3',
            change: 0,
            color: 'from-yellow-500 to-orange-500',
        },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <MobileHeader
                userName="Raj Verma"
                notifications={3}
            />

            {/* Search */}
            <SearchBar />

            {/* Stats Grid */}
            <div className="px-4 sm:px-6 py-6">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Overview</h2>
                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">Your studio at a glance</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <StatsCard {...stat} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <QuickActionsMenu
                onActionClick={(label) => console.log('Clicked:', label)}
            />

            {/* Recent Activity */}
            <div className="px-4 sm:px-6 py-6 pb-24">
                <div className="mb-4">
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">Recent Activity</h2>
                    <p className="text-sm text-[var(--text-tertiary)] mt-0.5">What's happening today</p>
                </div>

                {/* Activity Cards */}
                <div className="space-y-3">
                    {[
                        {
                            title: 'Wedding Shoot - Sharma Family',
                            time: '2 hours ago',
                            status: 'Confirmed',
                            color: 'green',
                        },
                        {
                            title: 'Payment Received - ₹25,000',
                            time: '5 hours ago',
                            status: 'Completed',
                            color: 'blue',
                        },
                        {
                            title: 'Equipment Check - Camera A7III',
                            time: 'Yesterday',
                            status: 'Pending',
                            color: 'yellow',
                        },
                    ].map((activity, index) => (
                        <div
                            key={index}
                            className="bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-2xl p-4 hover:border-[var(--accent-primary)] transition-all duration-300 cursor-pointer animate-fade-in"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                                        {activity.title}
                                    </h3>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {activity.time}
                                    </p>
                                </div>
                                <span
                                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${activity.color === 'green'
                                            ? 'bg-green-500/10 text-[var(--success)]'
                                            : activity.color === 'blue'
                                                ? 'bg-blue-500/10 text-[var(--info)]'
                                                : 'bg-yellow-500/10 text-[var(--warning)]'
                                        }`}
                                >
                                    {activity.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
