import { useMemo, useState } from "react";
import { useInventory } from "../../hooks/useInventory";
import { useBookings } from "../../hooks/useBookings";
import { BookedEquipmentItem, EquipmentCategory, InventoryItem } from "../../types";
import { Camera, Zap, Disc, AlertTriangle, XCircle, Search, Hexagon, Maximize, Plus, Check } from "lucide-react";
import {
    batchCheckConflicts,
    EQUIPMENT_STATUS_CONFIG,
    isStatusBlocked,
} from "../../lib/equipmentConflict";
import { motion, AnimatePresence } from "framer-motion";

interface EquipmentSelectorProps {
    selectedEquipment: BookedEquipmentItem[];
    onUpdate: (items: BookedEquipmentItem[]) => void;
    eventDate: Date;
    rangeStart?: Date;
    rangeEnd?: Date;
    editingBookingId?: string;
}

const getIcon = (cat: string) => {
    switch (cat) {
        case 'camera': return <Camera size={24} className="text-slate-500" />;
        case 'lighting': return <Zap size={24} className="text-slate-500" />;
        case 'lens': return <Disc size={24} className="text-slate-500" />;
        case 'drone': return <Hexagon size={24} className="text-slate-500" />;
        case 'accessory': return <Maximize size={24} className="text-slate-500" />;
        default: return <Camera size={24} className="text-slate-500" />;
    }
};

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

    const targetRange = useMemo(() => {
        const start = new Date(rangeStart ?? eventDate); start.setHours(0, 0, 0, 0);
        const end = new Date(rangeEnd ?? eventDate); end.setHours(23, 59, 59, 999);
        return { start, end };
    }, [rangeStart, rangeEnd, eventDate]);

    const conflictMap = useMemo(
        () => batchCheckConflicts(inventory, targetRange, bookings, editingBookingId),
        [inventory, targetRange, bookings, editingBookingId]
    );

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

    const handleAddItem = (item: InventoryItem) => {
        if (selectedEquipment.find(e => e.itemId === item.id)) {
            handleRemoveItem(item.id);
            return;
        }
        const result = conflictMap.get(item.id);
        if (result?.isStatusBlocked) return;
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

    const categories: (EquipmentCategory | 'all')[] = ['all', 'camera', 'lens', 'lighting', 'drone', 'accessory'];

    return (
        <div className="space-y-6">
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[var(--bg-secondary)] p-2 rounded-2xl border border-[var(--border-light)]">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto p-1 custom-scrollbar">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => setCategoryFilter(cat)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all whitespace-nowrap
                                ${categoryFilter === cat
                                    ? 'bg-purple-600 text-white shadow-md'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <div className="relative w-full md:w-72 px-1 pb-1 md:pb-0 md:px-0">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />
                    <input
                        type="text"
                        placeholder="Search gear..."
                        className="w-full bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl pl-11 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Gear Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-h-[450px] overflow-y-auto p-1 custom-scrollbar">
                {loading ? (
                    <div className="col-span-full py-12 flex justify-center text-purple-500 font-medium">Loading gear...</div>
                ) : filteredInventory.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-[var(--text-tertiary)] text-sm">No equipment found matching criteria.</div>
                ) : (
                    <AnimatePresence>
                        {filteredInventory.map(item => {
                            const conflict = conflictMap.get(item.id);
                            const isSelected = selectedEquipment.some(e => e.itemId === item.id);
                            const statusCfg = EQUIPMENT_STATUS_CONFIG[item.status];
                            const hardBlocked = isStatusBlocked(item.status);
                            const dateConflict = !hardBlocked && (conflict?.hasConflict ?? false);

                            return (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    key={item.id}
                                    onClick={() => !hardBlocked && handleAddItem(item)}
                                    className={`relative flex flex-col p-5 rounded-2xl border cursor-pointer transition-all duration-200 group
                                        ${isSelected 
                                            ? 'bg-purple-50 dark:bg-purple-500/5 border-purple-300 dark:border-purple-500/30 shadow-sm ring-1 ring-purple-500/20' 
                                            : hardBlocked 
                                                ? 'bg-[var(--bg-secondary)] border-[var(--border-light)] opacity-50 cursor-not-allowed'
                                                : dateConflict
                                                    ? 'bg-amber-50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20'
                                                    : 'bg-[var(--surface-base)] border-[var(--border-light)] hover:shadow-md hover:border-purple-200 dark:hover:border-purple-500/30'
                                        }
                                    `}
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
                                            ${isSelected ? 'bg-purple-100 dark:bg-purple-500/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                            {getIcon(item.category)}
                                        </div>
                                        <div className="flex-1 min-w-0 pt-1">
                                            <h4 className={`text-base font-bold truncate ${isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-[var(--text-primary)]'}`}>
                                                {item.name}
                                            </h4>
                                            <p className="text-sm text-[var(--text-secondary)] truncate font-medium">
                                                {item.serialNumber ? `#${item.serialNumber}` : 'No S/N'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto flex flex-col gap-3">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${statusCfg.badgeClass}`}>
                                                {statusCfg.label}
                                            </span>
                                            <span className="text-sm font-bold text-[var(--text-primary)]">
                                                ₹{(item.dailyRentalRate / 100).toFixed(0)}<span className="text-[var(--text-tertiary)] font-medium">/d</span>
                                            </span>
                                        </div>

                                        {hardBlocked && (
                                            <div className="text-xs text-red-500 mt-1 flex items-start gap-1.5 bg-red-50 dark:bg-red-500/10 p-2 rounded-lg">
                                                <XCircle size={14} className="shrink-0 mt-0.5" />
                                                <span className="font-medium leading-tight">{conflict?.statusBlockReason}</span>
                                            </div>
                                        )}
                                        {dateConflict && !hardBlocked && (
                                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-500/10 p-2 rounded-lg">
                                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                                <span className="font-medium leading-tight">Reserved {conflict!.conflicts[0] && `for ${conflict!.conflicts[0].clientName}`}</span>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            disabled={hardBlocked}
                                            className={`w-full mt-2 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all
                                                ${isSelected
                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/20 dark:hover:text-red-400'
                                                    : hardBlocked
                                                        ? 'bg-[var(--bg-secondary)] text-[var(--text-tertiary)]'
                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                }
                                            `}
                                        >
                                            {isSelected ? (
                                                <>
                                                    <Check size={18} className="group-hover:hidden" />
                                                    <span className="group-hover:hidden">Added</span>
                                                    <XCircle size={18} className="hidden group-hover:block" />
                                                    <span className="hidden group-hover:block">Remove</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Plus size={18} /> Add Gear
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};
