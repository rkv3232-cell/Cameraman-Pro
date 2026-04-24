import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "../hooks/useBookings";
import { BookingModal } from "../components/bookings/BookingModal";
import { DeleteModal } from "../components/bookings/DeleteModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Plus, Search, Filter, Calendar as CalendarIcon, Phone, MapPin } from "lucide-react";
import { BookingActions } from "../components/bookings/BookingActions";
import { Booking } from "../types";
import { format } from "date-fns";

import { formatMoney } from "../utils/currency";

export const Bookings = () => {
    const navigate = useNavigate();
    const { bookings, loading, addBooking, updateBooking, softDeleteBooking } = useBookings();
    const [searchTerm, setSearchTerm] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);

    // Delete state - We store the whole booking now for trash metadata
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    // Filter Logic
    const filteredBookings = bookings.filter(b =>
        b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.clientPhone.includes(searchTerm) ||
        b.venue.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEdit = (booking: Booking) => {
        setEditingBooking(booking);
        setIsFormOpen(true);
    };

    const handleSave = async (data: any) => {
        if (editingBooking) {
            await updateBooking(editingBooking.id, data);
        } else {
            await addBooking(data);
        }
        setIsFormOpen(false);
    };

    const confirmDelete = async () => {
        if (!bookingToDelete) return;
        setIsDeleteLoading(true);
        try {
            await softDeleteBooking(bookingToDelete);
            setBookingToDelete(null);
        } finally {
            setIsDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Bookings</h1>
                <Button onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> New Booking
                </Button>
            </div>

            <div className="flex gap-4 items-center bg-[var(--surface-base)] p-4 rounded-xl border border-[var(--border-light)] shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] h-4 w-4" />
                    <Input
                        placeholder="Search clients, phone, or venue..."
                        className="pl-9 bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="secondary" className="hidden sm:flex">
                    <Filter className="mr-2 h-4 w-4" /> Filter
                </Button>
            </div>

            <div className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-[var(--text-secondary)]">Loading bookings...</div>
                ) : filteredBookings.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                <tr>
                                    <th className="p-4 font-medium uppercase tracking-wider text-xs">Date</th>
                                    <th className="p-4 font-medium uppercase tracking-wider text-xs">Client</th>
                                    <th className="p-4 font-medium hidden md:table-cell uppercase tracking-wider text-xs">Event</th>
                                    <th className="p-4 font-medium hidden sm:table-cell uppercase tracking-wider text-xs">Amount</th>
                                    <th className="p-4 font-medium uppercase tracking-wider text-xs">Status</th>
                                    <th className="p-4 font-medium text-right uppercase tracking-wider text-xs">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-light)]">
                                {filteredBookings.map((booking) => {
                                    // Financial calc
                                    const amount = booking.financials?.totalAmount ? booking.financials.totalAmount / 100 : 0;
                                    const advance = booking.financials?.advancePaid ? booking.financials.advancePaid / 100 : 0;
                                    const due = amount - advance;

                                    return (
                                        <tr
                                            key={booking.id}
                                            onClick={() => navigate(`/bookings/${booking.id}`)}
                                            className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                                        >
                                            <td className="p-4 text-[var(--text-primary)]">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <CalendarIcon className="h-4 w-4 text-[var(--text-tertiary)]" />
                                                    {format(booking.eventDate.toDate(), 'MMM dd')}
                                                </div>
                                                <div className="text-xs text-[var(--text-secondary)] pl-6">
                                                    {format(booking.eventDate.toDate(), 'h:mm a')}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-[var(--text-primary)]">{booking.clientName}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <a
                                                        href={`tel:+91${booking.clientPhone}`}
                                                        className="flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone size={10} className="mr-1" />
                                                        {booking.clientPhone}
                                                    </a>
                                                </div>
                                                {booking.venue && (
                                                    <div className="flex items-center text-xs text-[var(--text-tertiary)] mt-0.5">
                                                        <MapPin size={10} className="mr-1" />
                                                        <span className="truncate max-w-[150px]">{booking.venue}</span>
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-[var(--text-disabled)] mt-1">
                                                    Booked by {booking.createdByName || 'Unknown'}
                                                </div>
                                            </td>
                                            <td className="p-4 hidden md:table-cell">
                                                <span className="capitalize bg-[var(--bg-secondary)] px-2 py-1 rounded text-xs text-[var(--text-secondary)] border border-[var(--border-light)]">
                                                    {booking.eventType}
                                                </span>
                                            </td>
                                            <td className="p-4 hidden sm:table-cell">
                                                <div className="font-mono text-sm text-[var(--text-primary)] font-medium">{formatMoney(amount)}</div>
                                                {due > 0 && (
                                                    <div className="text-xs text-red-500 font-medium">Due: {formatMoney(due)}</div>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize border
                                                    ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                        booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20' :
                                                            'bg-[var(--bg-secondary)] text-[var(--text-tertiary)] border-[var(--border-light)]'}`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <BookingActions
                                                    booking={booking}
                                                    onEdit={handleEdit}
                                                    onDelete={() => setBookingToDelete(booking)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="inline-block p-4 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] mb-4">
                            <CalendarIcon size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)]">No bookings found</h3>
                        <p className="text-[var(--text-secondary)] mt-1 mb-6">Create your first booking to get started.</p>
                        <Button onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" /> Create Booking
                        </Button>
                    </div>
                )}
            </div>

            <BookingModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                booking={editingBooking}
                onSave={handleSave}
            />

            <DeleteModal
                isOpen={!!bookingToDelete}
                onClose={() => setBookingToDelete(null)}
                onConfirm={confirmDelete}
                isLoading={isDeleteLoading}
                title="Move to Bin?"
                description={`Are you sure you want to remove the booking for ${bookingToDelete?.clientName}? You can restore it from the Bin properly within 30 days.`}
            />
        </div>
    );
};

