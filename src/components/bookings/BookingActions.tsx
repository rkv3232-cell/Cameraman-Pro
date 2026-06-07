import { useState } from "react";
import { Booking } from "../../types";
import { WhatsAppButton, getBookingConfirmationMessage, getPaymentReminderMessage, getFollowUpMessage } from "../../utils/whatsapp";
import { Phone, MoreVertical, Edit2, Trash2, CheckCircle2 } from "lucide-react";
import { safeFormat } from "../../utils/date";
import { formatMoney } from "../../utils/currency";

interface BookingActionsProps {
    booking: Booking;
    onEdit: (booking: Booking) => void;
    onDelete: (booking: Booking) => void;
    onMarkCompleted?: (bookingId: string) => void;
}

export const BookingActions = ({ booking, onEdit, onDelete, onMarkCompleted }: BookingActionsProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const isUpcoming = !booking.shootStatus || booking.shootStatus === 'upcoming';

    const toggleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    // Messages
    const totalAmount = formatMoney(booking.financials.totalAmount / 100);
    const dueAmount = formatMoney(booking.financials.balanceDue / 100);
    const advanceAmount = formatMoney(booking.financials.advancePaid / 100);
    const balanceAmount = formatMoney(booking.financials.balanceDue / 100);

    // Build events array for WhatsApp message - fallback to single event if no subEvents
    const messageEvents = (booking.subEvents && booking.subEvents.length > 0)
        ? booking.subEvents
        : [{ title: booking.eventType || 'Event', date: safeFormat(booking.eventDate, 'yyyy-MM-dd'), time: safeFormat(booking.eventDate, 'HH:mm') }];

    const confirmMsg = getBookingConfirmationMessage(
        booking.clientName,
        messageEvents,
        totalAmount,
        advanceAmount,
        balanceAmount
    );
    const reminderMsg = getPaymentReminderMessage(booking.clientName, dueAmount);
    const followUpMsg = getFollowUpMessage(booking.clientName);

    // Call Action
    const handleCall = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`tel:+91${booking.clientPhone}`, '_self');
    };

    return (
        <div className="relative flex items-center gap-1 justify-end">
            {/* Quick Actions - Visible on larger screens */}
            <div className="hidden md:flex items-center gap-1">
                <button
                    onClick={handleCall}
                    className="p-2 text-[var(--text-tertiary)] hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Call Client"
                >
                    <Phone size={16} />
                </button>

                <WhatsAppButton
                    phone={booking.clientPhone}
                    message={confirmMsg}
                    label=""
                    className="p-2 text-[var(--text-tertiary)] hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                />

                {isUpcoming && onMarkCompleted && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onMarkCompleted(booking.id); }}
                        className="p-2 text-[var(--text-tertiary)] hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 rounded-lg transition-colors"
                        title="Mark as Completed"
                    >
                        <CheckCircle2 size={16} />
                    </button>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(booking); }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                    title="Edit"
                >
                    <Edit2 size={16} />
                </button>

                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(booking); }}
                    className="p-2 text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            {/* Mobile / More Dropdown */}
            <div className="relative">
                <button
                    onClick={toggleOpen}
                    className="p-2 md:hidden text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg"
                >
                    <MoreVertical size={16} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <div className="absolute right-0 mt-2 w-48 bg-[var(--bg-elevated)] border border-[var(--border-light)] rounded-xl shadow-xl z-20 py-1 overflow-hidden animate-fade-in ring-1 ring-black/5">
                            <div className="px-3 py-2 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider bg-[var(--bg-secondary)]">
                                Communication
                            </div>
                            <button
                                onClick={handleCall}
                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
                            >
                                <Phone size={14} className="text-blue-500" /> Call Client
                            </button>

                            {/* WhatsApp Options */}
                            <div className="border-t border-[var(--border-light)] my-1" />
                            <div className="px-4 py-1.5 text-xs text-[var(--text-tertiary)]">Send WhatsApp:</div>

                            <WhatsAppButton
                                phone={booking.clientPhone}
                                message={confirmMsg}
                                label="Confirmation"
                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
                                iconSize={14}
                            />
                            {parseInt(dueAmount) > 0 && (
                                <WhatsAppButton
                                    phone={booking.clientPhone}
                                    message={reminderMsg}
                                    label="Payment Reminder"
                                    className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
                                    iconSize={14}
                                />
                            )}
                            <WhatsAppButton
                                phone={booking.clientPhone}
                                message={followUpMsg}
                                label="Follow-up"
                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
                                iconSize={14}
                            />

                            <div className="border-t border-[var(--border-light)] my-1" />

                            {isUpcoming && onMarkCompleted && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onMarkCompleted(booking.id); setIsOpen(false); }}
                                    className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-2 font-medium"
                                >
                                    <CheckCircle2 size={14} className="text-green-500" /> Mark as Completed
                                </button>
                            )}

                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(booking); setIsOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] flex items-center gap-2"
                            >
                                <Edit2 size={14} className="text-orange-500" /> Edit Booking
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(booking); setIsOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
