
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Booking, PaymentMethod, TeamAssignment } from "../types";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import {
    ArrowLeft, Calendar, Phone,
    CheckCircle, AlertCircle, Edit2, MessageCircle,
    Camera, DollarSign, Plus, CreditCard, MapPin, Bell, FileDown
} from "lucide-react";
import { formatMoney } from "../utils/currency";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Modal } from "../components/ui/Modal";
import { BookingModal } from "../components/bookings/BookingModal";
import { TeamAssignmentPanel } from "../components/bookings/TeamAssignmentPanel";
import { WorkflowChecklist } from "../components/bookings/WorkflowChecklist";
import { useTeam } from "../hooks/useTeam";
import { toggleTask } from "../lib/workflowEngine";
import { WorkflowTaskKey } from "../lib/workflowEngine";
import {
    sendWhatsAppMessage,
    getBookingConfirmationMessage,
    getPaymentReminderMessage
} from "../utils/whatsapp";
import { downloadInvoicePDF } from "../lib/invoiceGenerator";
import { ClientPortalManager } from "../components/bookings/ClientPortalManager";
import { ContractUpload, ContractFile } from "../components/bookings/ContractUpload";
import { EventCountdown } from "../components/bookings/EventCountdown";
import { ShootPlanner } from "../components/bookings/ShootPlanner";
import { ShootTimelineEntry } from "../types";
import { useAuth } from "../hooks/useAuth";

// ─── Payment Form State ───────────────────────────────────────────────────────
interface PaymentFormState {
    amount: string;
    method: PaymentMethod;
    referenceId: string;
    date: string;
}

const EMPTY_PAYMENT_FORM: PaymentFormState = {
    amount: '',
    method: 'cash',
    referenceId: '',
    date: new Date().toISOString().split('T')[0],
};

// ─── Method style helpers ─────────────────────────────────────────────────────
const METHOD_LABELS: Record<PaymentMethod, { label: string; color: string }> = {
    cash: { label: 'Cash', color: 'text-emerald-600 dark:text-emerald-400' },
    upi: { label: 'UPI', color: 'text-purple-600 dark:text-purple-400' },
    bank_transfer: { label: 'Bank', color: 'text-blue-600 dark:text-blue-400' },
    cheque: { label: 'Cheque', color: 'text-orange-600 dark:text-orange-400' },
};

