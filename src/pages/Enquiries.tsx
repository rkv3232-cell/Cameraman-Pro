import { useState } from 'react';
import { useEnquiries } from '../hooks/useEnquiries';
import { useBookings } from '../hooks/useBookings';
import { Enquiry, EnquiryStatus } from '../types';
import { format } from 'date-fns';
import {
    MessageSquare,
    Phone,
    MapPin,
    Calendar,
    XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { sendWhatsAppMessage } from '../utils/whatsapp';
import { BookingModal } from '../components/bookings/BookingModal';

export const Enquiries = () => {
    const { enquiries, loading, updateEnquiryStatus } = useEnquiries();
    const [filter, setFilter] = useState<EnquiryStatus | 'all'>('all');

    // Booking Conversion Modal State
    const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const { addBooking } = useBookings();

    const aiLead = enquiries.find(enquiry => enquiry.source === 'AI_CHAT' && enquiry.status === 'new');
    const filteredEnquiries = enquiries.filter(
        enq => filter === 'all' || enq.status === filter
    );

    const scrollToLead = (id: string) => {
        if (typeof document === 'undefined') return;
        const element = document.getElementById(`enquiry-${id}`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-2', 'ring-emerald-400');
        setTimeout(() => element.classList.remove('ring-2', 'ring-emerald-400'), 1600);
    };

    const handleWhatsApp = (enquiry: Enquiry) => {
        const msg = `Hello ${enquiry.name}, thank you for reaching out to Cameraman Pro. We received your enquiry for the ${enquiry.eventType} event on ${enquiry.date}. How can we assist you?`;
        sendWhatsAppMessage(enquiry.phone, msg);
    };

    const handleConvertToBooking = async (bookingData: any) => {
        if (!selectedEnquiry) return;

        try {
            await addBooking(bookingData);
            await updateEnquiryStatus(selectedEnquiry.id, 'converted');
            setIsConverting(false);
            setSelectedEnquiry(null);
        } catch (error) {
            console.error("Conversion failed:", error);
        }
    };

    const getStatusBadge = (status: EnquiryStatus) => {
        switch (status) {
            case 'new': return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400';
            case 'contacted': return 'bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
            case 'converted': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500';
            case 'closed': return 'bg-gray-50 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    if (loading) {
        return <div className="p-8 text-slate-400">Loading enquiries...</div>;
    }

    // Prepare mock booking structure to prefill BookingModal
    const prefillBookingData = selectedEnquiry ? {
        clientName: selectedEnquiry.name,
        clientPhone: selectedEnquiry.phone,
        clientEmail: selectedEnquiry.email || "",
        venue: selectedEnquiry.location,
        eventType: selectedEnquiry.eventType as any,
        subEvents: [{
            title: selectedEnquiry.eventType,
            date: selectedEnquiry.date,
            time: "10:00" // Default
        }],
        notes: `From Enquiry: ${selectedEnquiry.message}`
    } as any : undefined;

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Public Enquiries</h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        Leads generated from the public website
                    </p>
                </div>

                <div className="flex gap-2 bg-[var(--surface-base)] p-1 rounded-xl border border-[var(--border-light)]">
                    {(['all', 'new', 'contacted', 'converted', 'closed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${filter === f
                                ? 'bg-[var(--accent-primary)] text-white'
                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            {aiLead && (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 text-sm text-[var(--text-primary)] shadow-lg shadow-emerald-500/10">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                                🤖 New AI Lead
                            </p>
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{aiLead.name}</p>
                            <p className="text-[var(--text-secondary)]">
                                {aiLead.eventType} • {format(new Date(aiLead.date), "dd MMM, yyyy")}
                            </p>
                            <p className="text-[var(--text-secondary)]">{aiLead.location}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="ghost"
                                className="px-3 py-1 text-[11px]"
                                onClick={() => scrollToLead(aiLead.id)}
                            >
                                View enquiry
                            </Button>
                            <Button
                                variant="secondary"
                                className="px-3 py-1 text-[11px]"
                                onClick={() => handleWhatsApp(aiLead)}
                            >
                                Call client
                            </Button>
                            <Button
                                variant="primary"
                                className="px-3 py-1 text-[11px]"
                                onClick={() => {
                                    setSelectedEnquiry(aiLead);
                                    setIsConverting(true);
                                }}
                            >
                                Convert to booking
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {filteredEnquiries.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--surface-base)]">
                    <MessageSquare size={48} className="mx-auto text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-lg font-medium text-[var(--text-primary)]">No enquiries found</h3>
                    <p className="text-[var(--text-secondary)] mt-1">
                        {filter === 'all'
                            ? "Waiting for the first lead from the website..."
                            : `You have zero enquiries matching the '${filter}' filter.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEnquiries.map(enquiry => (
                        <div
                            key={enquiry.id}
                            className="bg-[var(--surface-base)] rounded-xl border border-[var(--border-light)] shadow-sm hover:border-[var(--border-medium)] transition-all p-5 flex flex-col"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-lg text-[var(--text-primary)]">{enquiry.name}</h3>
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        Received: {enquiry.createdAt?.toDate ? format(enquiry.createdAt.toDate(), 'dd MMM, HH:mm') : '-'}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 text-xs font-bold uppercase rounded border ${getStatusBadge(enquiry.status)} border-current/20`}>
                                    {enquiry.status}
                                </span>
                            </div>

                            <div className="space-y-2.5 mb-4 flex-1">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Calendar size={14} className="text-blue-500 shrink-0" />
                                    <span>{enquiry.eventType} • {format(new Date(enquiry.date), 'dd MMM yyyy')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <MapPin size={14} className="text-orange-500 shrink-0" />
                                    <span className="truncate">{enquiry.location}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors"
                                    onClick={() => handleWhatsApp(enquiry)}
                                >
                                    <Phone size={14} className="text-emerald-500 shrink-0" />
                                    <span>{enquiry.phone}</span>
                                </div>
                            </div>

                            {enquiry.message && (
                                <div className="p-3 bg-[var(--bg-secondary)] rounded-lg text-sm text-[var(--text-secondary)] italic mb-4 line-clamp-2">
                                    "{enquiry.message}"
                                </div>
                            )}

                            {/* Actions */}
                            <div className="pt-3 border-t border-[var(--border-light)] mt-auto flex flex-wrap gap-2">
                                {enquiry.status === 'new' && (
                                    <Button
                                        variant="secondary"
                                        className="flex-1 px-0 border-[var(--border-light)] hover:bg-[var(--surface-hover)]"
                                        onClick={() => updateEnquiryStatus(enquiry.id, 'contacted')}
                                    >
                                        Mark Contacted
                                    </Button>
                                )}

                                {enquiry.status !== 'converted' && enquiry.status !== 'closed' && (
                                    <Button
                                        className="flex-1 px-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        onClick={() => {
                                            setSelectedEnquiry(enquiry);
                                            setIsConverting(true);
                                        }}
                                    >
                                        Convert Booking
                                    </Button>
                                )}

                                {enquiry.status !== 'closed' && enquiry.status !== 'converted' && (
                                    <Button
                                        variant="danger"
                                        className="w-10 px-0 flex items-center justify-center shrink-0"
                                        onClick={() => updateEnquiryStatus(enquiry.id, 'closed')}
                                        title="Close Enquiry"
                                    >
                                        <XCircle size={16} />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Convert to Booking Modal */}
            {isConverting && selectedEnquiry && (
                <BookingModal
                    isOpen={isConverting}
                    onClose={() => setIsConverting(false)}
                    booking={prefillBookingData}
                    onSave={handleConvertToBooking}
                />
            )}
        </div>
    );
};
