import { useState } from "react";
import { Search, CheckCircle, Clock, Camera, Edit3, Package, Truck, AlertCircle, MessageSquare, ArrowRight } from "lucide-react";
import { useContext } from "react";
import LanguageContext from "../../context/LanguageContext";

type Stage = {
    key: string;
    label: string;
    labelHi: string;
    icon: typeof Camera;
    color: string;
};

const STAGES: Stage[] = [
    { key: 'booked', label: 'Booked', labelHi: 'बुकिंग हुई', icon: CheckCircle, color: 'text-blue-500' },
    { key: 'shoot', label: 'Shoot Done', labelHi: 'शूट हो गई', icon: Camera, color: 'text-violet-500' },
    { key: 'editing', label: 'Editing', labelHi: 'एडिटिंग', icon: Edit3, color: 'text-amber-500' },
    { key: 'ready', label: 'Album Ready', labelHi: 'एल्बम तैयार', icon: Package, color: 'text-orange-500' },
    { key: 'delivered', label: 'Delivered', labelHi: 'डिलीवरी हुई', icon: Truck, color: 'text-emerald-500' },
];

// Mock data for demo — in production this would query Firestore
const DEMO_ORDERS: Record<string, { clientName: string; eventType: string; eventDate: string; currentStage: number; message?: string }> = {
    'BOOK001': {
        clientName: 'Ramesh Kumar',
        eventType: 'Wedding',
        eventDate: '15 Mar 2026',
        currentStage: 2,
        message: 'Your photos are currently being edited. Expected delivery: 3-5 days.',
    },
    'BOOK002': {
        clientName: 'Priya Sharma',
        eventType: 'Birthday',
        eventDate: '10 Mar 2026',
        currentStage: 4,
        message: 'Your album is ready! Please contact us to arrange pickup/delivery.',
    },
    'BOOK003': {
        clientName: 'Ankit Singh',
        eventType: 'Pre-Wedding',
        eventDate: '5 Mar 2026',
        currentStage: 5,
        message: 'Your photos have been delivered. Thank you for choosing Cameraman Pro! 🎉',
    },
};

type OrderResult = { clientName: string; eventType: string; eventDate: string; currentStage: number; message?: string } | null | 'not-found';

import { useSEO } from "../../hooks/useSEO";