// ─── Component ────────────────────────────────────────────────────────────────
export const BookingDetails = () => {
    const { bookingId } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [paymentForm, setPaymentForm] = useState<PaymentFormState>(EMPTY_PAYMENT_FORM);
    const [paymentSaving, setPaymentSaving] = useState(false);
    const [savingTeam, setSavingTeam] = useState(false);

    // Team members + studio id for uploads
    const { members } = useTeam();
    const { studioId } = useAuth();

    // FETCH BOOKING
    useEffect(() => {
        if (!bookingId) return;

        const unsubscribe = onSnapshot(doc(db, "bookings", bookingId), (doc) => {
            if (doc.exists()) {
                setBooking({ id: doc.id, ...doc.data() } as Booking);
            } else {
                toast.error("Booking not found");
                navigate("/bookings");
            }
            setLoading(false);
        }, (error) => {
            console.error(error);
            toast.error("Error fetching booking details");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [bookingId, navigate]);

    // ── Status update ──────────────────────────────────────────────────────────
    const updateStatus = async (status: Booking['status']) => {
        if (!booking) return;
        try {
            await updateDoc(doc(db, "bookings", booking.id), { status });
            toast.success(`Booking marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    // ── Post-production checklist (engine-based) ─────────────────────────────
    const updatePostProduction = async (key: WorkflowTaskKey) => {
        if (!booking) return;
        const updated = toggleTask(booking.postProductionStatus, key);
        try {
            // Build a flat dot-notation update — Firestore rejects `undefined` values
            // so we use deleteField() to explicitly clear optional fields instead.
            const { deleteField } = await import('firebase/firestore');

            type UpdatePayload = Record<string, any>;
            const payload: UpdatePayload = {
                'postProductionStatus.dataBackup': updated.dataBackup,
                'postProductionStatus.photoEditing': updated.photoEditing,
                'postProductionStatus.videoMixing': updated.videoMixing,
                'postProductionStatus.albumSent': updated.albumSent,
                'postProductionStatus.progress': updated.progress,
                // Stamp who completed each task (clearable)
                'postProductionStatus.dataBackupBy': (updated as any).dataBackupBy ?? deleteField(),
                'postProductionStatus.photoEditingBy': (updated as any).photoEditingBy ?? deleteField(),
                'postProductionStatus.videoMixingBy': (updated as any).videoMixingBy ?? deleteField(),
                'postProductionStatus.albumSentBy': (updated as any).albumSentBy ?? deleteField(),
                // Stamp completedAt (clearable when albumSent is unticked)
                'postProductionStatus.completedAt':
                    updated.completedAt !== undefined ? updated.completedAt : deleteField(),
            };

            await updateDoc(doc(db, 'bookings', booking.id), payload);

            // ── Status auto-transition based on albumSent (Album / Final Delivery) ──
            // albumSent = true  → booking is fully delivered → status: 'completed'
            // albumSent = false → delivery was un-ticked    → revert to 'confirmed'
            if (key === 'albumSent') {
                if (updated.albumSent && booking.status === 'confirmed') {
                    await updateDoc(doc(db, 'bookings', booking.id), { status: 'completed' });
                    toast.success('🎉 Album Delivered! Booking marked as Completed.');
                } else if (!updated.albumSent && booking.status === 'completed') {
                    await updateDoc(doc(db, 'bookings', booking.id), { status: 'confirmed' });
                    toast.success('↩️ Delivery un-ticked. Booking reverted to Confirmed.');
                } else {
                    toast.success('✅ Workflow updated');
                }
            } else {
                toast.success('✅ Workflow updated');
            }
        } catch (error) {
            console.error('Workflow update failed:', error);
            toast.error('Failed to update workflow');
        }
    };

    // ── Save team assignment ──────────────────────────────────────────────────
    const handleSaveTeam = async (assignment: TeamAssignment) => {
        if (!booking) return;
        setSavingTeam(true);
        try {
            await updateDoc(doc(db, "bookings", booking.id), { teamAssignment: assignment });
            toast.success('Team assignment saved');
        } catch {
            toast.error('Failed to save team');
        } finally {
            setSavingTeam(false);
        }
    };

    // ── Record payment ─────────────────────────────────────────────────────────
    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!booking) return;

        const amount = parseFloat(paymentForm.amount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setPaymentSaving(true);
        try {
            const newPayment = {
                id: Date.now().toString(),
                amount: Math.round(amount * 100),  // store in paise
                method: paymentForm.method,
                date: new Date(paymentForm.date) as any,
                ...(paymentForm.referenceId.trim() ? { referenceId: paymentForm.referenceId.trim() } : {}),
            };

            const newTotalPaid = (booking.financials.advancePaid || 0) + newPayment.amount;
            const newBalance = booking.financials.totalAmount - newTotalPaid;

            await updateDoc(doc(db, "bookings", booking.id), {
                "financials.advancePaid": newTotalPaid,
                "financials.balanceDue": newBalance,
                "financials.paymentHistory": arrayUnion(newPayment),
            });

            toast.success("Payment recorded successfully");
            setIsPaymentModalOpen(false);
            setPaymentForm(EMPTY_PAYMENT_FORM);
        } catch (error) {
            console.error(error);
            toast.error("Failed to record payment");
        } finally {
            setPaymentSaving(false);
        }
    };

    // ── Send WhatsApp due reminder ─────────────────────────────────────────────
    const handleSendReminder = () => {
        if (!booking) return;
        const balance = booking.financials.totalAmount - booking.financials.advancePaid;
        if (balance <= 0) {
            toast("No balance due for this booking", { icon: "ℹ️" });
            return;
        }
        const message = getPaymentReminderMessage(
            booking.clientName,
            formatMoney(balance / 100)
        );
        sendWhatsAppMessage(booking.clientPhone, message);
    };

    // ── Invoice PDF download ─────────────────────────────────────
    const handleDownloadInvoice = () => {
        if (!booking) return;
        downloadInvoicePDF(booking, "Cameraman Pro");
        toast.success("Invoice PDF downloaded!");
    };

    // ── Save contract list to Firestore ──────────────────────────
    const handleContractChange = async (files: ContractFile[]) => {
        if (!booking) return;
        await updateDoc(doc(db, "bookings", booking.id), { contracts: files });
    };

    // ── Save shoot timeline to Firestore ──────────────────────────
    const handleSaveTimeline = async (entries: ShootTimelineEntry[]) => {
        if (!booking) return;
        await updateDoc(doc(db, "bookings", booking.id), { shootTimeline: entries });
    };

    // ── Guards ─────────────────────────────────────────────────────────────────
    if (loading) return <div className="p-8 text-center text-slate-400">Loading details...</div>;
    if (!booking) return null;

    // Derived State
    const eventDate = booking.eventDate?.toDate ? booking.eventDate.toDate() : new Date();
    const balance = booking.financials.totalAmount - booking.financials.advancePaid;
    // Paid percentage for progress bar
    const paidPct = booking.financials.totalAmount > 0
        ? Math.min(100, Math.round((booking.financials.advancePaid / booking.financials.totalAmount) * 100))
        : 0;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">

            {/* ── 1. TOP HEADER & ACTIONS ────────────────────────────────── */}
            <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="secondary" onClick={() => navigate("/bookings")} className="h-10 w-10 p-0 rounded-full">
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{booking.clientName}</h1>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border
                                ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                    booking.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                                        booking.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                            'bg-amber-50 text-amber-800 border-amber-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'}`}>
                                {booking.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm mt-1">
                            <span className="flex items-center gap-1"><Phone size={14} /> {booking.clientPhone}</span>
                            <span className="flex items-center gap-1"><Calendar size={14} /> {format(eventDate, "dd MMM yyyy")}</span>
                            <EventCountdown
                                eventDate={booking.eventDate}
                                subEventDate={booking.subEvents?.[0]?.date ?? null}
                                status={booking.status}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {/* WhatsApp confirmation */}
                    <Button variant="secondary" onClick={() => {
                        const msgEvents = (booking.subEvents && booking.subEvents.length > 0)
                            ? booking.subEvents
                            : [{ title: booking.eventType || 'Event', date: format(eventDate, 'yyyy-MM-dd'), time: format(eventDate, 'HH:mm') }];
                        sendWhatsAppMessage(
                            booking.clientPhone,
                            getBookingConfirmationMessage(
                                booking.clientName,
                                msgEvents,
                                formatMoney(booking.financials.totalAmount / 100),
                                formatMoney(booking.financials.advancePaid / 100),
                                formatMoney(balance / 100)
                            )
                        );
                    }}>
                        <MessageCircle size={16} className="mr-2 text-green-500" /> WhatsApp
                    </Button>

                    <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
                        <Edit2 size={16} className="mr-2" /> Edit
                    </Button>

                    {booking.status !== 'confirmed' && (
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => updateStatus('confirmed')}>
                            <CheckCircle size={16} className="mr-2" /> Confirm
                        </Button>
                    )}
                    {booking.status !== 'cancelled' && (
                        <Button variant="danger" onClick={() => { if (confirm('Cancel booking?')) updateStatus('cancelled'); }}>
                            <AlertCircle size={16} className="mr-2" /> Cancel
                        </Button>
                    )}
                    {/* Invoice PDF Download */}
                    <Button variant="secondary" onClick={handleDownloadInvoice}>
                        <FileDown size={16} className="mr-2" /> Invoice
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ── LEFT COLUMN ────────────────────────────────────────── */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 2. SUMMARY CARD */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 bg-gradient-to-bl from-[var(--bg-secondary)] to-transparent rounded-bl-2xl">
                            <span className="text-xs font-mono text-[var(--text-tertiary)] uppercase">ID: {booking.id.slice(0, 8)}</span>
                        </div>

                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Edit2 size={20} className="text-blue-500" /> Booking Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                            <div>
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Event Type</label>
                                <p className="text-lg font-medium text-[var(--text-primary)] capitalize mt-1">{booking.eventType}</p>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Venue</label>
                                <p className="text-lg font-medium text-[var(--text-primary)] mt-1 flex items-start gap-2">
                                    <MapPin size={18} className="text-orange-500 mt-1 shrink-0" />
                                    {booking.venue || "No venue specified"}
                                </p>
                            </div>

                            {/* Sub-events timeline */}
                            {booking.subEvents && booking.subEvents.length > 0 && (
                                <div className="md:col-span-2 space-y-3 mt-2">
                                    <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Event Timeline</label>
                                    <div className="space-y-2">
                                        {booking.subEvents.map((event, idx) => (
                                            <div key={idx} className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-light)]">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-[var(--text-primary)]">{event.title}</p>
                                                    <p className="text-xs text-[var(--text-secondary)]">{format(new Date(event.date), 'dd MMM yyyy')} • {event.time}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2">
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Notes</label>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 bg-[var(--bg-secondary)] p-3 rounded-lg border border-[var(--border-light)]">
                                    {booking.notes || "No additional notes."}
                                </p>
                            </div>

                            <div className="md:col-span-2 border-t border-[var(--border-light)] pt-4 flex justify-between items-center text-xs text-[var(--text-tertiary)]">
                                <span>Booked by: {booking.createdByName || "Unknown"}</span>
                                <span>Created: {booking.createdAt ? format(booking.createdAt.toDate(), 'dd MMM, HH:mm') : '-'}</span>
                            </div>
                        </div>
                    </section>

                    {/* 3. EQUIPMENT SECTION */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                                <Camera size={20} className="text-purple-500" /> Equipment Assigned
                            </h3>
                            <Button variant="secondary" className="px-2 py-1 h-8 text-xs" onClick={() => setIsEditModalOpen(true)}>
                                <Plus size={14} className="mr-1" /> Assign Gear
                            </Button>
                        </div>

                        {booking.equipmentBooked && booking.equipmentBooked.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {booking.equipmentBooked.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-light)]">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[var(--surface-base)] rounded-md text-[var(--text-secondary)] border border-[var(--border-light)]">
                                                <Camera size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">{item.name}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">{item.serialNumber || 'No S/N'}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-500 dark:border-emerald-500/20 text-[10px] rounded uppercase font-bold tracking-wider">
                                            Reserved
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 border border-dashed border-[var(--border-light)] rounded-xl">
                                <p className="text-[var(--text-tertiary)] text-sm">No equipment assigned yet.</p>
                            </div>
                        )}
                    </section>

                    {/* ── SHOOT DAY PLANNER ─────────────────────────────── */}
                    <ShootPlanner
                        bookingId={booking.id}
                        entries={booking.shootTimeline ?? []}
                        onSave={handleSaveTimeline}
                    />

                </div>

                {/* ── RIGHT COLUMN ───────────────────────────────────────── */}
                <div className="space-y-6">

                    {/* ── WORKFLOW CHECKLIST (modular) ── */}
                    <WorkflowChecklist
                        postProductionStatus={booking.postProductionStatus}
                        teamAssignment={booking.teamAssignment}
                        onToggle={updatePostProduction}
                    />

                    {/* ── TEAM ASSIGNMENT (modular) ── */}
                    <TeamAssignmentPanel
                        assignment={booking.teamAssignment}
                        members={members}
                        onUpdate={handleSaveTeam}
                        saving={savingTeam}
                    />

                    {/* ── CONTRACT UPLOAD ── */}
                    <ContractUpload
                        bookingId={booking.id}
                        studioId={studioId ?? "default"}
                        contracts={(booking.contracts ?? []) as ContractFile[]}
                        onChange={handleContractChange}
                    />

                    {/* ── 5. PAYMENT PANEL ────────────────────────────────── */}
                    <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-5 flex items-center gap-2">
                            <DollarSign size={20} className="text-emerald-500" /> Payment Status
                        </h3>

                        <div className="space-y-3">
                            {/* Total / Paid row */}
                            <div className="flex justify-between items-end p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-light)]">
                                <div>
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Total Amount</p>
                                    <p className="text-xl font-bold text-[var(--text-primary)]">{formatMoney(booking.financials.totalAmount / 100)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Paid</p>
                                    <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{formatMoney(booking.financials.advancePaid / 100)}</p>
                                </div>
                            </div>

                            {/* Payment progress bar */}
                            <div className="px-1">
                                <div className="flex justify-between text-[10px] text-[var(--text-tertiary)] mb-1">
                                    <span>Payment Progress</span>
                                    <span>{paidPct}%</span>
                                </div>
                                <div className="w-full bg-[var(--bg-secondary)] rounded-full h-1.5 border border-[var(--border-light)]">
                                    <div
                                        className="h-1.5 rounded-full transition-all duration-500 ease-out bg-emerald-500"
                                        style={{ width: `${paidPct}%` }}
                                    />
                                </div>
                            </div>

                            {/* Balance due */}
                            <div className={`p-4 rounded-xl border flex justify-between items-center
                                ${balance > 0
                                    ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                                    : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'}`}>
                                <span className={`text-sm font-medium ${balance > 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                                    {balance > 0 ? 'Balance Due' : 'Fully Paid ✓'}
                                </span>
                                <span className={`text-xl font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    {formatMoney(Math.abs(balance) / 100)}
                                </span>
                            </div>

                            {/* Action buttons */}
                            <Button className="w-full" onClick={() => setIsPaymentModalOpen(true)}>
                                <Plus size={16} className="mr-2" /> Record Payment
                            </Button>

                            {/* Send Reminder — only show when balance is due */}
                            {balance > 0 && (
                                <Button
                                    variant="secondary"
                                    className="w-full border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-500/10"
                                    onClick={handleSendReminder}
                                >
                                    <Bell size={16} className="mr-2" />
                                    Send Reminder (WhatsApp)
                                </Button>
                            )}
                        </div>

                        {/* Payment History */}
                        {booking.financials.paymentHistory && booking.financials.paymentHistory.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-[var(--border-light)]">
                                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">Transaction History</h4>
                                <div className="space-y-2">
                                    {[...booking.financials.paymentHistory].reverse().map((tx, idx) => {
                                        const txDate = tx.date
                                            ? ((tx.date as any).toDate
                                                ? (tx.date as any).toDate()
                                                : new Date(tx.date as any))
                                            : null;
                                        const methodConfig = METHOD_LABELS[tx.method] ?? { label: tx.method, color: 'text-[var(--text-secondary)]' };

                                        return (
                                            <div key={tx.id ?? idx} className="flex justify-between items-center text-sm p-2.5 hover:bg-[var(--surface-hover)] rounded-lg transition-colors border border-transparent hover:border-[var(--border-light)]">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="p-1.5 bg-[var(--bg-secondary)] rounded-lg text-[var(--text-tertiary)] border border-[var(--border-light)]">
                                                        <CreditCard size={12} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-semibold text-sm ${methodConfig.color}`}>{methodConfig.label}</span>
                                                        <span className="text-[10px] text-[var(--text-tertiary)]">
                                                            {txDate ? format(txDate, 'dd MMM yyyy') : '—'}
                                                            {tx.referenceId && (
                                                                <span className="ml-1.5 px-1.5 py-0.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded text-[10px]">
                                                                    Ref: {tx.referenceId}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                                                    +{formatMoney(tx.amount / 100)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* 4. CLIENT PORTAL & FILES */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                <ClientPortalManager booking={booking} />
            </div>

            {/* ── Edit Booking Modal ─────────────────────────────────────── */}
            <BookingModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                booking={booking}
                onSave={async (data) => {
                    await updateDoc(doc(db, "bookings", booking.id), data);
                    setIsEditModalOpen(false);
                    toast.success("Booking updated!");
                }}
            />

            {/* ── Record Payment Modal ───────────────────────────────────── */}
            <Modal isOpen={isPaymentModalOpen} onClose={() => { setIsPaymentModalOpen(false); setPaymentForm(EMPTY_PAYMENT_FORM); }} title="Record Payment">
                <form onSubmit={handleAddPayment} className="space-y-4">
                    {/* Balance hint */}
                    <div className={`p-3 rounded-lg text-sm flex justify-between items-center
                        ${balance > 0
                            ? 'bg-red-50 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20'
                            : 'bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20'}`}>
                        <span className="text-[var(--text-secondary)]">Outstanding Balance</span>
                        <span className={`font-bold ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatMoney(balance / 100)}
                        </span>
                    </div>

                    {/* Amount */}
                    <Input
                        label="Amount (₹) *"
                        type="number"
                        min="1"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="e.g. 5000"
                    />

                    {/* Payment method */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">Payment Method *</label>
                        <div className="grid grid-cols-4 gap-2">
                            {(['cash', 'upi', 'bank_transfer', 'cheque'] as PaymentMethod[]).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setPaymentForm({ ...paymentForm, method: m })}
                                    className={`py-2 px-1 text-xs font-medium rounded-lg border transition-all capitalize
                                        ${paymentForm.method === m
                                            ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]'
                                            : 'bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)]/40'}`}
                                >
                                    {METHOD_LABELS[m].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <Input
                        label="Payment Date *"
                        type="date"
                        value={paymentForm.date}
                        onChange={e => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    />

                    {/* Reference ID (optional) */}
                    <Input
                        label="Reference / Transaction ID (optional)"
                        value={paymentForm.referenceId}
                        onChange={e => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                        placeholder="e.g. UPI Ref No., Cheque No."
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="secondary" onClick={() => { setIsPaymentModalOpen(false); setPaymentForm(EMPTY_PAYMENT_FORM); }}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={paymentSaving}>
                            {paymentSaving ? 'Saving...' : 'Record Payment'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
