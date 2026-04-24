import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Lock, ArrowRight } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export const ClientLogin = () => {
    const [loginId, setLoginId] = useState('');
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();

        if (!loginId || !pin) {
            toast.error("Please enter both ID and PIN");
            return;
        }

        setLoading(true);
        try {
            // First treat loginId as a direct booking ID document ID
            let bookingDocId = loginId.trim();
            const bookingsRef = collection(db, 'bookings');

            // If it's not a generic ID length, maybe they entered their phone number. Check by phone.
            if (loginId.length === 10 && !isNaN(Number(loginId))) {
                const q = query(bookingsRef, where("clientPhone", "==", loginId));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    // Try to find one that matches the PIN
                    const matchedDoc = snapshot.docs.find(d => {
                        const portal = d.data().clientPortal;
                        return portal && portal.pin === pin;
                    });

                    if (matchedDoc) {
                        bookingDocId = matchedDoc.id;
                    } else {
                        toast.error("Invalid credentials.");
                        setLoading(false);
                        return;
                    }
                }
            }

            // We now do a direct check with bookingDocId in the clientPortal component/route
            // For security, instead of fetching it raw here and exposing rules, we just route to /client/:id
            // However we need to verify the pin before routing to give good UX.

            // Let's do a query simply by id to see if pin matches (Client needs read permissions or we use a Cloud Function, but for this SaaS we'll query)
            // Or better yet, just route and let the Portal component handle validation.
            // But to avoid routing to a 404, we'll store auth in session.

            sessionStorage.setItem('client_portal_pin', pin);
            navigate(`/client/${bookingDocId}`);

        } catch (error) {
            console.error(error);
            toast.error("Login failed. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center items-center p-4">
            <div className="max-w-md w-full relative">

                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

                <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3">
                            <Camera size={32} className="text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Client Portal</h1>
                        <p className="text-[var(--text-secondary)] mt-2">Access your wedding photos, invoice, and album selections.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <Input
                            label="Booking ID or Phone Number"
                            value={loginId}
                            onChange={(e) => setLoginId(e.target.value)}
                            placeholder="Enter 10-digit phone or ID"
                            required
                        />

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Secure Access PIN</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type="password"
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value)}
                                    maxLength={6}
                                    placeholder="••••••"
                                    className="w-full h-11 pl-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm tracking-widest text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            isLoading={loading}
                            className="w-full h-12 text-base font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                            <span className="flex items-center gap-2">
                                Access Portal
                                <ArrowRight size={18} />
                            </span>
                        </Button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-[var(--border-light)] text-center">
                        <p className="text-sm text-[var(--text-tertiary)]">
                            Don't have your PIN? Please ask your studio manager or refer to your booking confirmation WhatsApp.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
