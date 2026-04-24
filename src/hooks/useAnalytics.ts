import { useMemo } from "react";
import { useBookings } from "./useBookings";
import { useExpenses } from "./useExpenses";
import { Booking } from "../types";
import {
    format, subMonths, startOfMonth, endOfMonth,
    isWithinInterval,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyRevenuePoint {
    month: string;      // "Jan '26"
    revenue: number;    // in ₹ (not paise)
    expenses: number;
    profit: number;
}

export interface EventTypeRevenue {
    name: string;       // "Wedding"
    value: number;      // in ₹
    count: number;
    color: string;
}

export interface PendingPaidSummary {
    paid: number;       // ₹
    pending: number;    // ₹
    total: number;      // ₹
    paidPct: number;    // 0-100
}

export interface RepeatClient {
    name: string;
    phone: string;
    bookings: number;
    revenue: number;  // ₹
}

export interface MostProfitableEvent {
    type: string;
    avgRevenue: number;  // ₹
    totalRevenue: number; // ₹
    count: number;
}

export interface AnalyticsResult {
    monthlyRevenue: MonthlyRevenuePoint[];
    eventTypeRevenue: EventTypeRevenue[];
    pendingPaid: PendingPaidSummary;
    repeatClients: RepeatClient[];
    topEventTypes: MostProfitableEvent[];  // sorted desc by avgRevenue
    totalRevenue: number;
    totalBookings: number;
    loading: boolean;
}

// ─── Color palette for event types ───────────────────────────────────────────

const EVENT_COLORS: Record<string, string> = {
    wedding: "#8b5cf6",
    "pre-wedding": "#ec4899",
    birthday: "#f97316",
    corporate: "#0ea5e9",
    haldi: "#eab308",
    mehndi: "#22c55e",
    tilak: "#3b82f6",
    other: "#6b7280",
};

const getEventColor = (type: string) =>
    EVENT_COLORS[type.toLowerCase()] ?? EVENT_COLORS.other;

// ─── Helper ───────────────────────────────────────────────────────────────────

const getBookingDate = (b: Booking): Date => {
    try {
        return b.eventDate?.toDate?.() ?? new Date(b.eventDate as any);
    } catch {
        return new Date();
    }
};

const ACTIVE = (b: Booking) =>
    b.status === "confirmed" || b.status === "completed";

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAnalytics = (): AnalyticsResult => {
    const { bookings, loading } = useBookings();
    const { expenses } = useExpenses();

    // ── 1. Monthly Revenue — last 6 months ────────────────────────────────────
    const monthlyRevenue = useMemo<MonthlyRevenuePoint[]>(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, i) => {
            const monthDate = subMonths(now, 5 - i);
            const start = startOfMonth(monthDate);
            const end = endOfMonth(monthDate);
            const interval = { start, end };
            const label = format(monthDate, "MMM ''yy");

            const rev = bookings
                .filter(b => ACTIVE(b) && isWithinInterval(getBookingDate(b), interval))
                .reduce((s, b) => s + (b.financials?.totalAmount ?? 0) / 100, 0);

            const exp = expenses
                .filter(e => {
                    const d = e.date?.toDate?.() ?? new Date(e.date as any);
                    return isWithinInterval(d, interval);
                })
                .reduce((s, e) => s + (e.amount ?? 0) / 100, 0);

            return { month: label, revenue: rev, expenses: exp, profit: rev - exp };
        });
    }, [bookings, expenses]);

    // ── 2. Event Type Revenue + Count (Pie chart) ─────────────────────────────
    const eventTypeRevenue = useMemo<EventTypeRevenue[]>(() => {
        const map = new Map<string, { value: number; count: number }>();
        for (const b of bookings) {
            if (!ACTIVE(b)) continue;
            const type = b.eventType ?? "other";
            const rev = (b.financials?.totalAmount ?? 0) / 100;
            const cur = map.get(type) ?? { value: 0, count: 0 };
            map.set(type, { value: cur.value + rev, count: cur.count + 1 });
        }
        return [...map.entries()]
            .map(([name, { value, count }]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                value: Math.round(value),
                count,
                color: getEventColor(name),
            }))
            .sort((a, b) => b.value - a.value);
    }, [bookings]);

    // ── 3. Pending vs Paid summary ────────────────────────────────────────────
    const pendingPaid = useMemo<PendingPaidSummary>(() => {
        let paid = 0, pending = 0;
        for (const b of bookings) {
            if (!ACTIVE(b)) continue;
            paid += (b.financials?.advancePaid ?? 0) / 100;
            pending += Math.max(0, (b.financials?.balanceDue ?? 0)) / 100;
        }
        const total = paid + pending;
        const paidPct = total > 0 ? Math.round((paid / total) * 100) : 0;
        return { paid: Math.round(paid), pending: Math.round(pending), total: Math.round(total), paidPct };
    }, [bookings]);

    // ── 4. Repeat clients (> 1 booking) ──────────────────────────────────────
    const repeatClients = useMemo<RepeatClient[]>(() => {
        const map = new Map<string, { name: string; phone: string; bookings: number; revenue: number }>();
        for (const b of bookings) {
            if (b.status === "cancelled" || b.status === "deleted") continue;
            const key = b.clientPhone ?? b.clientName;
            const cur = map.get(key) ?? { name: b.clientName, phone: b.clientPhone, bookings: 0, revenue: 0 };
            map.set(key, {
                ...cur,
                name: b.clientName,
                phone: b.clientPhone,
                bookings: cur.bookings + 1,
                revenue: cur.revenue + (b.financials?.totalAmount ?? 0) / 100,
            });
        }
        return [...map.values()]
            .filter(c => c.bookings > 1)
            .sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue);
    }, [bookings]);

    // ── 5. Most profitable event types (by avg revenue/booking) ──────────────
    const topEventTypes = useMemo<MostProfitableEvent[]>(() => {
        const map = new Map<string, { total: number; count: number }>();
        for (const b of bookings) {
            if (!ACTIVE(b)) continue;
            const type = b.eventType ?? "other";
            const rev = (b.financials?.totalAmount ?? 0) / 100;
            const cur = map.get(type) ?? { total: 0, count: 0 };
            map.set(type, { total: cur.total + rev, count: cur.count + 1 });
        }
        return [...map.entries()]
            .map(([type, { total, count }]) => ({
                type: type.charAt(0).toUpperCase() + type.slice(1),
                avgRevenue: Math.round(total / count),
                totalRevenue: Math.round(total),
                count,
            }))
            .sort((a, b) => b.avgRevenue - a.avgRevenue);
    }, [bookings]);

    // ── Totals ────────────────────────────────────────────────────────────────
    const totalRevenue = useMemo(() =>
        bookings
            .filter(ACTIVE)
            .reduce((s, b) => s + (b.financials?.totalAmount ?? 0) / 100, 0),
        [bookings]
    );

    return {
        monthlyRevenue,
        eventTypeRevenue,
        pendingPaid,
        repeatClients,
        topEventTypes,
        totalRevenue: Math.round(totalRevenue),
        totalBookings: bookings.filter(b => b.status !== "deleted").length,
        loading,
    };
};
