import { useState } from "react";
import {
    format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
    eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday
} from "date-fns";
import { useBookings } from "../hooks/useBookings";
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from "lucide-react";
import { Booking } from "../types";

// ─── Color Coding by Event / Sub-Event Type ──────────────────────────────────
// Returns Tailwind bg color class for a given event type string.
function getEventColor(eventType: string): string {
    const type = eventType?.toLowerCase().trim();
    switch (type) {
        case 'wedding': return 'bg-purple-500';
        case 'tilak': return 'bg-blue-500';
        case 'haldi': return 'bg-yellow-400';
        case 'mehndi': return 'bg-green-500';
        case 'pre-wedding': return 'bg-pink-500';
        case 'corporate': return 'bg-sky-500';
        case 'birthday': return 'bg-orange-400';
        default: return 'bg-[var(--accent-primary)]';
    }
}

// Returns a CSS hex / hsl string for use in inline border-color etc.
function getEventHex(eventType: string): string {
    const type = eventType?.toLowerCase().trim();
    switch (type) {
        case 'wedding': return '#a855f7';
        case 'tilak': return '#3b82f6';
        case 'haldi': return '#facc15';
        case 'mehndi': return '#22c55e';
        case 'pre-wedding': return '#ec4899';
        case 'corporate': return '#0ea5e9';
        case 'birthday': return '#fb923c';
        default: return 'var(--accent-primary)';
    }
}

// ─── Multi-Day Booking Logic ──────────────────────────────────────────────────
// Returns the effective "event type" for a booking on a specific day.
// For sub-event days, returns the sub-event's title so color matches the ceremony.
function getEffectiveType(booking: Booking, day: Date): string {
    if (booking.subEvents && booking.subEvents.length > 0) {
        const dayStr = format(day, 'yyyy-MM-dd');
        const subEvent = booking.subEvents.find(se => se.date === dayStr);
        if (subEvent) return subEvent.title;   // e.g. "Haldi", "Mehndi"
    }
    return booking.eventType;
}

// Returns all bookings (confirmed or pending) that occur on a given day.
// Checks both the primary eventDate and every sub-event date.
function getBookingsForDay(bookings: Booking[], day: Date): Booking[] {
    return bookings.filter(b => {
        if (b.status !== 'confirmed' && b.status !== 'pending') return false;
        const isMainDay = isSameDay(b.eventDate.toDate(), day);
        const dayStr = format(day, 'yyyy-MM-dd');
        const isSubDay = b.subEvents?.some(se => se.date === dayStr);
        return isMainDay || isSubDay;
    });
}

// ─── Overbooking threshold ────────────────────────────────────────────────────
const OVERBOOK_THRESHOLD = 3;

