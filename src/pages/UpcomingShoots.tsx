import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBookings } from "../hooks/useBookings";
import { BookingModal } from "../components/bookings/BookingModal";
import { DeleteModal } from "../components/bookings/DeleteModal";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
    Plus, Search, Calendar as CalendarIcon, Clock, MapPin, Phone, Users, CheckCircle2
} from "lucide-react";
import { BookingActions } from "../components/bookings/BookingActions";
import { Booking } from "../types";
import { format } from "date-fns";
import { formatMoney } from "../utils/currency";
import { normalizeFirestoreDate } from "../utils/date";

export const UpcomingShoots = () => {
    const navigate = useNavigate();
    const { bookings, loading, addBooking, updateBooking, softDeleteBooking, markAsCompleted } = useBookings();

    const [searchTerm, setSearchTerm] = useState("");
    const [dateFilter, setDateFilter] = useState("");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
    const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
    const [isDeleteLoading, setIsDeleteLoading] = useState(false);

    // Only upcoming shoots
    const upcomingBookings = bookings.filter(b => {
        const isUpcoming = !b.shootStatus || b.shootStatus === 'upcoming';
        if (!isUpcoming) return false;

        let bDate = normalizeFirestoreDate(b.eventDate) || new Date();
        const mainDateStr = format(bDate, 'yyyy-MM-dd');
        const formattedDate = format(bDate, 'MMM dd yyyy').toLowerCase();
        const subEventDates = b.subEvents?.map(se => se.date) || [];
        const matchesDate = !dateFilter || mainDateStr === dateFilter || subEventDates.includes(dateFilter);

        const search = searchTerm.toLowerCase().trim();
        const normalizedSearch = search.replace(/\//g, '-');

        const subEventMatchesSearch = b.subEvents?.some(se => {
            const seTitle = se.title.toLowerCase();
            const seDate = se.date;
            const seDateDisplay = format(new Date(se.date), 'dd/MM/yyyy');
            const seDateShort = format(new Date(se.date), 'dd/MM');
            return seTitle.includes(search) ||
                seDate.includes(normalizedSearch) ||
                seDateDisplay.includes(search) ||
                seDateShort.includes(search);
        });

        const matchesSearch =
            !search ||
            b.clientName.toLowerCase().includes(search) ||
            b.clientPhone.includes(search) ||
            b.venue.toLowerCase().includes(search) ||
            formattedDate.includes(search) ||
            subEventMatchesSearch;

        return matchesSearch && matchesDate;
    });

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
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-[12px] bg-amber-500/10">
                            <Clock className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Upcoming Shoots</h1>
                            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                                {loading ? 'Loading...' : `${upcomingBookings.length} pending shoot${upcomingBookings.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                </div>
                <Button onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}>
                    <Plus className="mr-2 h-4 w-4" /> New Booking
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-[var(--surface-base)] p-4 rounded-[18px] border border-[var(--border-light)] shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] h-4 w-4" />
                    <Input
                        placeholder="Search clients, phone, venue..."
                        className="pl-9 bg-[var(--bg-secondary)] border-[var(--border-light)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-[var(--bg-secondary)] p-1 rounded-lg border border-[var(--border-light)]">
                    <CalendarIcon className="ml-2 h-4 w-4 text-[var(--text-tertiary)]" />
                    <input
                        type="date"
                        className="bg-transparent border-none text-sm text-[var(--text-primary)] focus:outline-none p-1.5"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                    />
                    {dateFilter && (
                        <button
                            onClick={() => setDateFilter("")}
                            className="px-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                        >
                            ×
                        </button>
                    )}
                </div>
            </div>

            {/* Bookings Table / Cards */}
            <div className="bg-[var(--surface-base)] rounded-[24px] border border-[var(--border-light)] overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 text-center text-[var(--text-secondary)]">Loading upcoming shoots...</div>
                ) : upcomingBookings.length > 0 ? (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-sm">
                                    <tr>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Date</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Client</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Event</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Location</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Team</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Amount</th>
                                        <th className="p-4 font-medium uppercase tracking-wider text-xs">Shoot Status</th>
                                        <th className="p-4 font-medium text-right uppercase tracking-wider text-xs">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-light)]">
                                    {upcomingBookings.map((booking) => {
                                        const amount = booking.financials?.totalAmount ? booking.financials.totalAmount / 100 : 0;
                                        const advance = booking.financials?.advancePaid ? booking.financials.advancePaid / 100 : 0;
                                        const due = amount - advance;

                                        const team = booking.teamAssignment;
                                        const teamNames = [
                                            team?.mainPhotographer?.name,
                                            team?.droneOperator?.name,
                                            team?.editor?.name,
                                            ...(team?.assistants?.map(a => a.name) ?? [])
                                        ].filter(Boolean);

                                        return (
                                            <tr
                                                key={booking.id}
                                                onClick={() => navigate(`/bookings/${booking.id}`)}
                                                className="hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
                                            >
                                                <td className="p-4 text-[var(--text-primary)]">
                                                    <div className="flex items-center gap-2 font-medium">
                                                        <CalendarIcon className="h-4 w-4 text-amber-500" />
                                                        {(() => {
                                                            let d = normalizeFirestoreDate(booking.eventDate) || new Date();
                                                            return format(d, 'MMM dd');
                                                        })()}
                                                    </div>
                                                    <div className="text-xs text-[var(--text-secondary)] pl-6">
                                                        {(() => {
                                                            let d = normalizeFirestoreDate(booking.eventDate) || new Date();
                                                            return format(d, 'h:mm a');
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-medium text-[var(--text-primary)]">{booking.clientName}</div>
                                                    <a
                                                        href={`tel:+91${booking.clientPhone}`}
                                                        className="flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:underline transition-colors mt-0.5 w-fit"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Phone size={10} className="mr-1" />
                                                        {booking.clientPhone}
                                                    </a>
                                                </td>
                                                <td className="p-4">
                                                    <span className="capitalize bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded text-xs border border-amber-200 dark:border-amber-500/20">
                                                        {booking.eventType}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {booking.venue ? (
                                                        <div className="flex items-center text-xs text-[var(--text-secondary)]">
                                                            <MapPin size={10} className="mr-1 flex-shrink-0" />
                                                            <span className="truncate max-w-[160px]">{booking.venue}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-tertiary)]">—</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {teamNames.length > 0 ? (
                                                        <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                            <Users size={10} className="flex-shrink-0" />
                                                            <span className="truncate max-w-[120px]">{teamNames.join(', ')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[var(--text-tertiary)]">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm text-[var(--text-primary)] font-medium">{formatMoney(amount)}</div>
                                                    {due > 0 && (
                                                        <div className="text-xs text-red-500 font-medium">Due: {formatMoney(due)}</div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                        <Clock size={10} />
                                                        Upcoming
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <BookingActions
                                                        booking={booking}
                                                        onEdit={handleEdit}
                                                        onDelete={() => setBookingToDelete(booking)}
                                                        onMarkCompleted={markAsCompleted}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                            {upcomingBookings.map((booking) => {
                                const amount = booking.financials?.totalAmount ? booking.financials.totalAmount / 100 : 0;
                                const advance = booking.financials?.advancePaid ? booking.financials.advancePaid / 100 : 0;
                                const due = amount - advance;

                                return (
                                    <div
                                        key={booking.id}
                                        onClick={() => navigate(`/bookings/${booking.id}`)}
                                        className="bg-[var(--bg-secondary)] p-4 rounded-[18px] border border-amber-200/60 dark:border-amber-500/20 shadow-sm hover:border-amber-400/50 transition-colors cursor-pointer"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-[var(--text-primary)]">{booking.clientName}</div>
                                                <div className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
                                                    <CalendarIcon className="w-3 h-3 text-amber-500" />
                                                    {(() => {
                                                        let d = normalizeFirestoreDate(booking.eventDate) || new Date();
                                                        return `${format(d, 'MMM dd, yyyy')} at ${format(d, 'h:mm a')}`;
                                                    })()}
                                                </div>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <BookingActions
                                                    booking={booking}
                                                    onEdit={handleEdit}
                                                    onDelete={() => setBookingToDelete(booking)}
                                                    onMarkCompleted={markAsCompleted}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            <span className="capitalize bg-amber-500/10 text-amber-700 dark:text-amber-400 px-2 py-1 rounded text-xs border border-amber-200 dark:border-amber-500/20">
                                                {booking.eventType}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                                                <Clock size={10} /> Upcoming
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <a
                                                    href={`tel:+91${booking.clientPhone}`}
                                                    className="flex items-center text-xs text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-colors w-fit"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Phone size={10} className="mr-1" />
                                                    {booking.clientPhone}
                                                </a>
                                                {booking.venue && (
                                                    <div className="flex items-center text-xs text-[var(--text-tertiary)]">
                                                        <MapPin size={10} className="mr-1" />
                                                        <span className="truncate max-w-[160px]">{booking.venue}</span>
                                                    </div>
                                                )}
                                                {/* Mark as Completed Button for Mobile */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); markAsCompleted(booking.id); }}
                                                    className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <CheckCircle2 size={12} /> Mark as Completed
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-sm text-[var(--text-primary)] font-medium">{formatMoney(amount)}</div>
                                                {due > 0 && (
                                                    <div className="text-xs text-red-500 font-medium">Due: {formatMoney(due)}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                ) : (
                    <div className="p-12 text-center">
                        <div className="inline-block p-4 rounded-full bg-amber-500/10 text-amber-500 mb-4">
                            <Clock size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-[var(--text-primary)]">No upcoming shoots</h3>
                        <p className="text-[var(--text-secondary)] mt-1 mb-6">
                            {searchTerm || dateFilter
                                ? "No bookings match your filters."
                                : "All shoots are completed or no bookings have been added yet."}
                        </p>
                        {!searchTerm && !dateFilter && (
                            <Button onClick={() => { setEditingBooking(undefined); setIsFormOpen(true); }}>
                                <Plus className="mr-2 h-4 w-4" /> Create Booking
                            </Button>
                        )}
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
                description={`Are you sure you want to remove the booking for ${bookingToDelete?.clientName}? You can restore it from the Bin within 30 days.`}
            />
        </div>
    );
};
