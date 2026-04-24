import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    doc, getDoc, updateDoc, deleteDoc, Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Expense, ExpenseCategory, Booking } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/Modal";
import { formatMoney } from "../utils/currency";
import { format } from "date-fns";
import toast from "react-hot-toast";
import {
    ArrowLeft, Fuel, Users, Wrench, MoreHorizontal,
    Trash2, Edit2, Calendar, Tag, FileText,
    User, Clock, Briefcase, ExternalLink,
    AlertTriangle, CheckCircle, XCircle, Loader2,
} from "lucide-react";

// ─── Category Config (mirrors Expenses.tsx) ───────────────────────────────────

type CategoryMeta = { label: string; icon: any; color: string; bg: string };

const CATEGORY_CONFIG: Record<ExpenseCategory, CategoryMeta> = {
    fuel: { label: "Fuel", icon: Fuel, color: "text-orange-500", bg: "bg-orange-500/10" },
    assistant_payment: { label: "Assistant", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    repair_maintenance: { label: "Repair", icon: Wrench, color: "text-red-500", bg: "bg-red-500/10" },
    miscellaneous: { label: "Misc", icon: MoreHorizontal, color: "text-purple-500", bg: "bg-purple-500/10" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    confirmed: { label: "Confirmed", color: "text-emerald-600 dark:text-emerald-400", icon: CheckCircle },
    completed: { label: "Completed", color: "text-blue-600   dark:text-blue-400", icon: CheckCircle },
    cancelled: { label: "Cancelled", color: "text-red-600    dark:text-red-400", icon: XCircle },
    pending: { label: "Pending", color: "text-amber-600  dark:text-amber-400", icon: AlertTriangle },
};

// ─── Detail Row helper ────────────────────────────────────────────────────────

const Row = ({ icon: Icon, label, value, className = "" }: {
    icon: any; label: string; value: React.ReactNode; className?: string;
}) => (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--border-light)] last:border-0">
        <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--bg-secondary)] text-[var(--text-tertiary)] shrink-0">
            <Icon size={14} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)] mb-0.5">{label}</p>
            <p className={`text-sm font-medium text-[var(--text-primary)] ${className}`}>{value || "—"}</p>
        </div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export const ExpenseDetail = () => {
    const { expenseId } = useParams<{ expenseId: string }>();
    const navigate = useNavigate();

    const [expense, setExpense] = useState<Expense | null>(null);
    const [linkedBooking, setLinkedBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [notFound, setNotFound] = useState(false);

    // Edit modal state
    const [editOpen, setEditOpen] = useState(false);
    const [editSaving, setEditSaving] = useState(false);
    const [editForm, setEditForm] = useState({
        amount: "",
        category: "fuel" as ExpenseCategory,
        date: "",
        notes: "",
    });

    // Delete confirmation modal state
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // ── Fetch expense ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!expenseId) { setNotFound(true); setLoading(false); return; }

        const fetch = async () => {
            try {
                const snap = await getDoc(doc(db, "expenses", expenseId));
                if (!snap.exists()) { setNotFound(true); return; }

                const data = { id: snap.id, ...snap.data() } as Expense;
                setExpense(data);

                // Pre-fill edit form
                const d = data.date?.toDate ? data.date.toDate() : new Date(data.date as any);
                setEditForm({
                    amount: String(data.amount / 100),
                    category: data.category,
                    date: format(d, "yyyy-MM-dd"),
                    notes: data.notes ?? "",
                });

                // Fetch linked booking if present
                if (data.linkedBookingId) {
                    setBookingLoading(true);
                    const bSnap = await getDoc(doc(db, "bookings", data.linkedBookingId));
                    if (bSnap.exists()) setLinkedBooking({ id: bSnap.id, ...bSnap.data() } as Booking);
                    setBookingLoading(false);
                }
            } catch (err) {
                console.error("[ExpenseDetail] fetch error:", err);
                toast.error("Failed to load expense.");
            } finally {
                setLoading(false);
            }
        };

        fetch();
    }, [expenseId]);

    // ── Save edit ──────────────────────────────────────────────────────────────
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!expense) return;
        const amount = parseFloat(editForm.amount);
        if (!amount || amount <= 0) { toast.error("Enter a valid amount."); return; }

        setEditSaving(true);
        try {
            await updateDoc(doc(db, "expenses", expense.id), {
                amount: Math.round(amount * 100),
                category: editForm.category,
                date: Timestamp.fromDate(new Date(editForm.date)),
                notes: editForm.notes,
            });
            // Refresh local state
            setExpense(prev => prev ? {
                ...prev,
                amount: Math.round(amount * 100),
                category: editForm.category,
                date: Timestamp.fromDate(new Date(editForm.date)),
                notes: editForm.notes,
            } : prev);
            toast.success("Expense updated!");
            setEditOpen(false);
        } catch (err) {
            console.error("[ExpenseDetail] update error:", err);
            toast.error("Failed to update expense.");
        } finally {
            setEditSaving(false);
        }
    };

    // ── Delete ─────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        if (!expense) return;
        setDeleteLoading(true);
        try {
            await deleteDoc(doc(db, "expenses", expense.id));
            toast.success("Expense deleted.");
            navigate("/expenses");
        } catch (err) {
            console.error("[ExpenseDetail] delete error:", err);
            toast.error("Failed to delete expense.");
            setDeleteLoading(false);
        }
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3 text-[var(--text-tertiary)]">
                    <Loader2 size={32} className="animate-spin text-[var(--accent-primary)]" />
                    <p className="text-sm">Loading expense...</p>
                </div>
            </div>
        );
    }

    // ── Not Found ──────────────────────────────────────────────────────────────
    if (notFound || !expense) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
                <div className="p-5 rounded-full bg-red-500/10 text-red-500">
                    <AlertTriangle size={36} />
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">Expense Not Found</h2>
                <p className="text-[var(--text-secondary)] text-sm">This expense may have been deleted.</p>
                <Button variant="secondary" onClick={() => navigate("/expenses")}>
                    <ArrowLeft size={16} className="mr-2" /> Back to Expenses
                </Button>
            </div>
        );
    }

    // ── Derived values ─────────────────────────────────────────────────────────
    const cat = CATEGORY_CONFIG[expense.category];
    const Icon = cat?.icon ?? MoreHorizontal;
    const expenseDate = expense.date?.toDate ? expense.date.toDate() : new Date(expense.date as any);
    const createdAtDate = expense.createdAt?.toDate ? expense.createdAt.toDate() : null;

    const bookingDate = linkedBooking?.eventDate?.toDate
        ? linkedBooking.eventDate.toDate()
        : linkedBooking?.eventDate
            ? new Date(linkedBooking.eventDate as any)
            : null;

    const statusMeta = linkedBooking
        ? (STATUS_CONFIG[linkedBooking.status] ?? STATUS_CONFIG.pending)
        : null;

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-12">

            {/* ── Top Nav ── */}
            <div className="flex items-center gap-3">
                <Button
                    variant="secondary"
                    className="h-10 w-10 p-0 rounded-full shrink-0"
                    onClick={() => navigate("/expenses")}
                >
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">
                        Expense Detail
                    </h1>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">{expense.id}</p>
                </div>
            </div>

            {/* ── Hero Card ── */}
            <div className={`relative overflow-hidden rounded-2xl p-6 ${cat.bg} border border-white/10`}>
                {/* background gradient blob */}
                <div className={`absolute -top-8 -right-8 w-40 h-40 rounded-full opacity-20 blur-2xl ${cat.color.replace("text-", "bg-")}`} />

                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Icon */}
                    <div className={`p-4 rounded-2xl bg-white/20 ${cat.color} self-start`}>
                        <Icon size={28} />
                    </div>

                    {/* Amount + meta */}
                    <div className="flex-1">
                        <p className="text-xs uppercase tracking-widest font-bold text-[var(--text-tertiary)] mb-1">
                            {cat.label} Expense
                        </p>
                        <p className={`text-4xl font-black ${cat.color} tabular-nums`}>
                            -{formatMoney(expense.amount / 100)}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 flex items-center gap-1.5">
                            <Calendar size={12} />
                            {format(expenseDate, "EEEE, dd MMMM yyyy")}
                        </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 self-start shrink-0">
                        <button
                            onClick={() => setEditOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-[var(--text-primary)] text-xs font-semibold transition-colors border border-white/10"
                        >
                            <Edit2 size={13} /> Edit
                        </button>
                        <button
                            onClick={() => setDeleteOpen(true)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-500 dark:text-red-400 text-xs font-semibold transition-colors border border-red-500/20"
                        >
                            <Trash2 size={13} /> Delete
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Expense Details ── */}
            <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[var(--text-primary)] mb-1 flex items-center gap-2">
                    <FileText size={16} className="text-[var(--accent-primary)]" />
                    Expense Details
                </h2>
                <div className="mt-3">
                    <Row icon={Tag} label="Category" value={cat.label} />
                    <Row icon={Calendar} label="Date" value={format(expenseDate, "dd MMM yyyy")} />
                    <Row
                        icon={Tag}
                        label="Amount"
                        value={`₹ ${(expense.amount / 100).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
                        className="text-red-600 dark:text-red-400 font-bold"
                    />
                    <Row
                        icon={FileText}
                        label="Notes"
                        value={expense.notes ? expense.notes : <span className="text-[var(--text-tertiary)]">No notes</span>}
                    />
                    <Row icon={User} label="Created By" value={expense.createdByName || "Unknown"} />
                    <Row
                        icon={Clock}
                        label="Created At"
                        value={createdAtDate ? format(createdAtDate, "dd MMM yyyy, hh:mm a") : "—"}
                    />
                </div>
            </section>

            {/* ── Linked Booking ── */}
            <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-5 shadow-sm">
                <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <Briefcase size={16} className="text-indigo-500" />
                    Linked Booking
                </h2>

                {bookingLoading ? (
                    <div className="flex items-center gap-2 py-4 text-[var(--text-tertiary)]">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">Loading booking...</span>
                    </div>
                ) : linkedBooking ? (
                    <div className="space-y-3">
                        {/* Booking card */}
                        <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] flex flex-col sm:flex-row sm:items-center gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-bold text-[var(--text-primary)] text-sm">{linkedBooking.clientName}</p>
                                    {statusMeta && (
                                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-current/10 ${statusMeta.color}`} style={{ background: "transparent" }}>
                                            <statusMeta.icon size={10} />
                                            {statusMeta.label}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 capitalize">{linkedBooking.eventType}</p>
                                {bookingDate && (
                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5 flex items-center gap-1">
                                        <Calendar size={10} />
                                        {format(bookingDate, "dd MMM yyyy")}
                                    </p>
                                )}
                            </div>
                            <Button
                                variant="secondary"
                                className="text-xs h-8 px-3 shrink-0"
                                onClick={() => navigate(`/bookings/${linkedBooking.id}`)}
                            >
                                <ExternalLink size={12} className="mr-1.5" /> Open Booking
                            </Button>
                        </div>
                    </div>
                ) : expense.linkedBookingId ? (
                    <p className="text-sm text-[var(--text-tertiary)] py-2">
                        Booking <span className="font-mono text-xs">{expense.linkedBookingId}</span> not found — it may have been deleted.
                    </p>
                ) : (
                    <div className="py-4 text-center border border-dashed border-[var(--border-light)] rounded-xl">
                        <p className="text-sm text-[var(--text-tertiary)]">No booking linked to this expense.</p>
                    </div>
                )}
            </section>

            {/* ────────────────────────────────────────────────────────────────
                EDIT MODAL
            ──────────────────────────────────────────────────────────────── */}
            <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Expense">
                <form onSubmit={handleSave} className="space-y-4">
                    <Input
                        label="Amount (₹) *"
                        type="number"
                        min="1"
                        step="0.01"
                        value={editForm.amount}
                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))}
                        placeholder="e.g. 500"
                    />

                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Category *</label>
                        <select
                            className="w-full h-10 rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-all"
                            value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value as ExpenseCategory }))}
                        >
                            <option value="fuel">⛽ Fuel</option>
                            <option value="assistant_payment">👷 Assistant Payment</option>
                            <option value="repair_maintenance">🔧 Repair &amp; Maintenance</option>
                            <option value="miscellaneous">📦 Miscellaneous</option>
                        </select>
                    </div>

                    <Input
                        label="Date *"
                        type="date"
                        value={editForm.date}
                        onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                    />

                    <Input
                        label="Notes"
                        value={editForm.notes}
                        onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder="e.g. Petrol for wedding shoot"
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={editSaving}>
                            {editSaving ? (
                                <><Loader2 size={14} className="mr-2 animate-spin" /> Saving...</>
                            ) : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* ────────────────────────────────────────────────────────────────
                DELETE CONFIRMATION MODAL
            ──────────────────────────────────────────────────────────────── */}
            <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Expense">
                <div className="space-y-4">
                    <div className="flex gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                        <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold text-red-700 dark:text-red-300 text-sm">
                                This action cannot be undone.
                            </p>
                            <p className="text-red-600 dark:text-red-400 text-xs mt-0.5">
                                Deleting this expense will remove it permanently from your records.
                            </p>
                        </div>
                    </div>

                    {/* Preview of what's being deleted */}
                    <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${cat.bg} ${cat.color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="font-semibold text-[var(--text-primary)] text-sm">{cat.label}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                {formatMoney(expense.amount / 100)} · {format(expenseDate, "dd MMM yyyy")}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            onClick={handleDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? (
                                <><Loader2 size={14} className="mr-2 animate-spin" /> Deleting...</>
                            ) : (
                                <><Trash2 size={14} className="mr-2" /> Yes, Delete</>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
