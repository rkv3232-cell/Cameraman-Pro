import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, collection, query, where, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { InventoryItem, Booking } from "../types";
import {
    format,
    startOfMonth, endOfMonth, eachDayOfInterval,
    isToday,
    addMonths, subMonths
} from "date-fns";

import { toast } from "react-hot-toast";
import {
    ArrowLeft, Camera, Zap, Disc, Box, PenTool,
    CheckCircle, AlertTriangle, Edit2, Trash2, Calendar,
    User, MapPin, Clock, TrendingUp, Package,
    Wrench, ZapOff, ShieldAlert, ChevronLeft, ChevronRight
} from "lucide-react";
import { Button } from "../components/ui/button";
import {
    EQUIPMENT_STATUS_CONFIG,
    getBookingDateRange,
    doRangesOverlap,
} from "../lib/equipmentConflict";

// ─── Status action matrix ─────────────────────────────────────────────────────

const STATUS_TRANSITIONS: {
    label: string;
    icon: any;
    toStatus: InventoryItem['status'];
    btnClass: string;
    fromStatuses: InventoryItem['status'][];
}[] = [
        {
            label: 'Mark Available',
            icon: CheckCircle,
            toStatus: 'available',
            btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            fromStatuses: ['maintenance', 'in_service', 'damaged', 'booked'],
        },
        {
            label: 'Mark Maintenance',
            icon: Wrench,
            toStatus: 'maintenance',
            btnClass: 'border-yellow-500/30 hover:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
            fromStatuses: ['available', 'booked', 'in_service'],
        },
        {
            label: 'Mark In Service',
            icon: ZapOff,
            toStatus: 'in_service',
            btnClass: 'border-orange-500/30 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400',
            fromStatuses: ['available', 'booked', 'maintenance'],
        },
        {
            label: 'Mark Damaged',
            icon: ShieldAlert,
            toStatus: 'damaged',
            btnClass: 'border-red-500/30 hover:bg-red-500/10 text-red-600 dark:text-red-400',
            fromStatuses: ['available', 'booked', 'maintenance', 'in_service'],
        },
    ];

// ─── Mini calendar for usage view ────────────────────────────────────────────

interface UsageCalendarProps {
    bookings: Booking[];
    equipmentId: string;
}

