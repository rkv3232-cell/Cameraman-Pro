import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalytics } from "../hooks/useAnalytics";
import { formatMoney } from "../utils/currency";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, Area, AreaChart,
} from "recharts";
import {
    TrendingUp, TrendingDown, DollarSign, Users, Star,
    ArrowLeft, BarChart3, PieChart as PieIcon, RefreshCw,
    CheckCircle, Clock, Award, Repeat2,
} from "lucide-react";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const fmt = (n: number) => formatMoney(n);

// Custom Recharts tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl p-3 shadow-xl text-xs">
            {label && <p className="font-semibold text-[var(--text-secondary)] mb-2">{label}</p>}
            {payload.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 py-0.5">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: item.color || item.fill }} />
                    <span className="text-[var(--text-primary)] font-medium capitalize">{item.name}:</span>
                    <span style={{ color: item.color || item.fill }} className="font-bold">
                        {typeof item.value === "number" && item.name !== "count"
                            ? fmt(item.value)
                            : item.value}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Stat card
const StatCard = ({
    title, value, sub, icon: Icon, iconColor, trend, glow,
}: {
    title: string; value: string | number; sub?: string;
    icon: any; iconColor: string; trend?: "up" | "down" | "neutral"; glow?: boolean;
}) => (
    <div className={`relative bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all overflow-hidden ${glow ? "ring-1 ring-[var(--accent-primary)]/20" : ""}`}>
        <div className="flex items-start justify-between mb-3">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
            <div className={`p-2 rounded-xl bg-[var(--bg-secondary)] ${iconColor}`}>
                <Icon size={16} />
            </div>
        </div>
        <h3 className="text-2xl font-bold text-[var(--text-primary)]">{value}</h3>
        {sub && (
            <div className="flex items-center gap-1.5 mt-1.5">
                {trend === "up" && <TrendingUp size={12} className="text-emerald-500" />}
                {trend === "down" && <TrendingDown size={12} className="text-red-500" />}
                <p className="text-xs text-[var(--text-tertiary)]">{sub}</p>
            </div>
        )}
    </div>
);

// Section wrapper
const Section = ({ title, icon: Icon, iconColor, children, badge }: {
    title: string; icon: any; iconColor: string;
    children: React.ReactNode; badge?: React.ReactNode;
}) => (
    <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                <span className={`${iconColor}`}><Icon size={20} /></span>
                {title}
            </h2>
            {badge}
        </div>
        {children}
    </div>
);

// Empty state
const EmptyChart = ({ message = "Not enough data yet" }: { message?: string }) => (
    <div className="flex flex-col items-center justify-center h-52 text-[var(--text-tertiary)]">
        <BarChart3 size={36} className="mb-3 opacity-30" />
        <p className="text-sm">{message}</p>
        <p className="text-xs mt-1 opacity-70">Add more bookings to see insights</p>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const Analytics = () => {
    const navigate = useNavigate();
    const {
        monthlyRevenue, eventTypeRevenue, pendingPaid,
        repeatClients, topEventTypes, totalRevenue, totalBookings, loading,
    } = useAnalytics();

    const [activeTab, setActiveTab] = useState<"revenue" | "events" | "clients">("revenue");

    // Derived totals shown at top
    const thisMonthRevenue = monthlyRevenue[monthlyRevenue.length - 1]?.revenue ?? 0;
    const lastMonthRevenue = monthlyRevenue[monthlyRevenue.length - 2]?.revenue ?? 0;
    const revenueChange = lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

    const topEvent = topEventTypes[0];
    const hasData = totalBookings > 0;

    // Color gradient for bar chart bars
    const BAR_COLORS = { revenue: "#8b5cf6", expenses: "#f97316", profit: "#22c55e" };

    // Custom legend for Pie
    const renderCustomLegend = (props: any) => {
        const { payload } = props;
        return (
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-3">
                {(payload ?? []).map((entry: any, i: number) => (
                    <li key={i} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
                        <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: entry.color }} />
                        {entry.value}
                    </li>
                ))}
            </ul>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-[var(--text-secondary)]">
                <RefreshCw size={20} className="mr-2 animate-spin" /> Loading analytics...
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 transition-all"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Business Analytics</h1>
                        <p className="text-[var(--text-secondary)] text-sm mt-0.5">
                            Studio performance · {totalBookings} total bookings
                        </p>
                    </div>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-[var(--bg-secondary)] rounded-xl p-1 border border-[var(--border-light)] self-start sm:self-auto">
                    {([
                        { id: "revenue", label: "Revenue" },
                        { id: "events", label: "Events" },
                        { id: "clients", label: "Clients" },
                    ] as const).map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
                                ${activeTab === tab.id
                                    ? "bg-[var(--accent-primary)] text-white shadow-sm"
                                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="This Month Revenue"
                    value={fmt(thisMonthRevenue)}
                    sub={revenueChange >= 0
                        ? `+${revenueChange}% vs last month`
                        : `${revenueChange}% vs last month`}
                    icon={DollarSign}
                    iconColor="text-emerald-500"
                    trend={revenueChange >= 0 ? "up" : "down"}
                    glow
                />
                <StatCard
                    title="Pending Balance"
                    value={fmt(pendingPaid.pending)}
                    sub={`${100 - pendingPaid.paidPct}% of total receivables`}
                    icon={Clock}
                    iconColor="text-orange-500"
                    trend="neutral"
                />
                <StatCard
                    title="Repeat Clients"
                    value={repeatClients.length}
                    sub={`${repeatClients.length > 0 ? "Loyal regulars 💛" : "Keep booking!"}`}
                    icon={Repeat2}
                    iconColor="text-blue-500"
                />
                <StatCard
                    title="Top Event Type"
                    value={topEvent?.type ?? "—"}
                    sub={topEvent ? `Avg ${fmt(topEvent.avgRevenue)}/booking` : "No data yet"}
                    icon={Award}
                    iconColor="text-purple-500"
                />
            </div>

            {/* ── Revenue Tab ────────────────────────────────────────── */}
            {activeTab === "revenue" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Monthly Revenue Bar Chart — 2/3 width */}
                    <Section title="Monthly Revenue" icon={BarChart3} iconColor="text-purple-500"
                        badge={<span className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2 py-0.5 rounded-full">Last 6 months</span>}
                    >
                        <div className="lg:col-span-2" style={{ width: "100%" }}>
                            {!hasData ? <EmptyChart /> : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="30%">
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                                            axisLine={false} tickLine={false}
                                            tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
                                        <Bar dataKey="revenue" name="Revenue" fill={BAR_COLORS.revenue} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expenses" name="Expenses" fill={BAR_COLORS.expenses} radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="profit" name="Profit" fill={BAR_COLORS.profit} radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>

                        {/* Monthly legend */}
                        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[var(--border-light)]">
                            {[
                                { label: "Revenue", color: BAR_COLORS.revenue },
                                { label: "Expenses", color: BAR_COLORS.expenses },
                                { label: "Profit", color: BAR_COLORS.profit },
                            ].map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                    <span className="w-3 h-3 rounded-sm inline-block" style={{ background: color }} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </Section>

                    {/* Pending vs Paid — 1/3 width */}
                    <Section title="Pending vs Paid" icon={CheckCircle} iconColor="text-emerald-500">
                        {!hasData ? <EmptyChart message="No financial data" /> : (
                            <>
                                {/* Donut-like pie */}
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: "Paid", value: pendingPaid.paid, color: "#22c55e" },
                                                { name: "Pending", value: pendingPaid.pending, color: "#f97316" },
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={50} outerRadius={74}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            <Cell fill="#22c55e" />
                                            <Cell fill="#f97316" />
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>

                                {/* Stats rows */}
                                <div className="space-y-2.5 mt-2">
                                    {[
                                        { label: "Paid", amount: pendingPaid.paid, color: "#22c55e", pct: pendingPaid.paidPct },
                                        { label: "Pending", amount: pendingPaid.pending, color: "#f97316", pct: 100 - pendingPaid.paidPct },
                                    ].map(row => (
                                        <div key={row.label} className="flex justify-between items-center text-sm p-2.5 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-light)]">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.color }} />
                                                <span className="text-[var(--text-secondary)] font-medium">{row.label}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-[var(--text-primary)]">{fmt(row.amount)}</p>
                                                <p className="text-[10px] text-[var(--text-tertiary)]">{row.pct}%</p>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center text-sm p-2.5 bg-[var(--surface-base)] rounded-lg border border-[var(--border-light)]">
                                        <span className="font-semibold text-[var(--text-primary)]">Total</span>
                                        <span className="font-bold text-[var(--text-primary)]">{fmt(pendingPaid.total)}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </Section>
                </div>
            )}

            {/* ── Events Tab ─────────────────────────────────────────── */}
            {activeTab === "events" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Event Type Pie Chart */}
                    <Section title="Revenue by Event Type" icon={PieIcon} iconColor="text-pink-500">
                        {eventTypeRevenue.length === 0 ? <EmptyChart /> : (
                            <>
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={eventTypeRevenue}
                                            cx="50%" cy="50%"
                                            innerRadius={65} outerRadius={100}
                                            paddingAngle={3}
                                            dataKey="value"
                                            label={({ name, percent }: { name?: string; percent?: number }) =>
                                                (percent ?? 0) > 0.05 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ""
                                            }
                                            labelLine={false}
                                        >
                                            {eventTypeRevenue.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend content={renderCustomLegend} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        )}
                    </Section>

                    {/* Most Profitable Event Types */}
                    <Section
                        title="Profitability Ranking"
                        icon={Award}
                        iconColor="text-amber-500"
                        badge={<span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2 py-0.5 rounded-full uppercase tracking-wider">Avg Revenue / Booking</span>}
                    >
                        {topEventTypes.length === 0 ? <EmptyChart /> : (
                            <div className="space-y-3">
                                {topEventTypes.map((et, i) => {
                                    const maxAvg = topEventTypes[0].avgRevenue;
                                    const barPct = maxAvg > 0 ? Math.round((et.avgRevenue / maxAvg) * 100) : 0;
                                    const medal = ["🥇", "🥈", "🥉"][i] ?? `#${i + 1}`;
                                    return (
                                        <div key={et.type} className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5 text-sm">
                                                    <span className="text-base">{medal}</span>
                                                    <span className="font-semibold text-[var(--text-primary)]">{et.type}</span>
                                                    <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] px-1.5 py-0.5 rounded-md">
                                                        {et.count} booking{et.count !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-[var(--text-primary)]">{fmt(et.avgRevenue)}</p>
                                                    <p className="text-[10px] text-[var(--text-tertiary)]">Total {fmt(et.totalRevenue)}</p>
                                                </div>
                                            </div>
                                            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 border border-[var(--border-light)]">
                                                <div
                                                    className="h-1.5 rounded-full transition-all duration-700"
                                                    style={{
                                                        width: `${barPct}%`,
                                                        background: getEventTypeColor(et.type),
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Section>

                    {/* Trend line (revenue area chart) */}
                    <div className="lg:col-span-2">
                        <Section title="6-Month Revenue Trend" icon={TrendingUp} iconColor="text-indigo-500">
                            {!hasData ? <EmptyChart /> : (
                                <ResponsiveContainer width="100%" height={200}>
                                    <AreaChart data={monthlyRevenue} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                        <defs>
                                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                        <YAxis
                                            tick={{ fill: "var(--text-tertiary)", fontSize: 10 }}
                                            axisLine={false} tickLine={false}
                                            tickFormatter={v => v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : `₹${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#8b5cf6" strokeWidth={2} fill="url(#revGrad)" dot={false} />
                                        <Area type="monotone" dataKey="profit" name="Profit" stroke="#22c55e" strokeWidth={2} fill="url(#profitGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </Section>
                    </div>
                </div>
            )}

            {/* ── Clients Tab ────────────────────────────────────────── */}
            {activeTab === "clients" && (
                <div className="space-y-6">

                    {/* Repeat Clients */}
                    <Section
                        title="Repeat Clients"
                        icon={Repeat2}
                        iconColor="text-blue-500"
                        badge={
                            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border
                                ${repeatClients.length > 0
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                                    : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-light)]"}`}>
                                {repeatClients.length} loyal client{repeatClients.length !== 1 ? "s" : ""}
                            </span>
                        }
                    >
                        {repeatClients.length === 0 ? (
                            <EmptyChart message="No repeat clients yet" />
                        ) : (
                            <div className="space-y-3">
                                {repeatClients.map((client, i) => (
                                    <div
                                        key={client.phone}
                                        className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)] hover:border-[var(--accent-primary)]/30 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold text-sm flex items-center justify-center shrink-0 border border-[var(--accent-primary)]/20">
                                                {client.name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-[var(--text-primary)] text-sm">{client.name}</p>
                                                    {i === 0 && <span className="text-xs">⭐ Top Client</span>}
                                                </div>
                                                <p className="text-xs text-[var(--text-tertiary)]">{client.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-[var(--text-primary)] text-sm">{fmt(client.revenue)}</p>
                                            <p className="text-xs text-[var(--text-tertiary)]">
                                                {client.bookings} booking{client.bookings > 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>

                    {/* Bar chart for repeat client bookings */}
                    {repeatClients.length > 0 && (
                        <Section title="Repeat Client Bookings" icon={Users} iconColor="text-indigo-500">
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart
                                    data={repeatClients.slice(0, 8).map(c => ({
                                        name: c.name.split(" ")[0],
                                        bookings: c.bookings,
                                        revenue: c.revenue,
                                    }))}
                                    margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                                    barCategoryGap="40%"
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} tick={{ fill: "var(--text-tertiary)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--surface-hover)" }} />
                                    <Bar dataKey="bookings" name="Bookings" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                    )}

                    {/* Total Revenue Summary */}
                    <div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">All-Time Studio Revenue</p>
                            <h2 className="text-4xl font-black text-[var(--text-primary)] mt-1">{fmt(totalRevenue)}</h2>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1.5">
                                Across {totalBookings} bookings
                                {repeatClients.length > 0 && ` · ${repeatClients.length} repeat client${repeatClients.length !== 1 ? "s" : ""}`}
                            </p>
                        </div>
                        <div className="p-5 rounded-2xl bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                            <Star size={40} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Local color helper (for profitability bars) ──────────────────────────────

function getEventTypeColor(type: string): string {
    const map: Record<string, string> = {
        Wedding: "#8b5cf6", "Pre-wedding": "#ec4899", Birthday: "#f97316",
        Corporate: "#0ea5e9", Haldi: "#eab308", Mehndi: "#22c55e",
        Tilak: "#3b82f6", Other: "#6b7280",
    };
    return map[type] ?? "#6366f1";
}
