import { useMemo } from "react";
import { useInventory } from "../../hooks/useInventory";
import { useBookings } from "../../hooks/useBookings";
import { BookedEquipmentItem, EquipmentCategory, InventoryItem } from "../../types";
import { Camera, Zap, Disc, Plus, Trash2, AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { useState } from "react";
import {
    batchCheckConflicts,
    EQUIPMENT_STATUS_CONFIG,
    isStatusBlocked,
} from "../../lib/equipmentConflict";

// ─── Props ────────────────────────────────────────────────────────────────────

interface EquipmentSelectorProps {
    selectedEquipment: BookedEquipmentItem[];
    onUpdate: (items: BookedEquipmentItem[]) => void;
    /** The primary event date for the booking being created/edited */
    eventDate: Date;
    /** Start of the booking date range (earliest sub-event). Defaults to eventDate. */
    rangeStart?: Date;
    /** End of the booking date range (latest sub-event). Defaults to eventDate. */
    rangeEnd?: Date;
    /** Booking ID being edited (excluded from conflict scan) */
    editingBookingId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getIcon = (cat: string) => {
    switch (cat) {
        case 'camera': return <Camera size={16} />;
        case 'lighting': return <Zap size={16} />;
        case 'lens': return <Disc size={16} />;
        default: return <Camera size={16} />;
    }
};

// ─── Component ────────────────────────────────────────────────────────────────

export const EquipmentSelector = ({
    selectedEquipment,
    onUpdate,
    eventDate,
    rangeStart,
    rangeEnd,
    editingBookingId,
}: EquipmentSelectorProps) => {
    const { inventory, loading } = useInventory();
    const { bookings } = useBookings();

    const [categoryFilter, setCategoryFilter] = useState<EquipmentCategory | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState("");

    // Build the date range to check conflicts against
    const targetRange = useMemo(() => {
        const start = new Date(rangeStart ?? eventDate); start.setHours(0, 0, 0, 0);
        const end = new Date(rangeEnd ?? eventDate); end.setHours(23, 59, 59, 999);
        return { start, end };
    }, [rangeStart, rangeEnd, eventDate]);

    // Run batch conflict check for all inventory items
    const conflictMap = useMemo(
        () => batchCheckConflicts(inventory, targetRange, bookings, editingBookingId),
        [inventory, targetRange, bookings, editingBookingId]
    );

    // Filtered list — exclude deleted items; keep damaged/in_service so user sees why they can't add
    const filteredInventory = useMemo(() => {
        return inventory.filter(item => {
            if (item.status === 'deleted') return false;
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [inventory, categoryFilter, searchTerm]);

    // Add item to selection — blocked if status disallows or conflicts exist
    const handleAddItem = (item: InventoryItem) => {
        if (selectedEquipment.find(e => e.itemId === item.id)) return; // already added
        const result = conflictMap.get(item.id);
        if (result?.isStatusBlocked) return;  // hard block
        // If date conflict — still allow, but warn. Photographer may have confirmed verbally.
        onUpdate([...selectedEquipment, {
            itemId: item.id,
            name: item.name,
            serialNumber: item.serialNumber,
            qty: 1,
            rentalRate: item.dailyRentalRate,
        }]);
    };

    const handleRemoveItem = (itemId: string) => {
        onUpdate(selectedEquipment.filter(i => i.itemId !== itemId));
    };

    const handleUpdateQty = (itemId: string, delta: number) => {
        onUpdate(selectedEquipment.map(item =>
            item.itemId === itemId ? { ...item, qty: Math.max(1, item.qty + delta) } : item
        ));
    };

    // Count of selected items that have conflicts (for summary banner)
    const conflictedCount = selectedEquipment.filter(sel => {
        const r = conflictMap.get(sel.itemId);
        return r?.hasConflict;
    }).length;

    return (
        <div className="space-y-4 border border-[var(--border-light)] rounded-xl p-4 bg-[var(--surface-base)]">
            <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                <Camera size={18} className="text-orange-500" />
                Equipment &amp; Gear
            </h3>

            {/* Category tabs */}
            <div className="flex gap-2 pb-2 overflow-x-auto">
                {(['all', 'camera', 'lens', 'lighting', 'accessory'] as const).map(cat => (
                    <button
                        type="button"
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors whitespace-nowrap
                            ${categoryFilter === cat
                                ? 'bg-orange-500 text-white'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-active)]'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ── Available inventory list ────────────────────────── */}
                <div className="space-y-2 h-64 overflow-y-auto pr-2">
                    <input
                        type="text"
                        placeholder="Search gear..."
                        className="w-full bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-orange-500 outline-none placeholder-[var(--text-tertiary)]"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    {loading ? (
                        <div className="text-xs text-[var(--text-tertiary)] text-center py-4">Loading inventory...</div>
                    ) : (
                        <div className="space-y-2">
                            {filteredInventory.map(item => {
                                const conflict = conflictMap.get(item.id);
                                const isAdded = selectedEquipment.some(e => e.itemId === item.id);
                                const statusCfg = EQUIPMENT_STATUS_CONFIG[item.status];
                                const hardBlocked = isStatusBlocked(item.status);
                                const dateConflict = !hardBlocked && (conflict?.hasConflict ?? false);

                                return (
                                    <div
                                        key={item.id}
                                        className={`flex items-start justify-between p-2.5 rounded-lg border transition-colors
                                            ${isAdded
                                                ? 'border-orange-500/30 bg-orange-50 dark:bg-orange-500/5'
                                                : hardBlocked
                                                    ? 'border-red-200 bg-red-50/50 dark:border-red-500/20 dark:bg-red-500/5 opacity-75'
                                                    : dateConflict
                                                        ? 'border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5'
                                                        : 'border-[var(--border-light)] bg-[var(--surface-base)] hover:bg-[var(--surface-hover)]'}`}
                                    >
                                        <div className="flex items-start gap-2 flex-1 min-w-0">
                                            <div className="p-1.5 bg-[var(--bg-secondary)] rounded-md text-[var(--text-tertiary)] mt-0.5 shrink-0">
                                                {getIcon(item.category)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                                                    {/* Status badge */}
                                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${statusCfg.badgeClass}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {item.serialNumber ? `#${item.serialNumber}` : 'No S/N'}
                                                </p>
                                                {/* Hard block message */}
                                                {hardBlocked && (
                                                    <p className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 flex items-center gap-1">
                                                        <XCircle size={10} className="shrink-0" />
                                                        {conflict?.statusBlockReason}
                                                    </p>
                                                )}
                                                {/* Date conflict message */}
                                                {dateConflict && !hardBlocked && (
                                                    <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                                                        <AlertTriangle size={10} className="shrink-0" />
                                                        Already reserved on this date
                                                        {conflict!.conflicts[0] && ` — ${conflict!.conflicts[0].clientName}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Add button */}
                                        <button
                                            type="button"
                                            disabled={isAdded || hardBlocked}
                                            onClick={() => handleAddItem(item)}
                                            className={`p-1.5 rounded-md transition-colors ml-2 shrink-0 mt-0.5
                                                ${isAdded
                                                    ? 'text-orange-600 cursor-default'
                                                    : hardBlocked
                                                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                        : dateConflict
                                                            ? 'text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                                                            : 'text-[var(--text-tertiary)] hover:bg-[var(--accent-primary)] hover:text-white'}`}
                                            title={
                                                isAdded ? 'Already added'
                                                    : hardBlocked ? conflict?.statusBlockReason ?? 'Cannot assign'
                                                        : dateConflict ? 'Add anyway (conflict exists)'
                                                            : 'Add to booking'
                                            }
                                        >
                                            {isAdded ? 'Added' : hardBlocked ? <XCircle size={16} /> : <Plus size={16} />}
                                        </button>
                                    </div>
                                );
                            })}

                            {filteredInventory.length === 0 && (
                                <div className="text-center py-8 text-[var(--text-tertiary)] text-xs">
                                    No equipment found. Add gear in the Inventory page.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Selected equipment list ─────────────────────────── */}
                <div className="space-y-2 h-64 overflow-y-auto pl-1">
                    <p className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-2">
                        Selected ({selectedEquipment.length})
                    </p>

                    {selectedEquipment.length === 0 ? (
                        <div className="h-[calc(100%-2rem)] flex flex-col items-center justify-center text-[var(--text-tertiary)] border-2 border-dashed border-[var(--border-light)] rounded-xl">
                            <Camera size={24} className="mb-2 opacity-50" />
                            <p className="text-xs">No equipment selected</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedEquipment.map(item => {
                                const conflict = conflictMap.get(item.itemId);
                                const dateConflict = conflict?.hasConflict ?? false;

                                return (
                                    <div
                                        key={item.itemId}
                                        className={`flex items-center justify-between p-2 rounded-lg border
                                            ${dateConflict
                                                ? 'border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/5'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-light)]'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                                                {dateConflict && (
                                                    <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                                                )}
                                            </div>
                                            <p className="text-xs text-[var(--text-secondary)]">
                                                ₹{(item.rentalRate / 100).toFixed(0)} × {item.qty}
                                            </p>
                                            {dateConflict && (
                                                <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                                    Conflict: reserved for {conflict!.conflicts[0]?.clientName}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 ml-2 shrink-0">
                                            <div className="flex items-center bg-[var(--surface-base)] rounded-md border border-[var(--border-light)]">
                                                <button type="button" onClick={() => handleUpdateQty(item.itemId, -1)} className="px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs border-r border-[var(--border-light)]">-</button>
                                                <span className="px-2 text-xs text-[var(--text-primary)] w-6 text-center">{item.qty}</span>
                                                <button type="button" onClick={() => handleUpdateQty(item.itemId, 1)} className="px-2 py-1 text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] text-xs border-l border-[var(--border-light)]">+</button>
                                            </div>
                                            <button type="button" onClick={() => handleRemoveItem(item.itemId)} className="text-red-400 hover:text-red-500 p-1">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Summary banners ─────────────────────────────────────── */}
            {conflictedCount > 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 rounded-lg">
                    <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        <strong>{conflictedCount} item{conflictedCount > 1 ? 's' : ''}</strong> in your selection
                        {conflictedCount > 1 ? ' are' : ' is'} already reserved on overlapping dates.
                        You can still save — confirm with the client or remove the conflicting gear.
                    </p>
                </div>
            )}

            {conflictedCount === 0 && selectedEquipment.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 rounded-lg">
                    <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        All selected equipment is available on{' '}
                        {eventDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}.
                    </p>
                </div>
            )}
        </div>
    );
};