// ─── Calendar Component ───────────────────────────────────────────────────────
export const Calendar = () => {
    const { bookings, loading } = useBookings();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    const selectedDateBookings = selectedDate ? getBookingsForDay(bookings, selectedDate) : [];

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center text-slate-400">
                <Loader2 className="animate-spin mr-2" /> Loading calendar...
            </div>
        );
    }

    const weeks = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[calc(100vh-100px)] pb-4">
            {/* ── Calendar Grid ──────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-[var(--border-light)]">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 text-xs font-medium bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded border border-[var(--border-light)] hover:bg-[var(--surface-hover)] transition-colors"
                        >
                            Today
                        </button>
                        <button onClick={prevMonth} className="p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={nextMonth} className="p-1 hover:bg-[var(--surface-hover)] rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Day-of-week header */}
                <div className="grid grid-cols-7 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
                    {weeks.map(day => (
                        <div key={day} className="py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Day cells */}
                <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[var(--border-light)] gap-[1px]">
                    {calendarDays.map((day, idx) => {
                        const dayBookings = getBookingsForDay(bookings, day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isOverbooked = dayBookings.length > OVERBOOK_THRESHOLD;

                        // Show up to 3 indicator dots; rest shown as "+N more"
                        const visibleBookings = dayBookings.slice(0, 3);
                        const hiddenCount = dayBookings.length - 3;

                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedDate(day)}
                                className={[
                                    'relative bg-[var(--surface-base)] p-2 min-h-[80px] cursor-pointer transition-colors hover:bg-[var(--surface-hover)]',
                                    !isCurrentMonth ? 'opacity-40 bg-[var(--bg-secondary)]' : '',
                                    isSelected ? 'ring-2 ring-inset ring-[var(--accent-primary)] z-10' : '',
                                    isOverbooked ? 'ring-2 ring-inset ring-red-500 z-10' : '',
                                ].join(' ')}
                            >
                                {/* Date number */}
                                <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full
                                    ${isToday(day) ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-tertiary)]'}
                                `}>
                                    {format(day, 'd')}
                                </div>

                                {/* Overbooking warning badge */}
                                {isOverbooked && (
                                    <div className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                                        <AlertTriangle size={8} />
                                        <span>{dayBookings.length}</span>
                                    </div>
                                )}

                                {/* Booking indicator dots */}
                                <div className="space-y-0.5">
                                    {visibleBookings.map(booking => {
                                        const effectiveType = getEffectiveType(booking, day);
                                        const colorClass = getEventColor(effectiveType);
                                        return (
                                            <div
                                                key={booking.id}
                                                className={`h-1.5 w-full rounded-full ${colorClass}`}
                                                title={`${booking.clientName} — ${effectiveType}`}
                                            />
                                        );
                                    })}

                                    {/* +N more badge */}
                                    {hiddenCount > 0 && (
                                        <div className="text-[9px] font-semibold text-[var(--text-tertiary)] text-center leading-tight">
                                            +{hiddenCount} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Color legend */}
                <div className="p-3 border-t border-[var(--border-light)] bg-[var(--bg-secondary)] flex flex-wrap gap-3">
                    {[
                        { label: 'Wedding', color: 'bg-purple-500' },
                        { label: 'Tilak', color: 'bg-blue-500' },
                        { label: 'Haldi', color: 'bg-yellow-400' },
                        { label: 'Mehndi', color: 'bg-green-500' },
                        { label: 'Pre-Wedding', color: 'bg-pink-500' },
                        { label: 'Corporate', color: 'bg-sky-500' },
                        { label: 'Birthday', color: 'bg-orange-400' },
                        { label: 'Other', color: 'bg-[var(--accent-primary)]' },
                    ].map(item => (
                        <div key={item.label} className="flex items-center gap-1.5">
                            <span className={`inline-block w-2.5 h-2.5 rounded-full ${item.color}`} />
                            <span className="text-[10px] text-[var(--text-secondary)]">{item.label}</span>
                        </div>
                    ))}
                    <div className="flex items-center gap-1.5 ml-auto">
                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-[10px] text-[var(--text-secondary)]">Heavy Workload (&gt;{OVERBOOK_THRESHOLD})</span>
                    </div>
                </div>
            </div>

            {/* ── Side Panel ─────────────────────────────────────────── */}
            <div className="w-full lg:w-80 lg:min-w-[320px] flex-shrink-0 bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] flex flex-col h-[500px] lg:h-full shadow-sm">
                {/* Panel header */}
                <div className="p-4 border-b border-[var(--border-light)] bg-[var(--bg-secondary)]">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                        {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a date'}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-[var(--text-secondary)]">
                            {selectedDateBookings.length} event{selectedDateBookings.length !== 1 ? 's' : ''} scheduled
                        </p>
                        {selectedDateBookings.length > OVERBOOK_THRESHOLD && (
                            <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-full border border-red-500/30">
                                <AlertTriangle size={10} />
                                Heavy Workload
                            </span>
                        )}
                    </div>
                </div>

                {/* Booking cards */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {selectedDateBookings.length > 0 ? (
                        selectedDateBookings.map(booking => {
                            const effectiveType = getEffectiveType(booking, selectedDate!);
                            const accentHex = getEventHex(effectiveType);

                            // Resolve the time to display (sub-event time takes priority)
                            const displayTime = (() => {
                                if (selectedDate) {
                                    const dayStr = format(selectedDate, 'yyyy-MM-dd');
                                    const subEvent = booking.subEvents?.find(se => se.date === dayStr);
                                    if (subEvent) return subEvent.time;
                                }
                                return format(booking.eventDate.toDate(), 'h:mm a');
                            })();

                            return (
                                <div
                                    key={booking.id}
                                    className="p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border-light)] space-y-2 hover:shadow-md transition-shadow group"
                                    style={{ borderLeftWidth: '3px', borderLeftColor: accentHex }}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                            ${booking.status === 'confirmed'
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500'
                                                : 'bg-amber-50 text-amber-600 dark:bg-orange-500/10 dark:text-orange-500'
                                            }`}
                                        >
                                            {booking.status}
                                        </span>
                                        <span className="text-xs text-[var(--text-tertiary)]">{displayTime}</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                            {booking.clientName}
                                        </h4>
                                        <p className="text-xs text-[var(--text-secondary)] capitalize">
                                            {effectiveType} • {booking.venue}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-[var(--text-tertiary)]">
                            <p>No events for this day.</p>
                            {isSameMonth(selectedDate || new Date(), currentDate) && (
                                <p className="text-xs mt-2 opacity-60">Click "+ New Booking" in the sidebar to add one.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
