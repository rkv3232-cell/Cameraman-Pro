import { useMemo, useState, useEffect } from "react";
import { useBookings } from "../hooks/useBookings";
import { useExpenses } from "../hooks/useExpenses";
import { useInventory } from "../hooks/useInventory";
import { useAuth } from "../hooks/useAuth";
import { useBabuAgent } from "../hooks/useBabuAgent";
import { toSafeDate, safeFormat } from "../utils/date";
import { useNavigate } from "react-router-dom";
import { Calendar, DollarSign, TrendingUp, TrendingDown, Wallet, BarChart3, Lightbulb, AlertCircle, CheckCircle, Clock, BellRing } from "lucide-react";
import { formatMoney } from "../utils/currency";
import { useEnquiries } from "../hooks/useEnquiries";
import { AgentStatusPanel } from "../components/ai";
import { createPredictiveEngine } from "../lib/predictiveEngine";
import { generateReport, formatReportSummary } from "../lib/reportService";
import { PredictiveAlert } from "../types";

const InfoCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="relative overflow-hidden group rounded-[24px] border border-[var(--border-subtle)] bg-gradient-to-b from-[var(--surface-base)] to-[var(--bg-secondary)] p-6 shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-[var(--accent-primary)]/20 transition-all duration-300">
        {/* Soft decorative background glow */}
        <span className="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-[var(--accent-primary)]/5 blur-xl group-hover:bg-[var(--accent-primary)]/10 transition-colors pointer-events-none" />
        
        <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{title}</p>
            <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border-subtle)] ${color} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={18} />
            </div>
        </div>
        <h3 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">{value}</h3>
        {subtext && (
            <p className="text-xs text-[var(--text-secondary)]/70 mt-2 font-medium flex items-center gap-1">
                {subtext}
            </p>
        )}
    </div>
);

