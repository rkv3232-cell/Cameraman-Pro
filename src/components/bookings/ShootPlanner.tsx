/**
 * ShootPlanner.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Vertical shoot-day timeline planner embedded inside BookingDetails.
 *
 * Features:
 *   • Preset entries (Arrival, Ceremony Start, Ritual, Departure) as quick-adds
 *   • Custom label / time / notes / emoji entry form
 *   • Inline editing of any entry
 *   • Delete with a single click
 *   • Drag-to-reorder (HTML5 draggable, no extra library)
 *   • Sorted display by time (always shows in chronological order)
 *   • Persists via `onSave` prop → caller writes to Firestore
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useRef } from "react";
import { ShootTimelineEntry } from "../../types";
import {
    Clock, Plus, Trash2, Edit2, Check, X,
    GripVertical, ChevronDown, ChevronUp, Loader2,
    Camera,
} from "lucide-react";
import toast from "react-hot-toast";

// ─── Preset entries ───────────────────────────────────────────────────────────

interface Preset {
    label: string;
    icon: string;
    time: string;
    notes: string;
}

const PRESETS: Preset[] = [
    { label: "Arrival", icon: "🚗", time: "08:00", notes: "Team arrives at venue" },
    { label: "Ceremony Start", icon: "💍", time: "10:00", notes: "Main ceremony begins" },
    { label: "Ritual", icon: "🔥", time: "12:00", notes: "Traditional rituals" },
    { label: "Lunch Break", icon: "🍽️", time: "13:30", notes: "Team break / meal" },
    { label: "Group Photos", icon: "📸", time: "15:00", notes: "Family group shots" },
    { label: "Departure", icon: "🎊", time: "18:00", notes: "Wrap-up and pack-out" },
];

// ─── Colour stripe per entry based on time-of-day ─────────────────────────────

function timeColor(time: string): string {
    const h = parseInt(time.split(":")[0] ?? "12", 10);
    if (h < 7) return "bg-indigo-500";    // before dawn
    if (h < 10) return "bg-amber-400";     // morning
    if (h < 13) return "bg-orange-500";    // late morning
    if (h < 15) return "bg-yellow-500";    // early afternoon
    if (h < 18) return "bg-rose-400";      // afternoon
    if (h < 21) return "bg-purple-500";    // evening
    return "bg-blue-500";     // night
}

function timeDot(time: string): string {
    const h = parseInt(time.split(":")[0] ?? "12", 10);
    if (h < 7) return "bg-indigo-500 ring-indigo-200 dark:ring-indigo-900";
    if (h < 10) return "bg-amber-400  ring-amber-200  dark:ring-amber-900";
    if (h < 13) return "bg-orange-500 ring-orange-200 dark:ring-orange-900";
    if (h < 15) return "bg-yellow-500 ring-yellow-200 dark:ring-yellow-900";
    if (h < 18) return "bg-rose-400   ring-rose-200   dark:ring-rose-900";
    if (h < 21) return "bg-purple-500 ring-purple-200 dark:ring-purple-900";
    return "bg-blue-500  ring-blue-200   dark:ring-blue-900";
}

// ─── Duration helper ──────────────────────────────────────────────────────────

function minutesBetween(a: string, b: string): number {
    const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return (h ?? 0) * 60 + (m ?? 0);
    };
    return toMin(b) - toMin(a);
}

function formatDuration(mins: number): string {
    if (mins <= 0) return "";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

// ─── Inline edit row form ─────────────────────────────────────────────────────

interface EditFormProps {
    initial: ShootTimelineEntry;
    onSave: (e: ShootTimelineEntry) => void;
    onCancel: () => void;
}

const EditForm = ({ initial, onSave, onCancel }: EditFormProps) => {
    const [draft, setDraft] = useState(initial);
    return (
        <div className="grid grid-cols-1 sm:grid-cols-[80px_1fr_180px] gap-2 p-3 bg-[var(--bg-secondary)] rounded-xl border border-[var(--accent-primary)]/30">
            {/* Emoji */}
            <div>
                <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold block mb-1">Icon</label>
                <input
                    type="text"
                    value={draft.icon ?? ""}
                    onChange={e => setDraft(d => ({ ...d, icon: e.target.value }))}
                    maxLength={2}
                    placeholder="😊"
                    className="w-full text-center text-xl rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] p-2 focus:outline-none focus:border-[var(--accent-primary)]/50"
                />
            </div>
            {/* Label + Notes stacked */}
            <div className="space-y-2">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold block mb-1">Label *</label>
                    <input
                        type="text"
                        value={draft.label}
                        onChange={e => setDraft(d => ({ ...d, label: e.target.value }))}
                        placeholder="e.g. Bride Getting Ready"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                    />
                </div>
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold block mb-1">Notes</label>
                    <input
                        type="text"
                        value={draft.notes ?? ""}
                        onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                        placeholder="Optional detail..."
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                    />
                </div>
            </div>
            {/* Time + Buttons */}
            <div className="space-y-2">
                <div>
                    <label className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold block mb-1">Time *</label>
                    <input
                        type="time"
                        value={draft.time}
                        onChange={e => setDraft(d => ({ ...d, time: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                    />
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            if (!draft.label.trim()) { toast.error("Label is required"); return; }
                            if (!draft.time) { toast.error("Time is required"); return; }
                            onSave(draft);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-secondary)] transition-colors"
                    >
                        <Check size={13} /> Save
                    </button>
                    <button
                        onClick={onCancel}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-[var(--border-light)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                        <X size={13} /> Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface ShootPlannerProps {
    bookingId: string;
    entries: ShootTimelineEntry[];
    /** Called with the full updated array — caller persists to Firestore */
    onSave: (entries: ShootTimelineEntry[]) => Promise<void>;
}

const BLANK_ENTRY = (): Omit<ShootTimelineEntry, "id" | "order"> => ({
    time: "09:00",
    label: "",
    notes: "",
    icon: "",
});

export const ShootPlanner = ({ entries, onSave }: ShootPlannerProps) => {
    // Sort by time always for display
    const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));

    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(BLANK_ENTRY());
    const [saving, setSaving] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Drag state
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // ── Persist helpers ───────────────────────────────────────────────────────

    const persist = async (next: ShootTimelineEntry[]) => {
        setSaving(true);
        try {
            await onSave(next);
        } finally {
            setSaving(false);
        }
    };

    // ── Add entry ──────────────────────────────────────────────────────────────

    const handleAdd = async () => {
        if (!form.label.trim()) { toast.error("Label is required"); return; }
        if (!form.time) { toast.error("Time is required"); return; }

        const newEntry: ShootTimelineEntry = {
            id: Date.now().toString(),
            order: entries.length,
            ...form,
            icon: form.icon?.trim() || undefined,
        };
        await persist([...entries, newEntry]);
        setForm(BLANK_ENTRY());
        setShowForm(false);
        toast.success("Timeline entry added");
    };

    // ── Add preset ────────────────────────────────────────────────────────────

    const addPreset = async (preset: Preset) => {
        // Don't add duplicate labels
        if (entries.some(e => e.label.toLowerCase() === preset.label.toLowerCase())) {
            toast.error(`"${preset.label}" is already in the timeline`);
            return;
        }
        const newEntry: ShootTimelineEntry = {
            id: Date.now().toString(),
            order: entries.length,
            label: preset.label,
            time: preset.time,
            notes: preset.notes,
            icon: preset.icon,
        };
        await persist([...entries, newEntry]);
        toast.success(`${preset.icon} ${preset.label} added`);
    };

    // ── Save inline edit ──────────────────────────────────────────────────────

    const handleUpdate = async (updated: ShootTimelineEntry) => {
        const next = entries.map(e => e.id === updated.id ? updated : e);
        await persist(next);
        setEditingId(null);
        toast.success("Entry updated");
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const handleDelete = async (id: string) => {
        if (!confirm("Remove this timeline entry?")) return;
        const next = entries.filter(e => e.id !== id);
        await persist(next);
        toast.success("Entry removed");
    };

    // ── Drag-to-reorder ───────────────────────────────────────────────────────

    const handleDragEnd = async () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        if (dragItem.current === dragOverItem.current) return;

        const reordered = [...sorted];
        const [moved] = reordered.splice(dragItem.current, 1);
        reordered.splice(dragOverItem.current, 0, moved);

        // Re-assign order based on new position
        const next = reordered.map((e, i) => ({ ...e, order: i }));
        dragItem.current = null;
        dragOverItem.current = null;
        await persist(next);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl shadow-sm overflow-hidden">

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-light)]">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">Shoot Day Planner</h3>
                        <p className="text-[11px] text-[var(--text-tertiary)]">
                            {sorted.length === 0 ? "No entries yet" : `${sorted.length} event${sorted.length !== 1 ? "s" : ""} planned`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {saving && <Loader2 size={14} className="animate-spin text-[var(--text-tertiary)]" />}
                    <button
                        onClick={() => { setShowForm(f => !f); setCollapsed(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-secondary)] transition-colors shadow-sm"
                    >
                        <Plus size={13} /> Add Entry
                    </button>
                    <button
                        onClick={() => setCollapsed(c => !c)}
                        className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] transition-colors border border-transparent hover:border-[var(--border-light)]"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                    </button>
                </div>
            </div>

            {!collapsed && (
                <div className="p-6 space-y-5">

                    {/* ── Preset Quick-Add Chips ── */}
                    <div>
                        <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mb-2.5 flex items-center gap-1.5">
                            <Camera size={11} /> Quick Add Presets
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {PRESETS.map(preset => {
                                const already = entries.some(e => e.label.toLowerCase() === preset.label.toLowerCase());
                                return (
                                    <button
                                        key={preset.label}
                                        onClick={() => addPreset(preset)}
                                        disabled={already || saving}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all
                                            ${already
                                                ? "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-tertiary)] opacity-50 cursor-default"
                                                : "bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] active:scale-95"
                                            }`}
                                    >
                                        <span>{preset.icon}</span>
                                        {preset.label}
                                        {already && <Check size={10} className="text-emerald-500" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Add Custom Entry Form ── */}
                    {showForm && (
                        <div className="space-y-3">
                            <p className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">New Custom Entry</p>
                            <div className="grid grid-cols-1 sm:grid-cols-[72px_1fr_160px] gap-2 p-4 border border-dashed border-[var(--accent-primary)]/30 rounded-xl bg-[var(--bg-secondary)]">
                                {/* Icon */}
                                <div>
                                    <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Icon</label>
                                    <input
                                        type="text"
                                        value={form.icon ?? ""}
                                        onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                                        maxLength={2}
                                        placeholder="📷"
                                        className="w-full text-center text-xl rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] p-2 focus:outline-none focus:border-[var(--accent-primary)]/50"
                                    />
                                </div>
                                {/* Label + Notes */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Label *</label>
                                        <input
                                            type="text"
                                            value={form.label}
                                            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                            onKeyDown={e => e.key === "Enter" && handleAdd()}
                                            placeholder="e.g. Bride Getting Ready"
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Notes (optional)</label>
                                        <input
                                            type="text"
                                            value={form.notes ?? ""}
                                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                            placeholder="Brief description..."
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                                        />
                                    </div>
                                </div>
                                {/* Time + Actions */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold block mb-1">Time *</label>
                                        <input
                                            type="time"
                                            value={form.time}
                                            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleAdd}
                                            disabled={saving}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-semibold hover:bg-[var(--accent-secondary)] transition-colors disabled:opacity-60"
                                        >
                                            <Plus size={13} /> Add
                                        </button>
                                        <button
                                            onClick={() => { setShowForm(false); setForm(BLANK_ENTRY()); }}
                                            className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-[var(--border-light)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors"
                                        >
                                            <X size={13} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Empty State ── */}
                    {sorted.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 text-[var(--text-tertiary)] border border-dashed border-[var(--border-light)] rounded-xl">
                            <Clock size={32} className="opacity-25 mb-3" />
                            <p className="text-sm font-medium">No timeline entries yet</p>
                            <p className="text-xs mt-1 opacity-70">Use a preset above or add a custom entry</p>
                        </div>
                    )}

                    {/* ── Vertical Timeline ── */}
                    {sorted.length > 0 && (
                        <div className="relative">
                            {/* Vertical connector line */}
                            <div className="absolute left-[27px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-[var(--border-light)] via-[var(--border-light)] to-transparent pointer-events-none" />

                            <div className="space-y-1">
                                {sorted.map((entry, idx) => {
                                    const isEditing = editingId === entry.id;
                                    const next = sorted[idx + 1];
                                    const gap = next ? minutesBetween(entry.time, next.time) : null;
                                    const dotClass = timeDot(entry.time);

                                    return (
                                        <div key={entry.id}>
                                            {/* ── Edit form (shown in-place) ── */}
                                            {isEditing ? (
                                                <div className="ml-14">
                                                    <EditForm
                                                        initial={entry}
                                                        onSave={handleUpdate}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                /* ── Timeline row ── */
                                                <div
                                                    className="group relative flex items-start gap-4 py-2 rounded-xl hover:bg-[var(--surface-hover)] px-2 transition-colors cursor-grab active:cursor-grabbing"
                                                    draggable
                                                    onDragStart={() => { dragItem.current = idx; }}
                                                    onDragEnter={() => { dragOverItem.current = idx; }}
                                                    onDragEnd={handleDragEnd}
                                                    onDragOver={e => e.preventDefault()}
                                                >
                                                    {/* Drag handle */}
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-50 transition-opacity">
                                                        <GripVertical size={14} className="text-[var(--text-tertiary)]" />
                                                    </div>

                                                    {/* Dot */}
                                                    <div className="relative z-10 mt-2 shrink-0">
                                                        <div className={`w-5 h-5 rounded-full ${dotClass} ring-4 ring-offset-1 flex items-center justify-center shadow-sm ml-3`}>
                                                            {entry.icon
                                                                ? <span className="text-[9px] leading-none">{entry.icon}</span>
                                                                : null
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-baseline gap-2 flex-wrap">
                                                            {/* Time badge */}
                                                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg text-white shrink-0 ${timeColor(entry.time)}`}>
                                                                {entry.time}
                                                            </span>
                                                            {/* Label */}
                                                            <span className="text-sm font-semibold text-[var(--text-primary)] truncate">{entry.label}</span>
                                                        </div>
                                                        {entry.notes && (
                                                            <p className="text-xs text-[var(--text-tertiary)] mt-0.5 leading-relaxed">{entry.notes}</p>
                                                        )}
                                                    </div>

                                                    {/* Actions (hidden until hover) */}
                                                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => setEditingId(entry.id)}
                                                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={13} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(entry.id)}
                                                            className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={13} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* ── Gap indicator between entries ── */}
                                            {gap !== null && gap > 0 && !isEditing && (
                                                <div className="flex items-center gap-2 ml-14 my-1">
                                                    <div className="w-full h-px bg-[var(--border-light)]" style={{ maxWidth: "120px" }} />
                                                    <span className="text-[9px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] px-1.5 py-0.5 rounded-full font-mono whitespace-nowrap">
                                                        {formatDuration(gap)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ── Footer Summary ── */}
                    {sorted.length >= 2 && (
                        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-light)] text-xs text-[var(--text-tertiary)]">
                            <span>
                                🕐 Start: <strong className="text-[var(--text-secondary)]">{sorted[0]?.time}</strong>
                                {" · "}
                                End: <strong className="text-[var(--text-secondary)]">{sorted[sorted.length - 1]?.time}</strong>
                            </span>
                            <span>
                                Total:{" "}
                                <strong className="text-[var(--text-secondary)]">
                                    {formatDuration(minutesBetween(sorted[0]?.time ?? "00:00", sorted[sorted.length - 1]?.time ?? "00:00"))}
                                </strong>
                            </span>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
