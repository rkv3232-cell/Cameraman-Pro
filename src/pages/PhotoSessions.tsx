import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Camera, Lock, Unlock, Trash2, ExternalLink, Copy, Search, Calendar, Image as ImageIcon } from 'lucide-react';
import { usePhotoSession } from '../hooks/usePhotoSession';
import { useBookings } from '../hooks/useBookings';
import { PhotoSession } from '../types';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
    draft:     { label: 'Draft',     color: 'bg-slate-500/15 text-slate-400',   dot: 'bg-slate-400' },
    active:    { label: 'Active',    color: 'bg-emerald-500/15 text-emerald-500', dot: 'bg-emerald-500' },
    locked:    { label: 'Locked',    color: 'bg-amber-500/15 text-amber-500',    dot: 'bg-amber-500' },
    delivered: { label: 'Delivered', color: 'bg-sky-500/15 text-sky-400',        dot: 'bg-sky-400' },
};

export const PhotoSessions = () => {
    const { sessions, loading, deleteSession, toggleLock } = usePhotoSession();
    const { bookings } = useBookings();
    const [search, setSearch] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [createBookingId, setCreateBookingId] = useState('');
    const { createSession } = usePhotoSession();
    const [creating, setCreating] = useState(false);

    const filtered = sessions.filter(s =>
        s.clientName.toLowerCase().includes(search.toLowerCase()) ||
        s.accessCode.toLowerCase().includes(search.toLowerCase()) ||
        s.eventType.toLowerCase().includes(search.toLowerCase())
    );

    const copyLink = (code: string) => {
        const url = `${window.location.origin}/select/${code}`;
        navigator.clipboard.writeText(url);
        toast.success('Selection link copied!');
    };

    const whatsappShare = (session: PhotoSession) => {
        const url = `${window.location.origin}/select/${session.accessCode}`;
        const text = `नमस्ते ${session.clientName} जी! 📸\n\nआपकी फोटो गैलरी सिलेक्शन के लिए तैयार है।\n👉 ${url}\n\nएक्सेस कोड: *${session.accessCode}*\n\nकृपया डेडलाइन से पहले अपनी पसंदीदा फोटोज सिलेक्ट कर लें।`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleCreate = async () => {
        if (!createBookingId) { toast.error('Please select a booking.'); return; }
        const booking = bookings.find(b => b.id === createBookingId);
        if (!booking) return;
        setCreating(true);
        const id = await createSession({
            bookingId: booking.id,
            clientName: booking.clientName,
            eventType: booking.eventType,
            eventDate: booking.eventDate,
        });
        setCreating(false);
        if (id) setShowCreate(false);
    };

    const confirmDelete = async (session: PhotoSession) => {
        if (!window.confirm(`Delete session for "${session.clientName}"? This will remove all ${session.totalPhotos} photos permanently.`)) return;
        await deleteSession(session.id);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">📸 Photo Sessions</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                        Manage galleries, share selection links, track client progress
                    </p>
                </div>
                <button
                    id="create-session-btn"
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--accent-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-[var(--accent-primary)]/30"
                >
                    <Plus size={18} /> New Session
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                    id="session-search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or code…"
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-[var(--surface-base)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                />
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Sessions', value: sessions.length, icon: Camera, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                    { label: 'Active', value: sessions.filter(s => s.status === 'active').length, icon: ImageIcon, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Locked', value: sessions.filter(s => s.isLocked).length, icon: Lock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    { label: 'Total Photos', value: sessions.reduce((a, s) => a + s.totalPhotos, 0), icon: ImageIcon, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon size={20} className={color} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black text-[var(--text-primary)] tabular-nums">{value}</p>
                            <p className="text-xs text-[var(--text-tertiary)] truncate">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Session list */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-[var(--border-light)] rounded-3xl bg-[var(--surface-base)]">
                    <Camera size={48} className="mx-auto mb-4 text-[var(--text-tertiary)] opacity-40" />
                    <p className="text-lg font-semibold text-[var(--text-secondary)]">No sessions yet</p>
                    <p className="text-sm text-[var(--text-tertiary)] mt-1">Create your first photo session to get started</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(session => {
                        const s = STATUS_CONFIG[session.status];
                        return (
                            <div
                                key={session.id}
                                className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-4 sm:p-5 hover:border-[var(--accent-primary)]/30 transition-all"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Info */}
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="font-bold text-[var(--text-primary)] truncate">{session.clientName}</h3>
                                            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${s.color}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                                                {s.label}
                                            </span>
                                            {session.isLocked && (
                                                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 flex items-center gap-1">
                                                    <Lock size={10} /> Locked
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[var(--text-tertiary)] flex-wrap">
                                            <span className="capitalize">{session.eventType}</span>
                                            <span>·</span>
                                            <span className="font-mono font-bold text-[var(--accent-primary)]">{session.accessCode}</span>
                                            <span>·</span>
                                            <span>{session.totalPhotos} photos</span>
                                            {session.deadlineAt && (
                                                <>
                                                    <span>·</span>
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        Deadline: {(session.deadlineAt as any).toDate?.().toLocaleDateString('en-IN') ?? 'Set'}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Link
                                            to={`/studio/photo-sessions/${session.id}`}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-[var(--accent-primary)]/10 hover:bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-semibold rounded-xl transition-colors"
                                        >
                                            <ImageIcon size={14} /> Manage
                                        </Link>
                                        <button
                                            id={`copy-link-${session.id}`}
                                            onClick={() => copyLink(session.accessCode)}
                                            title="Copy selection link"
                                            className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-xl transition-colors"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            id={`whatsapp-${session.id}`}
                                            onClick={() => whatsappShare(session)}
                                            title="Share via WhatsApp"
                                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors"
                                        >
                                            <ExternalLink size={16} />
                                        </button>
                                        <button
                                            id={`lock-${session.id}`}
                                            onClick={() => toggleLock(session.id, !session.isLocked)}
                                            title={session.isLocked ? 'Unlock session' : 'Lock session'}
                                            className={`p-2 rounded-xl transition-colors ${session.isLocked ? 'text-amber-400 hover:bg-amber-500/10' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                                        >
                                            {session.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                                        </button>
                                        <button
                                            id={`delete-session-${session.id}`}
                                            onClick={() => confirmDelete(session)}
                                            title="Delete session"
                                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">New Photo Session</h2>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Link to Booking</label>
                            <select
                                id="create-session-booking-select"
                                value={createBookingId}
                                onChange={e => setCreateBookingId(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                            >
                                <option value="">Select a booking…</option>
                                {bookings.map(b => (
                                    <option key={b.id} value={b.id}>{b.clientName} — {b.eventType}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2.5 border border-[var(--border-light)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-create-session-btn"
                                onClick={handleCreate}
                                disabled={creating || !createBookingId}
                                className="flex-1 py-2.5 bg-[var(--accent-primary)] text-white text-sm font-semibold rounded-xl disabled:opacity-50 hover:opacity-90 transition-all"
                            >
                                {creating ? 'Creating…' : 'Create Session'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoSessions;
