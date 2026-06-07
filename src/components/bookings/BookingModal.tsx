import { useState, useEffect, FormEvent } from "react";
import { Booking, BookedEquipmentItem, EventType, SubEvent } from "../../types";
import { Timestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { EquipmentSelector } from "./EquipmentSelector";
import { User, IndianRupee, FileText, Plus, Phone, Mail, MapPin, Calendar, Clock, CheckCircle2, X, AlertCircle } from "lucide-react";
import { sendWhatsAppMessage, getBookingConfirmationMessage } from "../../utils/whatsapp";
import { format } from "date-fns";
import { formatMoney } from "../../utils/currency";
import { normalizeFirestoreDate } from "../../utils/date";
import { motion, AnimatePresence } from "framer-motion";

const CleanInput = ({ label, icon: Icon, value, onChange, type = "text", placeholder = "", required = false, className = "" }: any) => {
    return (
        <div className={`space-y-1.5 ${className}`}>
            <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={18} />}
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    required={required}
                    className={`w-full h-12 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl px-4 text-[var(--text-primary)] outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder-[var(--text-tertiary)] ${Icon ? 'pl-11' : ''}`}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking?: Booking;
    onSave: (data: any) => Promise<void>;
}

export const BookingModal = ({ isOpen, onClose, booking, onSave }: BookingModalProps) => {
    const [loading, setLoading] = useState(false);

    // Form State
    const [clientName, setClientName] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [venue, setVenue] = useState("");

    const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
    const [currentEventTitle, setCurrentEventTitle] = useState("");
    const [currentEventDate, setCurrentEventDate] = useState("");
    const [currentEventTime, setCurrentEventTime] = useState("");

    const [notes, setNotes] = useState("");
    const [equipment, setEquipment] = useState<BookedEquipmentItem[]>([]);

    const [totalAmountRs, setTotalAmountRs] = useState<string>("0");
    const [advancePaidRs, setAdvancePaidRs] = useState<string>("0");

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (booking) {
                setClientName(booking.clientName || "");
                setPhone(booking.clientPhone || "");
                setEmail(booking.clientEmail || "");
                setVenue(booking.venue || "");

                if (booking.subEvents && booking.subEvents.length > 0) {
                    setSubEvents(booking.subEvents);
                } else if (booking.eventDate) {
                    try {
                        const normalized = normalizeFirestoreDate(booking.eventDate);
                        if (normalized) {
                            setSubEvents([{
                                id: '1',
                                title: booking.eventType || 'Event',
                                date: format(normalized, "yyyy-MM-dd"),
                                time: format(normalized, 'HH:mm')
                            }]);
                        } else {
                            setSubEvents([]);
                        }
                    } catch (e) {
                        setSubEvents([]);
                    }
                } else {
                    setSubEvents([]);
                }

                setNotes(booking.notes || "");
                setEquipment(booking.equipmentBooked || []);

                const total = booking.financials?.totalAmount ?? 0;
                const advance = booking.financials?.advancePaid ?? 0;
                setTotalAmountRs((total / 100).toFixed(0));
                setAdvancePaidRs((advance / 100).toFixed(0));
            } else {
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
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [booking, isOpen]);

    if (!isOpen) return null;

    const handleAddEvent = () => {
        if (!currentEventTitle || !currentEventDate || !currentEventTime) {
            toast.error("Please fill in event title, date, and time");
            return;
        }
        setSubEvents([...subEvents, {
            id: Date.now().toString(),
            title: currentEventTitle,
            date: currentEventDate,
            time: currentEventTime
        }]);
        setCurrentEventTitle("");
        setCurrentEventDate("");
        setCurrentEventTime("");
        toast.success(`${currentEventTitle} added!`);
    };

    const handleDeleteEvent = (id: string) => {
        setSubEvents(subEvents.filter(event => event.id !== id));
    };

    const handleSubmit = async (e?: FormEvent) => {
        if (e) e.preventDefault();

        // 1. Validation
        if (!clientName.trim() || !phone.trim()) {
            toast.error("Client Name and Phone are required.");
            return;
        }
        
        let finalEvents = [...subEvents];
        if (finalEvents.length === 0) {
            if (currentEventTitle && currentEventDate && currentEventTime) {
                finalEvents = [{
                    id: Date.now().toString(),
                    title: currentEventTitle,
                    date: currentEventDate,
                    time: currentEventTime
                }];
            } else {
                toast.error("Please add at least one event function.");
                return;
            }
        }

        const phoneDigits = phone.replace(/\D/g, '');
        if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
            toast.error("Invalid phone number.");
            return;
        }

        setLoading(true);
        try {
            const totalAmountPaise = Math.round(parseFloat(totalAmountRs || "0") * 100);
            const advancePaidPaise = Math.round(parseFloat(advancePaidRs || "0") * 100);

            finalEvents.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
            const firstEvent = finalEvents[0];
            const firstEventDateTime = new Date(`${firstEvent.date}T${firstEvent.time}`);

            const payload: Partial<Booking> = {
                clientName: clientName.trim(),
                clientPhone: phoneDigits,
                clientEmail: email.trim() || "",
                venue: venue.trim() || "",
                eventType: (firstEvent.title.toLowerCase() as EventType) || 'other',
                eventDate: Timestamp.fromDate(firstEventDateTime),
                subEvents: finalEvents,
                equipmentBooked: equipment,
                notes: notes.trim() || "",
                financials: {
                    totalAmount: totalAmountPaise,
                    advancePaid: advancePaidPaise,
                    balanceDue: totalAmountPaise - advancePaidPaise,
                    paymentHistory: booking?.financials?.paymentHistory || []
                },
                status: booking ? booking.status : 'pending'
            };

            await onSave(payload);

            if (!booking) {
                const balance = Math.max(0, parseFloat(totalAmountRs || "0") - parseFloat(advancePaidRs || "0"));
                if (window.confirm(`Booking created! Send WhatsApp confirmation to ${clientName}?`)) {
                    const msg = getBookingConfirmationMessage(clientName, finalEvents, formatMoney(parseFloat(totalAmountRs)), formatMoney(parseFloat(advancePaidRs)), formatMoney(balance));
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

    const balance = Math.max(0, parseFloat(totalAmountRs || "0") - parseFloat(advancePaidRs || "0"));

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-6 overflow-hidden">
                <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-4xl h-[95vh] sm:h-auto sm:max-h-[90vh] bg-[var(--surface-base)] sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-light)] bg-[var(--surface-base)] z-20">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">{booking ? "Edit Booking" : "Create New Booking"}</h2>
                        <button onClick={onClose} className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-light)] rounded-full text-[var(--text-secondary)] transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Sticky Top Mini Summary */}
                    <div className="sticky top-0 z-10 bg-[var(--surface-base)]/90 backdrop-blur-md border-b border-[var(--border-light)] px-6 py-3 flex flex-wrap gap-4 items-center justify-between shadow-sm">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <User size={16} className="text-purple-500" />
                                <span className="text-sm font-semibold text-[var(--text-primary)] truncate max-w-[120px]">{clientName || "New Client"}</span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                <Calendar size={16} />
                                {subEvents.length > 0 ? format(new Date(subEvents[0].date), 'MMM dd, yyyy') : 'No date'}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <div className="text-[var(--text-secondary)]">Gear: <span className="text-[var(--text-primary)]">{equipment.length}</span></div>
                            <div className="text-[var(--text-secondary)]">Package: <span className="text-[var(--text-primary)]">₹{totalAmountRs || "0"}</span></div>
                            <div className="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 px-3 py-1 rounded-full font-bold">Bal: ₹{balance}</div>
                        </div>
                    </div>

                    {/* Scrollable Form */}
                    <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar bg-[var(--bg-secondary)]">
                        <div className="space-y-12 max-w-3xl mx-auto pb-20">
                            
                            {/* SECTION 1: Client Details */}
                            <section className="space-y-6">
                                <div className="border-b border-[var(--border-light)] pb-2">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">1. Client Details</h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                    <CleanInput className="sm:col-span-2" label="Client Name" icon={User} value={clientName} onChange={(e: any) => setClientName(e.target.value)} required placeholder="e.g. Rahul Sharma" />
                                    <CleanInput label="Phone Number" icon={Phone} type="tel" value={phone} onChange={(e: any) => setPhone(e.target.value)} required placeholder="10-digit mobile" />
                                    <CleanInput label="Email Address" icon={Mail} type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="Optional" />
                                </div>
                            </section>

                            {/* SECTION 2: Event Timeline */}
                            <section className="space-y-6">
                                <div className="border-b border-[var(--border-light)] pb-2">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">2. Event Timeline</h3>
                                </div>
                                <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm space-y-6">
                                    
                                    {/* SubEvents List */}
                                    {subEvents.length > 0 && (
                                        <div className="space-y-3">
                                            {subEvents.map((event, idx) => (
                                                <div key={event.id} className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 flex items-center justify-center font-bold text-sm">
                                                            {idx + 1}
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-semibold text-[var(--text-primary)] capitalize">{event.title}</p>
                                                            <p className="text-sm text-[var(--text-secondary)]">{format(new Date(event.date), 'dd MMM yyyy')} • {event.time}</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => handleDeleteEvent(event.id)} className="p-2 text-[var(--text-tertiary)] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Add Function Inputs */}
                                    <div className="p-4 bg-[var(--bg-secondary)] border border-dashed border-[var(--border-light)] rounded-xl space-y-4">
                                        <h4 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Add Function</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <CleanInput placeholder="e.g. Haldi" value={currentEventTitle} onChange={(e: any) => setCurrentEventTitle(e.target.value)} />
                                            <CleanInput type="date" icon={Calendar} value={currentEventDate} onChange={(e: any) => setCurrentEventDate(e.target.value)} />
                                            <CleanInput type="time" icon={Clock} value={currentEventTime} onChange={(e: any) => setCurrentEventTime(e.target.value)} />
                                        </div>
                                        <button type="button" onClick={handleAddEvent} className="w-full py-3 bg-[var(--surface-base)] hover:bg-purple-50 dark:hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 rounded-xl font-semibold transition-colors flex justify-center items-center gap-2">
                                            <Plus size={18} /> Add Function to Timeline
                                        </button>
                                    </div>

                                    {subEvents.length === 0 && (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
                                            <AlertCircle size={16} /> Please add at least one event.
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <CleanInput label="Overall Venue / Location" icon={MapPin} value={venue} onChange={(e: any) => setVenue(e.target.value)} placeholder="e.g. Taj Hotel, Mumbai" />
                                    </div>
                                </div>
                            </section>

                            {/* SECTION 3: Equipment Allocation */}
                            <section className="space-y-6">
                                <div className="border-b border-[var(--border-light)] pb-2 flex justify-between items-end">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">3. Equipment</h3>
                                </div>
                                <div className="bg-[var(--surface-base)] p-1 sm:p-6 rounded-2xl border border-[var(--border-light)] shadow-sm">
                                    <EquipmentSelector
                                        selectedEquipment={equipment}
                                        onUpdate={setEquipment}
                                        eventDate={subEvents.length > 0 ? new Date(`${subEvents[0].date}T${subEvents[0].time}`) : new Date()}
                                        rangeStart={subEvents.length > 0 ? new Date(Math.min(...subEvents.map(se => new Date(se.date).getTime()))) : undefined}
                                        rangeEnd={subEvents.length > 0 ? new Date(Math.max(...subEvents.map(se => new Date(se.date).getTime()))) : undefined}
                                        editingBookingId={booking?.id}
                                    />
                                </div>
                            </section>

                            {/* SECTION 4: Financials & Notes */}
                            <section className="space-y-6">
                                <div className="border-b border-[var(--border-light)] pb-2">
                                    <h3 className="text-lg font-bold text-[var(--text-primary)]">4. Financials & Notes</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm space-y-5">
                                        <CleanInput label="Total Package Amount (₹)" type="number" icon={IndianRupee} value={totalAmountRs} onChange={(e: any) => setTotalAmountRs(e.target.value)} />
                                        <CleanInput label="Advance Received (₹)" type="number" icon={IndianRupee} value={advancePaidRs} onChange={(e: any) => setAdvancePaidRs(e.target.value)} />
                                        
                                        <div className="pt-5 border-t border-[var(--border-light)] flex justify-between items-center">
                                            <span className="font-semibold text-[var(--text-secondary)]">Balance Due</span>
                                            <span className={`text-2xl font-black ${balance > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                ₹{balance}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-[var(--surface-base)] p-6 rounded-2xl border border-[var(--border-light)] shadow-sm flex flex-col space-y-2">
                                        <label className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-2">
                                            <FileText size={16} /> Additional Notes
                                        </label>
                                        <textarea
                                            className="flex-1 w-full rounded-xl border border-[var(--border-light)] bg-[var(--bg-secondary)] p-4 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all placeholder-[var(--text-tertiary)] resize-none"
                                            value={notes}
                                            onChange={e => setNotes(e.target.value)}
                                            placeholder="Write any specific client requests or internal notes here..."
                                        />
                                    </div>
                                </div>
                            </section>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 sm:px-8 sm:py-5 border-t border-[var(--border-light)] bg-[var(--surface-base)] flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : booking ? 'Update Booking' : 'Confirm Booking'}
                            {!loading && <CheckCircle2 size={18} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