const UsageCalendar = ({ bookings, equipmentId }: UsageCalendarProps) => {
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Map: ISO date string -> booking list for that item on that day
    const dayBookingMap = useMemo(() => {
        const map = new Map<string, Booking[]>();
        for (const booking of bookings) {
            if (booking.status === 'cancelled') continue;
            const usesItem = booking.equipmentBooked?.some(eq => eq.itemId === equipmentId);
            if (!usesItem) continue;
            const range = getBookingDateRange(booking);
            for (const day of days) {
                const dayRange = { start: new Date(day.setHours(0, 0, 0, 0)), end: new Date(day.setHours(23, 59, 59, 999)) };
                if (doRangesOverlap(range, dayRange)) {
                    const key = format(day, 'yyyy-MM-dd');
                    if (!map.has(key)) map.set(key, []);
                    map.get(key)!.push(booking);
                }
            }
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bookings, calendarMonth, equipmentId]);

    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const firstDayOfWeek = monthStart.getDay(); // 0=Sun

    return (
        <div className="space-y-3">
            {/* Month nav */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {format(calendarMonth, 'MMMM yyyy')}
                </span>
                <button
                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                    className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {/* Header */}
                {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[10px] font-medium text-[var(--text-tertiary)] py-1">{d}</div>
                ))}
                {/* Leading blanks */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`blank-${i}`} />
                ))}
                {/* Days */}
                {days.map(day => {
                    const key = format(day, 'yyyy-MM-dd');
                    const dayBks = dayBookingMap.get(key) ?? [];
                    const hasBooking = dayBks.length > 0;
                    const today = isToday(day);

                    return (
                        <div
                            key={key}
                            title={dayBks.map(b => `${b.clientName} — ${b.eventType}`).join('\n')}
                            className={`relative flex flex-col items-center justify-start py-1 rounded-md min-h-[36px] text-[11px] transition-colors
                                ${hasBooking ? 'bg-blue-500/10 border border-blue-400/30 dark:border-blue-500/30' : 'hover:bg-[var(--surface-hover)]'}
                                ${today ? 'ring-1 ring-[var(--accent-primary)]' : ''}`}
                        >
                            <span className={`font-medium ${today ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`}>
                                {format(day, 'd')}
                            </span>
                            {hasBooking && (
                                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                            {dayBks.length > 1 && (
                                <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold">{dayBks.length}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 pt-1 text-[10px] text-[var(--text-tertiary)]">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                Reserved on this date
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const EquipmentDetails = () => {
    const { equipmentId } = useParams();
    const navigate = useNavigate();
    const [equipment, setEquipment] = useState<InventoryItem | null>(null);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCalendar, setShowCalendar] = useState(false);

    // FETCH EQUIPMENT
    useEffect(() => {
        if (!equipmentId) return;
        const unsubscribe = onSnapshot(doc(db, "inventory", equipmentId), (d) => {
            if (d.exists()) {
                setEquipment({ id: d.id, ...d.data() } as InventoryItem);
            } else {
                toast.error("Equipment not found");
                navigate("/inventory");
            }
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast.error("Error fetching equipment details");
            setLoading(false);
        });
        return () => unsubscribe();
    }, [equipmentId, navigate]);

    // FETCH RELATED BOOKINGS
    useEffect(() => {
        if (!equipment) return;
        const q = query(
            collection(db, "bookings"),
            where("studioId", "==", equipment.studioId),
            where("status", "!=", "deleted")
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Booking[];
            const related = all
                .filter(b => b.equipmentBooked?.some(eq => eq.itemId === equipmentId))
                .sort((a, b) => (b.eventDate?.toDate?.()?.getTime() ?? 0) - (a.eventDate?.toDate?.()?.getTime() ?? 0));
            setBookings(related);
        });
        return () => unsubscribe();
    }, [equipment, equipmentId]);

    // ACTIONS
    const updateStatus = async (status: InventoryItem['status']) => {
        if (!equipment) return;
        try {
            await updateDoc(doc(db, "inventory", equipment.id), { status });
            toast.success(`Status updated → ${EQUIPMENT_STATUS_CONFIG[status].label}`);
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleDelete = async () => {
        if (!equipment) return;
        if (!confirm("Are you sure you want to remove this equipment?")) return;
        try {
            await updateDoc(doc(db, "inventory", equipment.id), { status: "deleted" });
            toast.success("Equipment removed");
            navigate("/inventory");
        } catch {
            toast.error("Failed to remove equipment");
        }
    };

    if (loading) return <div className="p-8 text-center text-[var(--text-secondary)]">Loading equipment details...</div>;
    if (!equipment) return null;

    const statusCfg = EQUIPMENT_STATUS_CONFIG[equipment.status] ?? EQUIPMENT_STATUS_CONFIG['available'];

    // Icon helper
    const getIcon = () => {
        const p = { size: 24, className: "text-[var(--accent-primary)]" };
        switch (equipment.category) {
            case 'camera': return <Camera  {...p} />;
            case 'lighting': return <Zap     {...p} />;
            case 'lens': return <Disc    {...p} />;
            case 'accessory': return <Box     {...p} />;
            case 'drone': return <Package {...p} />;
            default: return <PenTool {...p} />;
        }
    };

    const now = new Date();

    // Real conflict detection using date ranges across all bookings
    const upcomingBookings = bookings.filter(b => {
        if (!['confirmed', 'pending'].includes(b.status)) return false;
        const range = getBookingDateRange(b);
        return range.end >= now;
    });

    const completedBookings = bookings.filter(b => {
        const range = getBookingDateRange(b);
        return b.status === 'completed' || range.end < now;
    });

    const currentBooking = bookings.find(b => {
        if (!['confirmed', 'pending'].includes(b.status)) return false;
        const range = getBookingDateRange(b);
        return range.start <= now && range.end >= now;
    }) ?? null;

    // Conflict = same equipment appearing in two upcoming bookings whose date ranges overlap
    const conflictingPairs: string[] = [];
    for (let i = 0; i < upcomingBookings.length; i++) {
        for (let j = i + 1; j < upcomingBookings.length; j++) {
            if (doRangesOverlap(getBookingDateRange(upcomingBookings[i]), getBookingDateRange(upcomingBookings[j]))) {
                if (!conflictingPairs.includes(upcomingBookings[i].id)) conflictingPairs.push(upcomingBookings[i].id);
                if (!conflictingPairs.includes(upcomingBookings[j].id)) conflictingPairs.push(upcomingBookings[j].id);
            }
        }
    }
    const hasConflicts = conflictingPairs.length > 0;

    // Available status transitions from current state
    const availableTransitions = STATUS_TRANSITIONS.filter(t => t.fromStatuses.includes(equipment.status));

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">

            {/* ── 1. HEADER ─────────────────────────────────────────────── */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate("/inventory")} className="h-10 w-10 p-0 rounded-full">
                        <ArrowLeft size={20} />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-[var(--surface-hover)] rounded-xl">{getIcon()}</div>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{equipment.name}</h1>
                            <div className="flex items-center gap-3 text-[var(--text-secondary)] text-sm mt-1">
                                <span className="capitalize flex items-center gap-1.5">
                                    <Package size={14} className="text-[var(--accent-secondary)]" />
                                    {equipment.category}
                                </span>
                                {equipment.serialNumber && (
                                    <>
                                        <span>•</span>
                                        <span className="font-mono text-xs">SN: {equipment.serialNumber}</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status + Actions */}
                <div className="flex flex-wrap gap-2 items-center">
                    {/* Current status badge */}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border ${statusCfg.badgeClass}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusCfg.dotClass} mr-1.5`} />
                        {statusCfg.label}
                    </span>

                    {/* Dynamic status transitions */}
                    {availableTransitions.map(t => {
                        const Icon = t.icon;
                        return (
                            <Button
                                key={t.toStatus}
                                variant="secondary"
                                className={t.btnClass}
                                onClick={() => updateStatus(t.toStatus)}
                            >
                                <Icon size={16} className="mr-2" /> {t.label}
                            </Button>
                        );
                    })}

                    <Button variant="danger" onClick={handleDelete}>
                        <Trash2 size={16} className="mr-2" /> Remove
                    </Button>
                </div>
            </header>

            {/* ── Damaged / In Service warning banner ───────────────────── */}
            {(equipment.status === 'damaged' || equipment.status === 'in_service') && (
                <div className={`p-4 rounded-xl border flex items-start gap-3
                    ${equipment.status === 'damaged'
                        ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-500/10 dark:border-orange-500/20'}`}>
                    <ShieldAlert size={20} className={equipment.status === 'damaged' ? 'text-red-500' : 'text-orange-500'} />
                    <div>
                        <h4 className={`font-semibold text-sm ${equipment.status === 'damaged' ? 'text-red-700 dark:text-red-400' : 'text-orange-700 dark:text-orange-400'}`}>
                            {equipment.status === 'damaged' ? 'Equipment Damaged' : 'Equipment In Service'}
                        </h4>
                        <p className="text-xs mt-0.5 text-[var(--text-secondary)]">
                            {equipment.status === 'damaged'
                                ? 'This equipment is marked as damaged and cannot be assigned to bookings until repaired and marked Available.'
                                : 'This equipment is currently in service/repair. It cannot be assigned to new bookings.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT COLUMN ────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 2. EQUIPMENT DETAILS */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Package size={20} className="text-[var(--accent-secondary)]" /> Equipment Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Category</label>
                                <p className="text-lg font-medium text-[var(--text-primary)] capitalize mt-1">{equipment.category}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Status</label>
                                <p className={`text-lg font-medium mt-1 capitalize ${statusCfg.badgeClass.includes('emerald') ? 'text-emerald-600' : ''}`}>
                                    {statusCfg.label}
                                </p>
                            </div>

                            {equipment.serialNumber && (
                                <div className="md:col-span-2">
                                    <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Serial Number</label>
                                    <p className="text-sm font-mono text-[var(--text-secondary)] mt-1 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)]">
                                        {equipment.serialNumber}
                                    </p>
                                </div>
                            )}

                            {equipment.notes && (
                                <div className="md:col-span-2">
                                    <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Notes</label>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)]">
                                        {equipment.notes}
                                    </p>
                                </div>
                            )}

                            {equipment.purchaseDate && (
                                <div className="md:col-span-2 border-t border-[var(--border-light)] pt-4 text-xs text-[var(--text-tertiary)]">
                                    Added: {format(equipment.purchaseDate.toDate(), 'dd MMM yyyy')}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 3. CURRENT ASSIGNMENT */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-[var(--accent-primary)]" /> Current Assignment
                        </h3>

                        {currentBooking ? (
                            <div className="bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl p-5 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="text-lg font-semibold text-[var(--text-primary)]">{currentBooking.clientName}</h4>
                                        <p className="text-sm text-[var(--text-secondary)] capitalize">{currentBooking.eventType}</p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-red-500/10 text-red-500 border border-red-500/20 text-xs rounded-full font-bold uppercase">In Use</span>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <User size={14} className="text-[var(--accent-tertiary)]" />
                                        <span>{currentBooking.clientPhone}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <Calendar size={14} className="text-[var(--accent-tertiary)]" />
                                        <span>{format(currentBooking.eventDate.toDate(), 'dd MMM yyyy')}</span>
                                    </div>
                                    {currentBooking.venue && (
                                        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                            <MapPin size={14} className="text-[var(--accent-tertiary)]" />
                                            <span>{currentBooking.venue}</span>
                                        </div>
                                    )}
                                </div>
                                <Button variant="secondary" className="w-full mt-4" onClick={() => navigate(`/bookings/${currentBooking.id}`)}>
                                    Open Booking
                                </Button>
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-[var(--border-light)] rounded-xl bg-[var(--bg-secondary)]">
                                <div className="inline-block p-3 rounded-full bg-emerald-500/10 text-emerald-500 mb-3">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-[var(--text-secondary)] text-sm">Not currently in use</p>
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">Not assigned to any active booking today</p>
                            </div>
                        )}
                    </section>

                    {/* 4. USAGE HISTORY */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <TrendingUp size={20} className="text-[var(--accent-secondary)]" /> Usage History
                            </h3>
                            <span className="text-sm font-medium text-[var(--text-tertiary)]">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
                        </div>

                        {bookings.length > 0 ? (
                            <div className="space-y-2">
                                {bookings.slice(0, 10).map(booking => {
                                    const eventDate = booking.eventDate?.toDate?.() ?? new Date();
                                    const range = getBookingDateRange(booking);
                                    const isActive = booking.id === currentBooking?.id;
                                    const isPast = range.end < now;
                                    const isConflict = conflictingPairs.includes(booking.id);

                                    return (
                                        <div
                                            key={booking.id}
                                            onClick={() => navigate(`/bookings/${booking.id}`)}
                                            className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer group
                                                ${isConflict
                                                    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5'
                                                    : 'bg-[var(--bg-secondary)] border-[var(--border-light)] hover:border-[var(--accent-primary)]'}`}
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                                                        {booking.clientName}
                                                    </p>
                                                    {isActive && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] rounded uppercase font-bold">Active</span>}
                                                    {isConflict && <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] rounded uppercase font-bold"><AlertTriangle size={9} /> Conflict</span>}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] mt-1">
                                                    <span className="capitalize">{booking.eventType}</span>
                                                    <span>•</span>
                                                    <span>{format(eventDate, 'dd MMM yyyy')}</span>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase
                                                ${booking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    booking.status === 'completed' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-amber-500/10 text-amber-500'}`}>
                                                {isPast && booking.status !== 'cancelled' ? 'Past' : booking.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-[var(--border-light)] rounded-xl bg-[var(--bg-secondary)]">
                                <p className="text-[var(--text-secondary)] text-sm">No usage history</p>
                                <p className="text-xs text-[var(--text-tertiary)] mt-1">This equipment hasn't been assigned to any booking yet</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* ── RIGHT COLUMN ───────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* 5. AVAILABILITY / CONFLICTS */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Clock size={20} className="text-[var(--accent-tertiary)]" /> Availability
                        </h3>

                        {/* Conflict warning */}
                        {hasConflicts && (
                            <div className="mb-5 p-4 bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                    <div>
                                        <h4 className="font-semibold text-red-700 dark:text-red-300 text-sm mb-1">
                                            Equipment already reserved on this date
                                        </h4>
                                        <p className="text-xs text-red-600/80 dark:text-red-300/80 mb-2">
                                            {conflictingPairs.length} booking{conflictingPairs.length > 1 ? 's' : ''} overlap on the same dates.
                                            Please review and resolve.
                                        </p>
                                        <div className="space-y-1">
                                            {upcomingBookings
                                                .filter(b => conflictingPairs.includes(b.id))
                                                .map(b => (
                                                    <button
                                                        key={b.id}
                                                        onClick={() => navigate(`/bookings/${b.id}`)}
                                                        className="block w-full text-left text-xs text-red-700 dark:text-red-300 hover:underline"
                                                    >
                                                        → {b.clientName} — {format(b.eventDate.toDate(), 'dd MMM')}
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Upcoming bookings */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                                Upcoming ({upcomingBookings.length})
                            </h4>
                            {upcomingBookings.length > 0 ? (
                                <div className="space-y-2">
                                    {upcomingBookings.slice(0, 5).map(booking => (
                                        <div
                                            key={booking.id}
                                            onClick={() => navigate(`/bookings/${booking.id}`)}
                                            className={`p-3 rounded-lg border text-sm cursor-pointer hover:border-[var(--accent-primary)] transition-colors
                                                ${conflictingPairs.includes(booking.id)
                                                    ? 'border-amber-300 bg-amber-50/50 dark:border-amber-500/30 dark:bg-amber-500/5'
                                                    : 'bg-[var(--bg-secondary)] border-[var(--border-light)]'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-[var(--text-primary)]">{booking.clientName}</span>
                                                {conflictingPairs.includes(booking.id) && (
                                                    <AlertTriangle size={12} className="text-amber-500" />
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-tertiary)]">{format(booking.eventDate.toDate(), 'dd MMM yyyy')}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-5 border border-dashed border-[var(--border-light)] rounded-lg bg-[var(--bg-secondary)]">
                                    <p className="text-xs text-[var(--text-tertiary)]">No upcoming bookings</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* 6. USAGE CALENDAR */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <button
                            className="w-full flex items-center justify-between mb-4"
                            onClick={() => setShowCalendar(v => !v)}
                        >
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Edit2 size={18} className="text-[var(--accent-primary)]" /> Usage Calendar
                            </h3>
                            <span className="text-xs text-[var(--accent-primary)]">{showCalendar ? 'Hide' : 'Show'}</span>
                        </button>

                        {showCalendar && (
                            <UsageCalendar bookings={bookings} equipmentId={equipmentId!} />
                        )}
                        {!showCalendar && (
                            <p className="text-xs text-[var(--text-tertiary)] text-center py-2">
                                Click to view a month-by-month booking calendar for this item.
                            </p>
                        )}
                    </section>

                    {/* 7. STATS */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5">Statistics</h3>
                        <div className="space-y-3">
                            {[
                                { label: 'Total Bookings', value: bookings.length, color: 'text-[var(--text-primary)]' },
                                { label: 'Completed', value: completedBookings.length, color: 'text-emerald-500' },
                                { label: 'Upcoming', value: upcomingBookings.length, color: 'text-blue-500' },
                                { label: 'Conflicts', value: conflictingPairs.length, color: hasConflicts ? 'text-red-500' : 'text-[var(--text-tertiary)]' },
                            ].map(stat => (
                                <div key={stat.label} className="flex justify-between items-center p-3 bg-[var(--bg-secondary)] rounded-lg">
                                    <span className="text-sm text-[var(--text-secondary)]">{stat.label}</span>
                                    <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
