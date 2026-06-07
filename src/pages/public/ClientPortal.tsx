import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Booking, ClientPortalImage } from '../../types';
import { formatMoney } from '../../utils/currency';
import { Camera, CheckCircle2, Lock, Download, Image as ImageIcon, Send, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

import { useSEO } from '../../hooks/useSEO';

export const ClientPortal = () => {
    useSEO({
        title: "Client Portal | Cameraman Pro",
        description: "Securely review billing summaries, pay online, select album photographs, and download completed galleries directly.",
        keywords: "client portal, photographer client hub, download photo gallery, photo album selection",
    });

    const { bookingId } = useParams();
    const navigate = useNavigate();
    const { user, userProfile, loading: authLoading } = useAuth();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [images, setImages] = useState<ClientPortalImage[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Auth Check
    useEffect(() => {
        if (authLoading) return;

        const fetchBookingAndAuth = async () => {
            if (!bookingId) {
                navigate('/client/login');
                return;
            }

            try {
                const docRef = doc(db, 'bookings', bookingId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Booking;
                    const pin = sessionStorage.getItem('client_portal_pin');
                    
                    // Allow access if PIN matches, or if authenticated staff/owner, or if logged-in client with matching email
                    const isStaff = userProfile && ['owner', 'admin', 'manager', 'member', 'accountant', 'coordinator'].includes(userProfile.role);
                    const isMatchingClient = user && data.clientEmail && user.email === data.clientEmail;

                    if (pin === data.clientPortal?.pin || isStaff || isMatchingClient) {
                        setBooking(data);
                        if (data.clientPortal?.selectionImages) {
                            setImages(data.clientPortal.selectionImages);
                        }
                    } else {
                        toast.error("Access denied. Please enter access PIN or log in with an authorized account.");
                        sessionStorage.removeItem('client_portal_pin');
                        navigate('/client/login');
                    }
                } else {
                    toast.error("Booking not found");
                    navigate('/client/login');
                }
            } catch (error) {
                console.error("Error fetching booking:", error);
                toast.error("Something went wrong");
            } finally {
                setLoading(false);
            }
        };

        fetchBookingAndAuth();
    }, [bookingId, navigate, user, userProfile, authLoading]);

    const handleLogout = () => {
        sessionStorage.removeItem('client_portal_pin');
        navigate('/client/login');
    };

    const toggleImageSelection = (id: string) => {
        if (booking?.clientPortal?.status === 'selections_submitted' || booking?.clientPortal?.status === 'album_ready') {
            toast.error("Selections are already locked.");
            return;
        }

        setImages(prev => prev.map(img =>
            img.id === id ? { ...img, isSelected: !img.isSelected } : img
        ));
    };

    const submitSelection = async () => {
        if (!bookingId || !booking) return;

        const selectedCount = images.filter(i => i.isSelected).length;
        if (selectedCount === 0) {
            toast.error("Please select at least one photo before submitting.");
            return;
        }

        if (window.confirm(`Are you sure you want to finalize ${selectedCount} photos for your album? You cannot change this later.`)) {
            setSubmitting(true);
            try {
                const bookingRef = doc(db, 'bookings', bookingId);
                await updateDoc(bookingRef, {
                    'clientPortal.status': 'selections_submitted',
                    'clientPortal.selectionImages': images,
                    'clientPortal.selectedCount': selectedCount
                });

                setBooking(prev => prev ? {
                    ...prev,
                    clientPortal: {
                        ...prev.clientPortal!,
                        status: 'selections_submitted',
                        selectionImages: images,
                        selectedCount
                    }
                } : null);

                toast.success("Photos customized and sent to the studio successfully!");
            } catch (error) {
                console.error(error);
                toast.error("Failed to submit selections");
            } finally {
                setSubmitting(false);
            }
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!booking) return null;

    const totalBill = booking.financials?.totalAmount || 0;
    const advancePaid = booking.financials?.advancePaid || 0;
    const balanceDue = Math.max(0, totalBill - advancePaid);

    const isSubmitted = booking.clientPortal?.status === 'selections_submitted' || booking.clientPortal?.status === 'album_ready';
    const selectedCount = images.filter(i => i.isSelected).length;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] pb-20 selection:bg-[var(--accent-primary)] selection:text-white">

            {/* Header */}
            <header className="bg-[var(--surface-base)] border-b border-[var(--border-light)] sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Camera size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-[var(--text-primary)] leading-tight">{booking.clientName}'s Event</h1>
                            <p className="text-xs text-[var(--text-secondary)]">Client Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <LogOut size={16} />
                        <span className="hidden sm:inline text-sm font-medium">Log Out</span>
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 mt-8 space-y-8">

                {/* Billing Overview */}
                <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 rounded-lg">
                            <CheckCircle2 size={24} />
                        </div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Billing Overview</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Total Bill</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatMoney(totalBill / 100)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-light)]">
                            <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">Advance Paid</p>
                            <p className="text-2xl font-bold text-emerald-500">{formatMoney(advancePaid / 100)}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 backdrop-blur-sm relative overflow-hidden">
                            <Lock size={100} className="absolute -right-4 -bottom-6 text-[var(--accent-primary)]/10 rotate-12" />
                            <p className="text-sm font-bold text-[var(--accent-primary)] mb-1 relative z-10">Balance Due</p>
                            <p className="text-3xl font-extrabold text-[var(--accent-primary)] relative z-10">{formatMoney(balanceDue / 100)}</p>

                            {balanceDue > 0 && booking.clientPortal?.paymentLink && (
                                <a
                                    href={booking.clientPortal.paymentLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 w-full block text-center px-4 py-2 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all relative z-10"
                                >
                                    Pay Online Now (UPI)
                                </a>
                            )}
                        </div>
                    </div>
                </section>

                {/* Album Selection Section */}
                <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-6 sm:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 rounded-lg">
                                <ImageIcon size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-[var(--text-primary)]">Album Selection</h2>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {isSubmitted
                                        ? "You've successfully finalized your selection."
                                        : "Tap the photos you want to include in your printed album."}
                                </p>
                            </div>
                        </div>

                        {/* Full Gallery Download Button */}
                        {booking.clientPortal?.galleryLink && (
                            <a
                                href={booking.clientPortal.galleryLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] font-medium rounded-xl hover:bg-[var(--surface-hover)] transition-all flex items-center justify-center gap-2"
                            >
                                <Download size={18} />
                                Download Full Gallery
                            </a>
                        )}
                    </div>

                    {images.length === 0 ? (
                        <div className="py-12 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No photos uploaded for selection yet.</p>
                            <p className="text-sm mt-1">Please check back later or contact the studio.</p>
                        </div>
                    ) : (
                        <>
                            {/* Counter Bar */}
                            <div className="sticky top-20 z-30 mb-6 p-4 bg-[var(--surface-base)]/80 backdrop-blur-md border border-[var(--border-light)] rounded-2xl flex items-center justify-between shadow-lg">
                                <div>
                                    <span className="text-[var(--text-secondary)] text-sm font-medium">Selected: </span>
                                    <span className="text-2xl font-bold text-[var(--accent-primary)]">{selectedCount}</span>
                                    <span className="text-[var(--text-secondary)] text-sm"> / {images.length}</span>
                                </div>
                                {!isSubmitted && (
                                    <button
                                        onClick={submitSelection}
                                        disabled={selectedCount === 0 || submitting}
                                        className="px-6 py-2.5 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-xl shadow-lg hover:shadow-[var(--accent-primary)]/50 disabled:opacity-50 disabled:shadow-none hover:-translate-y-0.5 transition-all flex items-center gap-2"
                                    >
                                        <Send size={16} className={submitting ? "animate-pulse" : ""} />
                                        {submitting ? "Submitting..." : "Submit to Studio"}
                                    </button>
                                )}
                            </div>

                            {/* Image Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {images.map((img, idx) => (
                                    <div
                                        key={img.id}
                                        onClick={() => toggleImageSelection(img.id)}
                                        className={`group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${img.isSelected
                                            ? 'border-emerald-500 scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                                            : `border-transparent hover:border-[var(--accent-primary)]/50 ${!isSubmitted ? 'hover:-translate-y-1' : ''}`
                                            } bg-[var(--bg-secondary)]`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`Selection ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />

                                        {/* Overlay gradient */}
                                        <div className={`absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors ${img.isSelected ? 'bg-transparent' : ''}`} />

                                        {/* Selection Checkmark */}
                                        <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all ${img.isSelected
                                            ? 'bg-emerald-500 border-white text-white rotate-0 scale-100'
                                            : 'bg-black/30 border-white/50 text-transparent opacity-0 group-hover:opacity-100 scale-90'
                                            }`}>
                                            <CheckCircle2 size={20} strokeWidth={3} />
                                        </div>

                                        {/* ID Label */}
                                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md text-white/90 text-xs font-mono rounded">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </section>

            </main>
        </div>
    );
};