export const Dashboard = () => {
    const { userProfile } = useAuth();
    const { bookings, loading } = useBookings();
    const { expenses, analytics: expenseAnalytics } = useExpenses();
    const { inventory } = useInventory();
    const { alerts, stats: agentStats, executeAction, dismissAlert } = useBabuAgent();
    const { enquiries } = useEnquiries();
    const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveAlert[]>([]);
    const [showReport, setShowReport] = useState(false);
    const navigate = useNavigate();

    const newEnquiriesCount = enquiries.filter(e => e.status === 'new').length;

    // Revenue & Profit Calculations
    const stats = useMemo(() => {
        const total = bookings.length;
        const pending = bookings.filter(b => b.status === "pending").length;

        const revenuePaise = bookings
            .filter(b => b.status === 'confirmed' || b.status === 'completed')
            .reduce((sum, b) => sum + (b.financials?.totalAmount || 0), 0);

        const revenue = revenuePaise / 100;

        // Current month revenue
        const now = new Date();
        const monthlyRevenuePaise = bookings
            .filter(b => {
                const d = toSafeDate(b.eventDate);
                return (
                    d.getMonth() === now.getMonth() &&
                    d.getFullYear() === now.getFullYear() &&
                    (b.status === 'confirmed' || b.status === 'completed')
                );
            })
            .reduce((sum, b) => sum + (b.financials?.totalAmount || 0), 0);

        const monthlyExpensesPaise = expenseAnalytics.totalThisMonth;
        const netProfitPaise = monthlyRevenuePaise - monthlyExpensesPaise;

        const active = bookings.filter(b => {
            const bDate = toSafeDate(b.eventDate);
            return ['confirmed', 'pending'].includes(b.status) && bDate >= new Date();
        }).length;

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Receivables: Conducted shoots (eventDate <= today) and payment status NOT fully paid
        const receivablesPaise = bookings
            .filter(b => {
                const bDate = toSafeDate(b.eventDate);
                const isConducted = bDate <= todayEnd;
                const due = (b.financials?.totalAmount || 0) - (b.financials?.advancePaid || 0);
                return isConducted && due > 0 && ['confirmed', 'completed', 'pending'].includes(b.status);
            })
            .reduce((sum, b) => {
                const due = (b.financials?.totalAmount || 0) - (b.financials?.advancePaid || 0);
                return sum + Math.max(0, due);
            }, 0);

        // Upcoming Revenue: Projected income for future shoots (eventDate > today)
        const upcomingRevenuePaise = bookings
            .filter(b => {
                const bDate = toSafeDate(b.eventDate);
                const isFuture = bDate > todayEnd;
                return isFuture && ['confirmed', 'pending'].includes(b.status);
            })
            .reduce((sum, b) => {
                const due = (b.financials?.totalAmount || 0) - (b.financials?.advancePaid || 0);
                return sum + Math.max(0, due);
            }, 0);

        const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
        // Completed = status explicitly set to 'completed' by workflow auto-trigger
        const completedCount = bookings.filter(b => b.status === 'completed').length;

        return {
            total, pending, revenue, active,
            monthlyRevenue: monthlyRevenuePaise / 100,
            monthlyExpenses: monthlyExpensesPaise / 100,
            netProfit: netProfitPaise / 100,
            netProfitPaise,
            receivables: receivablesPaise / 100,
            upcomingRevenue: upcomingRevenuePaise / 100,
            pendingAmount: (receivablesPaise + upcomingRevenuePaise) / 100,
            confirmedCount,
            completedCount,
        };
    }, [bookings, expenseAnalytics]);

    // Predictive Analysis
    useEffect(() => {
        if (bookings.length > 0) {
            const engine = createPredictiveEngine(bookings, expenses, inventory);
            const alerts = engine.analyze();
            setPredictiveAlerts(alerts);
        }
    }, [bookings, expenses, inventory]);

    // Daily Report Data
    const dailyReport = useMemo(() => {
        if (bookings.length === 0 && expenses.length === 0) return null;
        return generateReport('daily', bookings, expenses);
    }, [bookings, expenses]);

    const upcomingEvents = bookings
        .filter(b => {
            const bDate = toSafeDate(b.eventDate);
            return ['confirmed', 'pending'].includes(b.status) && bDate >= new Date();
        })
        .sort((a, b) => {
            const aTime = toSafeDate(a.eventDate).getTime();
            const bTime = toSafeDate(b.eventDate).getTime();
            return aTime - bTime;
        })
        .slice(0, 5);

    if (loading) {
        return <div className="p-8 text-[var(--text-secondary)]">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Dashboard</h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Welcome back, {userProfile?.name} • Studio Stats
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate("/analytics")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-white rounded-[18px] text-sm font-semibold hover:bg-[var(--accent-secondary)] transition-all shadow-sm active:scale-95 hover:shadow-md"
                    >
                        <BarChart3 size={16} />
                        Analytics
                    </button>
                    {dailyReport && (
                        <button
                            onClick={() => setShowReport(!showReport)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--surface-base)] border border-[var(--border-subtle)] rounded-[18px] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all shadow-sm active:scale-95"
                        >
                            <BarChart3 size={16} />
                            Today's Report
                        </button>
                    )}
                </div>
            </div>

            {/* New Enquiries Notification Banner */}
            {newEnquiriesCount > 0 && (
                <div
                    onClick={() => navigate('/enquiries')}
                    className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors animate-pulse-soft shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-full text-white animate-bounce-soft">
                            <BellRing size={20} />
                        </div>
                        <div>
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                                You have {newEnquiriesCount} new {newEnquiriesCount === 1 ? 'enquiry' : 'enquiries'}!
                            </h3>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Click here to review leads from your public website.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* BĀBU Agent Status Panel */}
            {agentStats && (
                <AgentStatusPanel
                    alerts={alerts}
                    stats={agentStats}
                    onAction={executeAction}
                    onDismiss={dismissAlert}
                />
            )}

            {/* Predictive Alerts */}
            {predictiveAlerts.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
                        <Lightbulb size={14} className="text-amber-500" />
                        BĀBU Predictions
                    </h2>
                    {predictiveAlerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`p-4 rounded-xl border flex items-start gap-3 ${alert.severity === 'critical'
                                ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                                : alert.severity === 'warning'
                                    ? 'bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20'
                                    : 'bg-blue-50 border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20'
                                }`}
                        >
                            <div className="flex-1">
                                <h4 className="font-semibold text-sm text-[var(--text-primary)]">{alert.title}</h4>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">{alert.message}</p>
                                {alert.suggestedActions.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {alert.suggestedActions.map((action, i) => (
                                            <span
                                                key={i}
                                                className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-base)] border border-[var(--border-light)] text-[var(--text-secondary)]"
                                            >
                                                {action}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard
                    title="Monthly Revenue"
                    value={formatMoney(stats.monthlyRevenue)}
                    icon={DollarSign}
                    color="text-emerald-500"
                    subtext="This month's confirmed + completed"
                />
                <InfoCard
                    title="Monthly Expenses"
                    value={formatMoney(stats.monthlyExpenses)}
                    icon={Wallet}
                    color="text-red-500"
                    subtext="This month's spending"
                />
                <InfoCard
                    title="Net Profit"
                    value={formatMoney(stats.netProfit)}
                    icon={stats.netProfit >= 0 ? TrendingUp : TrendingDown}
                    color={stats.netProfit >= 0 ? "text-emerald-500" : "text-red-500"}
                    subtext={stats.netProfit >= 0 ? "You're profitable! 🎉" : "Expenses exceed revenue"}
                />
                <InfoCard
                    title="Active Bookings"
                    value={stats.active}
                    icon={Calendar}
                    color="text-blue-500"
                    subtext={`${stats.pending} pending confirmation`}
                />
            </div>

            {/* Revenue Detail Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard
                    title="Current Receivables"
                    value={formatMoney(stats.receivables)}
                    icon={AlertCircle}
                    color="text-red-500"
                    subtext="Conducted shoots with unpaid balance"
                />
                <InfoCard
                    title="Upcoming Revenue"
                    value={formatMoney(stats.upcomingRevenue)}
                    icon={TrendingUp}
                    color="text-amber-500"
                    subtext="Expected balance from future bookings"
                />
                <InfoCard
                    title="Confirmed Events"
                    value={stats.confirmedCount}
                    icon={CheckCircle}
                    color="text-emerald-500"
                    subtext="Bookings confirmed & in progress"
                />
                <InfoCard
                    title="Completed Events"
                    value={stats.completedCount}
                    icon={Clock}
                    color="text-blue-500"
                    subtext="Album delivered & fully done"
                />
            </div>

            {/* Daily Report Panel */}
            {showReport && dailyReport && (
                <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">📊 Today's Report</h3>
                    <pre className="text-sm text-[var(--text-primary)] font-mono whitespace-pre-wrap leading-relaxed">
                        {formatReportSummary(dailyReport)}
                    </pre>
                </div>
            )}

            {/* Upcoming Schedule */}
            <div className="mt-4">
                <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Upcoming Schedule</h2>
                <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">
                    {upcomingEvents.length > 0 ? (
                        <>
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                        <tr>
                                            <th className="p-4 font-medium">Event</th>
                                            <th className="p-4 font-medium">Client</th>
                                            <th className="p-4 font-medium">Date</th>
                                            <th className="p-4 font-medium">Financials</th>
                                            <th className="p-4 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-light)]">
                                        {upcomingEvents.map((booking) => {
                                            const total = booking.financials?.totalAmount / 100 || 0;
                                            const advance = booking.financials?.advancePaid / 100 || 0;
                                            const due = total - advance;

                                            return (
                                                <tr key={booking.id} className="hover:bg-[var(--surface-hover)] transition-colors">
                                                    <td className="p-4 text-[var(--text-primary)] font-medium capitalize flex items-center gap-2">
                                                        {booking.eventType}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-[var(--text-primary)]">{booking.clientName}</div>
                                                        <div className="text-xs text-[var(--text-tertiary)]">{booking.clientPhone}</div>
                                                    </td>
                                                    <td className="p-4 text-[var(--text-secondary)]">
                                                        {safeFormat(booking.eventDate, 'MMM dd, yyyy')}
                                                        <div className="text-xs opacity-60">
                                                            {safeFormat(booking.eventDate, 'h:mm a')}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="text-sm text-[var(--text-primary)]">{formatMoney(total)}</div>
                                                        {due > 0 && (
                                                            <div className="text-xs text-[var(--error)] font-medium">
                                                                Due: {formatMoney(due)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                                            ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500' :
                                                                booking.status === 'pending' ? 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-500' : 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'}`}>
                                                            {booking.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                                {upcomingEvents.map((booking) => {
                                    const total = booking.financials?.totalAmount / 100 || 0;
                                    const advance = booking.financials?.advancePaid / 100 || 0;
                                    const due = total - advance;

                                    return (
                                        <div key={booking.id} className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-light)] hover:border-[var(--accent-primary)]/50 transition-colors">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-[var(--text-primary)]">{booking.clientName}</div>
                                                    <div className="text-xs text-[var(--text-secondary)] mt-0.5">
                                                        {safeFormat(booking.eventDate, 'MMM dd, yyyy')} • {safeFormat(booking.eventDate, 'h:mm a')}
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold capitalize border
                                                    ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                                                            'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-light)]'}`}>
                                                    {booking.status}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mt-3">
                                                <span className="capitalize bg-[var(--surface-base)] px-2 py-1 rounded text-xs text-[var(--text-secondary)] border border-[var(--border-light)]">
                                                    {booking.eventType}
                                                </span>
                                                <div className="text-right">
                                                    <div className="font-mono text-sm text-[var(--text-primary)] font-medium">{formatMoney(total)}</div>
                                                    {due > 0 && <div className="text-xs text-red-500 font-medium">Due: {formatMoney(due)}</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center text-[var(--text-secondary)]">
                            No upcoming events found. Time to make some calls!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
