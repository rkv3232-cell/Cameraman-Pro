import { useState, useEffect, FormEvent } from "react";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Booking, BookedEquipmentItem, EventType, SubEvent } from "../../types";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { EquipmentSelector } from "./EquipmentSelector";
import { Calendar, User, IndianRupee, FileText, Plus, X } from "lucide-react";
import { sendWhatsAppMessage, getBookingConfirmationMessage } from "../../utils/whatsapp";
import { format } from "date-fns";
import { formatMoney } from "../../utils/currency";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking?: Booking; // Edit mode
    onSave: (data: any) => Promise<void>;
}

export const BookingModal = ({ isOpen, onClose, booking, onSave }: BookingModalProps) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [clientName, setClientName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [venue, setVenue] = useState("");

    // Multi-Event State
    const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
    const [currentEventTitle, setCurrentEventTitle] = useState("");
    const [currentEventDate, setCurrentEventDate] = useState("");
    const [currentEventTime, setCurrentEventTime] = useState("");

    const [notes, setNotes] = useState("");

    // Complex State
    const [equipment, setEquipment] = useState<BookedEquipmentItem[]>([]);

    // Financial State (Input in Rupees string to allow empty state, converted to Paise on save)
    const [totalAmountRs, setTotalAmountRs] = useState<string>("0");
    const [advancePaidRs, setAdvancePaidRs] = useState<string>("0");

    // Initialization
    useEffect(() => {
        if (booking) {
            // Edit Mode: Populate from existing booking
            // Use fallback to empty string to avoid "uncontrolled to controlled" warning or undefined errors
            setClientName(booking.clientName || "");
            setPhone(booking.clientPhone || "");
            setEmail(booking.clientEmail || "");
            setVenue(booking.venue || "");

            // Load subEvents if available, otherwise migrate from old single event format
            if (booking.subEvents && booking.subEvents.length > 0) {
                setSubEvents(booking.subEvents);
            } else if (booking.eventDate) {
                // Backward compatibility: Convert old single event to subEvent
                try {
                    const date = booking.eventDate.toDate();
                    const iso = format(date, "yyyy-MM-dd");
                    const time = format(date, 'HH:mm');
                    setSubEvents([{
                        id: '1',
                        title: booking.eventType || 'Event',
                        date: iso,
                        time: time
                    }]);
                } catch (e) {
                    console.error("Error parsing date:", e);
                    setSubEvents([]);
                }
            } else {
                setSubEvents([]);
            }

            setNotes(booking.notes || "");
            setEquipment(booking.equipmentBooked || []);

            // Financials: Paise -> Rupees
            // Handle null/undefined financials safely
            const total = booking.financials?.totalAmount ?? 0;
            const advance = booking.financials?.advancePaid ?? 0;
            setTotalAmountRs((total / 100).toFixed(0));
            setAdvancePaidRs((advance / 100).toFixed(0));
        } else {
            // Reset for new booking
            setClientName("");
            setPhone("");
            setEmail("");
            setVenue("");
            setSubEvents([]);
            setCurrentEventTitle("");
            setCurrentEventDate("");
            setCurrentEventTime("");
            setNotes("");
            setEquipment([]);
            setTotalAmountRs("0");
            setAdvancePaidRs("0");
        }
    }, [booking, isOpen]);

    // Add Event Handler
    const handleAddEvent = () => {
        if (!currentEventTitle || !currentEventDate || !currentEventTime) {
            toast.error("Please fill in event title, date, and time");
            return;
        }

        const newEvent: SubEvent = {
            id: Date.now().toString(),
            title: currentEventTitle,
            date: currentEventDate,
            time: currentEventTime
        };

        setSubEvents([...subEvents, newEvent]);
        setCurrentEventTitle("");
        setCurrentEventDate("");
        setCurrentEventTime("");
        toast.success(`${currentEventTitle} added!`);
    };

    // Delete Event Handler
    const handleDeleteEvent = (id: string) => {
        setSubEvents(subEvents.filter(event => event.id !== id));
        toast.success("Event removed");
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // 1. Validation
        if (!clientName.trim()) {
            toast.error("Client Name is required");
            return;
        }
        if (!phone.trim()) {
            toast.error("Phone number is required");
            return;
        }

        // Auto-Add Logic: If user filled event details but forgot to click "Add Event"
        let finalSubEvents = [...subEvents];
        if (finalSubEvents.length === 0) {
            // Check if user has filled current event inputs
            if (currentEventTitle && currentEventDate && currentEventTime) {
                const autoEvent: SubEvent = {
                    id: Date.now().toString(),
                    title: currentEventTitle,
                    date: currentEventDate,
                    time: currentEventTime
                };
                finalSubEvents = [autoEvent];
                toast.success("Event auto-added from inputs!");
            } else {
                toast.error("Please add at least one event (Click '+ Add Event')");
                return;
            }
        }

        // Strict Phone Validation
        const phoneDigits = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
            toast.error("Invalid phone number. Must be 10 digits starting with 6-9.");
            return;
        }

        setLoading(true);
        try {
            // 2. Data Transformation
            const totalAmountPaise = Math.round(parseFloat(totalAmountRs || "0") * 100);
            const advancePaidPaise = Math.round(parseFloat(advancePaidRs || "0") * 100);

            if (isNaN(totalAmountPaise) || isNaN(advancePaidPaise)) {
                throw new Error("Invalid amount");
            }

            // Verify Sort
            finalSubEvents.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

            const firstEvent = finalSubEvents[0];
            const firstEventDateTime = new Date(`${firstEvent.date}T${firstEvent.time}`);

            // Construct Payload
            // Use undefined-safe construction
            const payload: Partial<Booking> = {
                clientName: clientName.trim(),
                clientPhone: phoneDigits,
                clientEmail: email.trim() || "",
                venue: venue.trim() || "",

                // Main Event Meta (from first subevent)
                eventType: (firstEvent.title.toLowerCase() as EventType) || 'other',
                eventDate: Timestamp.fromDate(firstEventDateTime),

                // Lists
                subEvents: finalSubEvents,
                equipmentBooked: equipment,

                // Notes
                notes: notes.trim() || "",

                // Financials
                financials: {
                    totalAmount: totalAmountPaise,
                    advancePaid: advancePaidPaise,
                    balanceDue: totalAmountPaise - advancePaidPaise,
                    paymentHistory: booking?.financials?.paymentHistory || []
                },

                // Status
                status: booking ? booking.status : 'pending'
            };

            await onSave(payload);

            // Auto WhatsApp Prompt for NEW bookings only (kept from original)
            if (!booking) {
                if (window.confirm(`Booking created! Send WhatsApp confirmation to ${clientName}?`)) {
                    const msg = getBookingConfirmationMessage(
                        clientName,
                        finalSubEvents,
                        formatMoney(parseFloat(totalAmountRs)),
                        formatMoney(parseFloat(advancePaidRs)),
                        formatMoney(balance)
                    );
                    sendWhatsAppMessage(phoneDigits, msg);
                }
            } else {
                toast.success("Booking updated successfully");
            }

            onClose();
        } catch (error) {
            console.error("Save failed", error);
            toast.error("Failed to save booking");
        } finally {
            setLoading(false);
        }
    };

    // Computed UI helper
    const balance = Math.max(0, parseFloat(totalAmountRs || "0") - parseFloat(advancePaidRs || "0"));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={booking ? "Edit Booking Details" : "Create New Booking"}
            maxWidth="max-w-4xl" // Wider for 2-column layout
        >
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT COLUMN: Client & Event */}
                <div className="space-y-6">
                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            <User size={16} /> Client Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Input
                                    label="Client Name *"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    placeholder="e.g. Rahul Sharma"
                                />
                            </div>
                            <Input
                                label="Phone Number *"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="9876543210"
                                type="tel"
                            />
                            <Input
                                label="Email (Optional)"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="client@gmail.com"
                                type="email"
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-300 uppercase tracking-wider">
                            <Calendar size={16} /> Timeline
                        </h4>

                        {/* Add Event Form (Timeline) */}
                        <div className="space-y-3 p-4 bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                                <div className="space-y-1 md:col-span-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)]">Function Name</label>
                                    <input
                                        className="w-full h-9 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-tertiary)]"
                                        value={currentEventTitle}
                                        onChange={e => setCurrentEventTitle(e.target.value)}
                                        placeholder="e.g. Wedding"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)]">Date</label>
                                    <input
                                        type="date"
                                        className="w-full h-9 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        value={currentEventDate}
                                        onChange={e => setCurrentEventDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[var(--text-secondary)]">Time</label>
                                    <input
                                        type="time"
                                        className="w-full h-9 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                                        value={currentEventTime}
                                        onChange={e => setCurrentEventTime(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={handleAddEvent}
                                className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-white font-semibold"
                            >
                                <Plus size={16} className="mr-2" />
                                Add Event
                            </Button>
                        </div>

                        {/* Events List */}
                        {subEvents.length > 0 && (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Added Events ({subEvents.length})</label>
                                <div className="space-y-2">
                                    {subEvents.map((event) => (
                                        <div
                                            key={event.id}
                                            className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-light)] hover:border-[var(--border-medium)] transition-colors"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)] capitalize">{event.title}</p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {format(new Date(event.date), 'dd MMM yyyy')} • {event.time}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="p-1.5 text-[var(--text-tertiary)] hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {subEvents.length === 0 && (
                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-200/80">
                                ⚠️ Please add at least one event to continue
                            </div>
                        )}

                        <Input
                            label="Venue / Location"
                            value={venue}
                            onChange={e => setVenue(e.target.value)}
                            placeholder="e.g. Hotel Grand, M.G. Road"
                        />
                    </section>

                    <section className="space-y-2">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            <FileText size={16} /> Notes
                        </h4>
                        <textarea
                            className="w-full min-h-[80px] rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] placeholder-[var(--text-tertiary)]"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Additional requirements..."
                        />
                    </section>
                </div>

                {/* RIGHT COLUMN: Equipment & Financials */}
                <div className="space-y-6">

                    {/* Equipment Selector Component */}
                    <div className="md:col-span-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium text-slate-400">Selected Equipment</label>
                            <a href="/inventory" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-500 hover:text-orange-400 flex items-center gap-1">
                                <Plus size={12} /> Add New Gear
                            </a>
                        </div>
                        <EquipmentSelector
                            selectedEquipment={equipment}
                            onUpdate={setEquipment}
                            eventDate={subEvents.length > 0 ? new Date(`${subEvents[0].date}T${subEvents[0].time}`) : new Date()}
                            rangeStart={subEvents.length > 0
                                ? new Date(Math.min(...subEvents.map(se => new Date(se.date).getTime())))
                                : undefined}
                            rangeEnd={subEvents.length > 0
                                ? new Date(Math.max(...subEvents.map(se => new Date(se.date).getTime())))
                                : undefined}
                            editingBookingId={booking?.id}
                        />
                        {equipment.length === 0 && (
                            <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-200/80">
                                Warning: No equipment selected. Booking will be created without gear.
                            </div>
                        )}
                    </div>

                    <section className="space-y-4 bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-light)]">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            <IndianRupee size={16} /> Financials
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Total Package (₹)"
                                type="number"
                                min="0"
                                value={totalAmountRs}
                                onChange={e => setTotalAmountRs(e.target.value)}
                            />
                            <Input
                                label="Advance Received (₹)"
                                type="number"
                                min="0"
                                value={advancePaidRs}
                                onChange={e => setAdvancePaidRs(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-between items-center p-3 bg-[var(--surface-base)] rounded-lg border border-[var(--border-light)]">
                            <span className="text-[var(--text-secondary)] text-sm">Balance Due</span>
                            <span className={`text-lg font-bold ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                {formatMoney(balance)}
                            </span>
                        </div>
                    </section>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                        <Button type="submit" isLoading={loading}>
                            {booking ? "Update Booking" : "Create Booking"}
                        </Button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