export const TrackOrder = () => {
    const { lang } = useContext(LanguageContext);
    const hi = lang === 'hi';

    useSEO({
        title: hi ? "ऑर्डर ट्रैक करें | Cameraman Pro" : "Track Order Status | Cameraman Pro",
        description: hi 
          ? "अपना बुकिंग आईडी या मोबाइल नंबर दर्ज करके अपनी शादी या इवेंट फोटोग्राफी / एल्बम ऑर्डर का लाइव स्टेटस जानें।"
          : "Check the live production and delivery status of your wedding photography, album creation, or birthday shoot order with your Booking ID.",
        keywords: "track order, track album delivery, track photoshoot status, photography order tracking",
    });

    const [query, setQuery] = useState('');
    const [result, setResult] = useState<OrderResult>(null);
    const [searched, setSearched] = useState(false);

    const handleSearch = () => {
        if (!query.trim()) return;
        const key = query.trim().toUpperCase();
        const found = DEMO_ORDERS[key];
        setResult(found || 'not-found');
        setSearched(true);
    };

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">

            {/* Hero */}
            <section className="relative py-28 px-4 text-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/8 to-transparent pointer-events-none" />
                <div className="relative max-w-2xl mx-auto">
                    <span className="inline-block text-4xl mb-4">📦</span>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
                        {hi ? 'ऑर्डर ट्रैक करें' : 'Track Your Order'}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-lg mb-8">
                        {hi
                            ? 'अपना Booking ID या मोबाइल नंबर डालें और जानें आपकी फोटो/एल्बम कहाँ है'
                            : 'Enter your Booking ID or phone number to check your photo/album status'}
                    </p>

                    {/* Search Box */}
                    <div className="flex gap-3 max-w-md mx-auto">
                        <div className="flex-1 relative">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                            <input
                                type="text"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                placeholder={hi ? 'Booking ID (जैसे BOOK001)' : 'Booking ID (e.g. BOOK001)'}
                                className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-[var(--border-light)] bg-[var(--surface-base)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)]/50 text-sm"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            className="px-6 py-3.5 rounded-2xl bg-[var(--accent-primary)] text-white font-bold hover:-translate-y-0.5 transition-all"
                        >
                            {hi ? 'खोजें' : 'Track'}
                        </button>
                    </div>

                    <p className="text-xs text-[var(--text-tertiary)] mt-3">
                        {hi ? '💡 Booking ID आपके WhatsApp confirmation message में मिलेगा' : '💡 Booking ID can be found in your WhatsApp confirmation message'}
                    </p>
                </div>
            </section>

            {/* Results */}
            {searched && (
                <section className="pb-20 px-4">
                    <div className="max-w-2xl mx-auto">

                        {result === 'not-found' ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle size={32} className="text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{hi ? 'नहीं मिला' : 'Not Found'}</h3>
                                <p className="text-[var(--text-secondary)] mb-6">
                                    {hi ? 'इस Booking ID से कोई record नहीं मिला। कृपया सही ID डालें या हमसे WhatsApp पर संपर्क करें।' : 'No record found for this Booking ID. Please check the ID or contact us on WhatsApp.'}
                                </p>
                                <a
                                    href="https://wa.me/918601343232?text=Meri booking track karna hai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500 text-white font-bold hover:-translate-y-0.5 transition-all"
                                >
                                    <MessageSquare size={16} /> {hi ? 'WhatsApp पर पूछें' : 'Ask on WhatsApp'}
                                </a>
                            </div>
                        ) : result && typeof result === 'object' ? (
                            <div className="rounded-3xl border border-[var(--border-light)] bg-[var(--surface-base)] overflow-hidden">

                                {/* Header */}
                                <div className="p-6 border-b border-[var(--border-light)] bg-gradient-to-r from-[var(--accent-primary)]/5 to-transparent">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold">{result.clientName}</h2>
                                            <p className="text-[var(--text-secondary)] text-sm capitalize">{result.eventType} · {result.eventDate}</p>
                                        </div>
                                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                            {hi ? 'मिल गया ✓' : 'Found ✓'}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
                                        {hi ? 'ऑर्डर स्टेटस' : 'Order Status'}
                                    </h3>
                                    <div className="relative">
                                        {/* Progress line */}
                                        <div className="absolute left-5 top-8 bottom-8 w-0.5 bg-[var(--border-light)]" />
                                        <div
                                            className="absolute left-5 top-8 w-0.5 bg-[var(--accent-primary)] transition-all"
                                            style={{ height: `${((result.currentStage - 1) / (STAGES.length - 1)) * 100}%` }}
                                        />

                                        <div className="space-y-6">
                                            {STAGES.map((stage, i) => {
                                                const isDone = i < result.currentStage;
                                                const isCurrent = i === result.currentStage - 1;
                                                return (
                                                    <div key={stage.key} className="flex items-center gap-4 relative">
                                                        <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 transition-all ${isDone
                                                            ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                                                            : isCurrent
                                                                ? 'bg-[var(--bg-primary)] border-[var(--accent-primary)] animate-pulse'
                                                                : 'bg-[var(--bg-primary)] border-[var(--border-light)]'
                                                            }`}>
                                                            {isDone ? (
                                                                <CheckCircle size={18} className="text-white" />
                                                            ) : (
                                                                <stage.icon size={16} className={isCurrent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className={`font-semibold ${isDone || isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                                                                {hi ? stage.labelHi : stage.label}
                                                            </p>
                                                            {isCurrent && (
                                                                <p className="text-xs text-[var(--accent-primary)] font-medium flex items-center gap-1 mt-0.5">
                                                                    <Clock size={10} /> {hi ? 'वर्तमान स्थिति' : 'Current Stage'}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {isDone && (
                                                            <span className="text-xs text-emerald-500 font-bold">✓</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Message */}
                                    {result.message && (
                                        <div className="mt-6 p-4 rounded-2xl bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/20">
                                            <p className="text-sm text-[var(--text-primary)]">
                                                💬 {result.message}
                                            </p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                        <a
                                            href="https://wa.me/918601343232"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 py-3 rounded-xl bg-green-500 text-white text-center font-bold text-sm flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all"
                                        >
                                            <MessageSquare size={16} /> WhatsApp
                                        </a>
                                        <a
                                            href="/client/login"
                                            className="flex-1 py-3 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] text-center font-bold text-sm flex items-center justify-center gap-2 hover:border-[var(--accent-primary)]/40 transition-all"
                                        >
                                            {hi ? 'फोटो डाउनलोड करें' : 'Download Photos'}
                                            <ArrowRight size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                </section>
            )}

            {/* Demo note */}
            {!searched && (
                <section className="pb-20 px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <div className="p-6 rounded-2xl bg-[var(--surface-base)] border border-[var(--border-light)]">
                            <p className="text-sm text-[var(--text-secondary)] mb-4">
                                {hi ? '💡 Demo के लिए ये Booking IDs try करें:' : '💡 Try these Booking IDs for demo:'}
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {Object.keys(DEMO_ORDERS).map(id => (
                                    <button
                                        key={id}
                                        onClick={() => { setQuery(id); }}
                                        className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-light)] text-sm font-mono hover:border-[var(--accent-primary)]/40 transition-colors"
                                    >
                                        {id}
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                {hi ? 'असली बुकिंग के लिए WhatsApp पर confirmation message check करें' : 'For real bookings, check WhatsApp confirmation message'}
                            </p>
                        </div>
                    </div>
                </section>
            )}

        </div>
    );
};

export default TrackOrder;
