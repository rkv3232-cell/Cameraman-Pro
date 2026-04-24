import { Booking, InventoryItem } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRange {
    start: Date;
    end: Date;
}

export interface ConflictInfo {
    bookingId: string;
    clientName: string;
    eventDate: Date;
    eventType: string;
}

export interface EquipmentConflictResult {
    hasConflict: boolean;
    conflicts: ConflictInfo[];
    /** True when the item's status blocks assignment regardless of dates */
    isStatusBlocked: boolean;
    statusBlockReason: string | null;
}

// ─── Status guards ────────────────────────────────────────────────────────────

/** Statuses that prevent equipment from being assigned to any booking */
const BLOCKED_STATUSES: InventoryItem['status'][] = ['damaged', 'in_service', 'deleted'];

/** Human-readable reason for each blocked status */
const STATUS_BLOCK_MESSAGES: Partial<Record<InventoryItem['status'], string>> = {
    damaged: 'This equipment is damaged and cannot be assigned.',
    in_service: 'This equipment is currently in service / under repair.',
    deleted: 'This equipment has been removed from inventory.',
};

export function isStatusBlocked(status: InventoryItem['status']): boolean {
    return BLOCKED_STATUSES.includes(status);
}

export function getStatusBlockReason(status: InventoryItem['status']): string | null {
    return STATUS_BLOCK_MESSAGES[status] ?? null;
}

// ─── Date-range helpers ───────────────────────────────────────────────────────

/**
 * Derives the date range for a booking.
 * If the booking has sub-events, the range spans from the earliest to the latest sub-event date.
 * Otherwise it is a single day (eventDate).
 */
export function getBookingDateRange(booking: Booking): DateRange {
    if (booking.subEvents && booking.subEvents.length > 0) {
        const dates = booking.subEvents.map(se => new Date(se.date).getTime());
        const minMs = Math.min(...dates);
        const maxMs = Math.max(...dates);
        const start = new Date(minMs);
        const end = new Date(maxMs);
        // Normalize to midnight so we compare whole days
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    }

    const d = booking.eventDate?.toDate?.() ?? new Date();
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    return { start, end };
}

/**
 * Returns true if two date ranges overlap (inclusive on both ends).
 */
export function doRangesOverlap(a: DateRange, b: DateRange): boolean {
    return a.start <= b.end && a.end >= b.start;
}

// ─── Core conflict checker ────────────────────────────────────────────────────

/**
 * Checks whether a given inventory item has conflicts over the provided date range.
 *
 * @param item            – The inventory item being evaluated
 * @param targetRange     – The date range of the booking being created/edited
 * @param allBookings     – All studio bookings (fetched in memory)
 * @param excludeBookingId – Optional: booking ID to exclude (for edit mode, skip self)
 */
export function checkEquipmentConflict(
    item: InventoryItem,
    targetRange: DateRange,
    allBookings: Booking[],
    excludeBookingId?: string
): EquipmentConflictResult {
    // 1. Status block check (highest priority)
    if (isStatusBlocked(item.status)) {
        return {
            hasConflict: false, // date conflict irrelevant
            conflicts: [],
            isStatusBlocked: true,
            statusBlockReason: getStatusBlockReason(item.status),
        };
    }

    // 2. Date-range conflict check
    const conflicts: ConflictInfo[] = [];

    for (const booking of allBookings) {
        // Skip irrelevant booking statuses
        if (booking.status === 'cancelled' || booking.status === 'deleted' || booking.status === 'completed') continue;
        // Skip self when editing
        if (excludeBookingId && booking.id === excludeBookingId) continue;
        // Check if this booking uses the item
        const usesItem = booking.equipmentBooked?.some(eq => eq.itemId === item.id);
        if (!usesItem) continue;
        // Check date overlap
        const bookingRange = getBookingDateRange(booking);
        if (doRangesOverlap(targetRange, bookingRange)) {
            conflicts.push({
                bookingId: booking.id,
                clientName: booking.clientName,
                eventDate: booking.eventDate?.toDate?.() ?? new Date(),
                eventType: booking.eventType,
            });
        }
    }

    return {
        hasConflict: conflicts.length > 0,
        conflicts,
        isStatusBlocked: false,
        statusBlockReason: null,
    };
}

// ─── Batch checker (for EquipmentSelector) ───────────────────────────────────

/**
 * Returns a Map<itemId, EquipmentConflictResult> for a list of inventory items.
 * Efficient: iterates bookings once per item.
 */
export function batchCheckConflicts(
    items: InventoryItem[],
    targetRange: DateRange,
    allBookings: Booking[],
    excludeBookingId?: string
): Map<string, EquipmentConflictResult> {
    const results = new Map<string, EquipmentConflictResult>();
    for (const item of items) {
        results.set(item.id, checkEquipmentConflict(item, targetRange, allBookings, excludeBookingId));
    }
    return results;
}

// ─── Status badge config (shared across UI) ──────────────────────────────────

export interface StatusConfig {
    label: string;
    badgeClass: string;  // Tailwind classes for badge
    dotClass: string;  // Tailwind class for indicator dot
    canAssign: boolean; // Whether bookings can use this item
}

export const EQUIPMENT_STATUS_CONFIG: Record<InventoryItem['status'], StatusConfig> = {
    available: {
        label: 'Available',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
        dotClass: 'bg-emerald-500',
        canAssign: true,
    },
    booked: {
        label: 'Reserved',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20',
        dotClass: 'bg-blue-500',
        canAssign: true,  // Allow – conflicts resolved by date logic
    },
    maintenance: {
        label: 'Maintenance',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20',
        dotClass: 'bg-amber-500',
        canAssign: false,
    },
    in_service: {
        label: 'In Service',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20',
        dotClass: 'bg-orange-500',
        canAssign: false,
    },
    damaged: {
        label: 'Damaged',
        badgeClass: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
        dotClass: 'bg-red-500',
        canAssign: false,
    },
    deleted: {
        label: 'Deleted',
        badgeClass: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20',
        dotClass: 'bg-gray-400',
        canAssign: false,
    },
};
