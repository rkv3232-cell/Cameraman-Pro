import { useMemo } from "react";
import { differenceInCalendarDays, differenceInHours } from "date-fns";
import { Clock, CalendarCheck, Flame, CheckCircle2 } from "lucide-react";

interface EventCountdownProps {
    /** The event date (a Firestore Timestamp, Date, or ISO string) */
    eventDate: any;
    /** Optional: first sub-event date if available */
    subEventDate?: string | null;
    /** Booking status */
    status?: string;
}

export const EventCountdown = ({ eventDate, subEventDate, status }: EventCountdownProps) => {
    const { daysLeft, label, variant } = useMemo(() => {
        // Resolve the date to use — prefer subEventDate if provided
        let target: Date;
        try {
            if (subEventDate) {
                target = new Date(subEventDate);
            } else if (eventDate?.toDate) {
                target = eventDate.toDate();
            } else {
                target = new Date(eventDate);
            }
        } catch {
            return { daysLeft: null, hoursLeft: null, label: "Date unavailable", variant: "default" };
        }

        const now = new Date();
        const days = differenceInCalendarDays(target, now);
        const hours = differenceInHours(target, now);

        // Past event
        if (days < 0) {
            return {
                daysLeft: Math.abs(days),
                hoursLeft: null,
                label: `Event was ${Math.abs(days)} day${Math.abs(days) !== 1 ? "s" : ""} ago`,
                variant: "past" as const,
            };
        }
        // Today
        if (days === 0) {
            return {
                daysLeft: 0,
                hoursLeft: Math.max(0, hours),
                label: hours > 0 ? `Event today! In ${hours}h` : "Event happening now!",
                variant: "today" as const,
            };
        }
        // Tomorrow
        if (days === 1) {
            return { daysLeft: 1, hoursLeft: null, label: "Event tomorrow!", variant: "urgent" as const };
        }
        // Within a week
        if (days <= 7) {
            return { daysLeft: days, hoursLeft: null, label: `Event in ${days} days`, variant: "soon" as const };
        }
        // Future
        return { daysLeft: days, hoursLeft: null, label: `Event in ${days} days`, variant: "future" as const };
    }, [eventDate, subEventDate]);

    // Completed bookings — show a done state
    if (status === "completed") {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300">
                <CheckCircle2 size={15} className="shrink-0" />
                <span className="text-xs font-semibold">Event Completed</span>
            </div>
        );
    }

    if (daysLeft === null) return null;

    const classes = {
        past: "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-tertiary)]",
        today: "bg-red-50 border-red-300 text-red-700 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-300",
        urgent: "bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-500/15 dark:border-orange-500/30 dark:text-orange-300",
        soon: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/20 dark:text-amber-300",
        future: "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-300",
        default: "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)]",
    }[variant];

    const Icon = {
        past: Clock,
        today: Flame,
        urgent: Flame,
        soon: Clock,
        future: CalendarCheck,
        default: Clock,
    }[variant];

    return (
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${classes}`}>
            <Icon size={14} className="shrink-0" />
            <span>{label}</span>
            {/* Big day number for extra context on non-past events */}
            {variant !== "past" && daysLeft > 1 && (
                <span className="ml-0.5 text-[10px] opacity-70 font-normal">
                    ({daysLeft}d)
                </span>
            )}
        </div>
    );
};
