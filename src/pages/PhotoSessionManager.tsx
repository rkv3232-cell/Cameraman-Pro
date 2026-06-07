import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft, Upload, Lock, Unlock, ExternalLink, Copy,
    Trash2, Image as ImageIcon, Calendar, RefreshCw, Settings, Download
} from 'lucide-react';
import { usePhotoSession } from '../hooks/usePhotoSession';
import { SessionPhoto, PhotoSession, PhotoSelection, SelectionType } from '../types';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import toast from 'react-hot-toast';
import JSZip from 'jszip';

export const PhotoSessionManager = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const { uploadPhotos, toggleLock, updateSession, uploading, uploadProgress, loadSessionPhotos, loadSessionSelections, deleteSession } = usePhotoSession();
    const [session, setSession] = useState<PhotoSession | null>(null);
    const [photos, setPhotos] = useState<SessionPhoto[]>([]);
    const [selections, setSelections] = useState<PhotoSelection[]>([]);
    const [loadingSession, setLoadingSession] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [filter, setFilter] = useState<'all' | 'selected'>('all');
    const [deadline, setDeadline] = useState('');
    const [maxSel, setMaxSel] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load session doc
    useEffect(() => {
        if (!sessionId) return;
        const load = async () => {
            const snap = await getDoc(doc(db, 'photoSessions', sessionId));
            if (snap.exists()) {
                const s = { id: snap.id, ...snap.data() } as PhotoSession;
                setSession(s);
                if (s.deadlineAt) {
                    const d = (s.deadlineAt as Timestamp).toDate();
                    setDeadline(d.toISOString().slice(0, 16));
                }
                if (s.maxSelections) setMaxSel(String(s.maxSelections));
            }
            setLoadingSession(false);
        };
        load();
    }, [sessionId]);

    // Load photos
    const refreshPhotos = useCallback(async () => {
        if (!sessionId) return;
        setLoadingPhotos(true);
        const p = await loadSessionPhotos(sessionId);
        setPhotos(p);
        const sel = await loadSessionSelections(sessionId);
        setSelections(sel);
        setLoadingPhotos(false);
    }, [sessionId, loadSessionPhotos, loadSessionSelections]);

    useEffect(() => { refreshPhotos(); }, [refreshPhotos]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!sessionId || !e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        await uploadPhotos(sessionId, files, photos.length);
        await refreshPhotos();
        const snap = await getDoc(doc(db, 'photoSessions', sessionId));
        if (snap.exists()) setSession({ id: snap.id, ...snap.data() } as PhotoSession);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSaveSettings = async () => {
        if (!sessionId) return;
        const updates: any = {};
        if (deadline) updates.deadlineAt = Timestamp.fromDate(new Date(deadline));
        if (maxSel) updates.maxSelections = parseInt(maxSel, 10);
        await updateSession(sessionId, updates);
        setShowSettings(false);
    };

    const copySelectionLink = () => {
        if (!session) return;
        const url = `${window.location.origin}/select/${session.accessCode}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copied!');
    };

    const whatsappShare = () => {
        if (!session) return;
        const url = `${window.location.origin}/select/${session.accessCode}`;
        const text = `Hi ${session.clientName}! 📸 Your gallery is ready.\n👉 ${url}\nCode: *${session.accessCode}*`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const getPhotoSelectionType = (photoId: string): SelectionType | null => {
        for (const sel of selections) {
            if (sel.selections[photoId]) {
                return sel.selections[photoId];
            }
        }
        return null;
    };

    const TYPE_BADGE: Record<SelectionType, { emoji: string; bg: string }> = {
        favorite: { emoji: '❤️', bg: 'bg-rose-500' },
        album:    { emoji: '⭐', bg: 'bg-amber-500' },
        priority: { emoji: '🔥', bg: 'bg-orange-500' },
        rejected: { emoji: '❌', bg: 'bg-slate-600' },
        download: { emoji: '📥', bg: 'bg-sky-500' },
    };

    const downloadSelectedAsZip = async () => {
        if (!session) return;
        const selectedPhotos = photos.filter(p => getPhotoSelectionType(p.id) !== null);
        if (selectedPhotos.length === 0) {
            toast.error('No selected photos to download');
            return;
        }

        setIsDownloading(true);
        const toastId = toast.loading(`Preparing zip file for ${selectedPhotos.length} photos...`);

        try {
            const zip = new JSZip();
            
            // Download images in batches to avoid browser connection limits
            const BATCH_SIZE = 10;
            for (let i = 0; i < selectedPhotos.length; i += BATCH_SIZE) {
                const batch = selectedPhotos.slice(i, i + BATCH_SIZE);
                await Promise.all(batch.map(async (photo, bIndex) => {
                    const index = i + bIndex;
                    try {
                        // Fetch the full resolution image
                        const url = photo.cloudinaryUrl || photo.thumbnailUrl;
                        const response = await fetch(url);
                        const blob = await response.blob();
                        
                        // Determine file extension
                        let extension = 'jpg';
                        if (blob.type === 'image/png') extension = 'png';
                        else if (blob.type === 'image/webp') extension = 'webp';
                        
                        // Add to zip
                        const fileName = `photo_${index + 1}.${extension}`;
                        zip.file(fileName, blob);
                    } catch (error) {
                        console.error('Error fetching photo:', photo.id, error);
                    }
                }));
                
                // Update progress toast for every batch
                toast.loading(`Processing ${Math.min(i + BATCH_SIZE, selectedPhotos.length)} / ${selectedPhotos.length} photos...`, { id: toastId });
            }

            const content = await zip.generateAsync({ type: 'blob' });
            
            // Create download link
            const url = window.URL.createObjectURL(content);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${session.clientName || 'session'}_selected_photos.zip`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            toast.success('Download complete!', { id: toastId });
        } catch (error) {
            console.error('Error creating zip:', error);
            toast.error('Failed to create zip file', { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    if (loadingSession) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="text-center py-20">
                <p className="text-[var(--text-secondary)]">Session not found.</p>
                <Link to="/studio/photo-sessions" className="text-[var(--accent-primary)] text-sm mt-2 inline-block">← Back to sessions</Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/studio/photo-sessions"
                    className="p-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl font-bold text-[var(--text-primary)] truncate">{session.clientName}</h1>
                        {selections.some(s => s.isSubmitted) && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider">
                                Client Submitted
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-[var(--text-tertiary)] capitalize">{session.eventType} · {session.totalPhotos} photos uploaded</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        id="session-settings-btn"
                        onClick={() => setShowSettings(true)}
                        className="p-2 rounded-xl border border-[var(--border-light)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                        title="Session settings"
                    >
                        <Settings size={18} />
                    </button>
                    <button
                        id="session-lock-btn"
                        onClick={() => toggleLock(session.id, !session.isLocked)}
                        title={session.isLocked ? 'Unlock' : 'Lock selection'}
                        className={`p-2 rounded-xl border transition-colors ${session.isLocked ? 'border-amber-400/50 bg-amber-500/10 text-amber-400' : 'border-[var(--border-light)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'}`}
                    >
                        {session.isLocked ? <Unlock size={18} /> : <Lock size={18} />}
                    </button>
                </div>
            </div>

            {/* Share card */}
            <div className="bg-gradient-to-br from-[var(--accent-primary)]/10 to-violet-500/10 border border-[var(--accent-primary)]/30 rounded-2xl p-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Client Selection Link</p>
                        <div className="flex items-center gap-2">
                            <code className="text-[var(--accent-primary)] font-bold text-lg tracking-widest">{session.accessCode}</code>
                            <span className="text-[var(--text-tertiary)] text-sm truncate hidden sm:block">
                                · {window.location.origin}/select/{session.accessCode}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            id="copy-session-link-btn"
                            onClick={copySelectionLink}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-base)] border border-[var(--border-light)] text-[var(--text-primary)] text-sm font-medium rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                        >
                            <Copy size={16} /> Copy Link
                        </button>
                        <button
                            id="whatsapp-session-btn"
                            onClick={whatsappShare}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                        >
                            <ExternalLink size={16} /> WhatsApp
                        </button>
                    </div>
                </div>
            </div>

            {/* Upload zone */}
            <div
                className="border-2 border-dashed border-[var(--border-light)] hover:border-[var(--accent-primary)]/50 rounded-2xl p-8 text-center cursor-pointer transition-all bg-[var(--surface-base)] group"
                onClick={() => fileInputRef.current?.click()}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    id="photo-upload-input"
                />
                {uploading ? (
                    <div className="space-y-3">
                        <div className="w-16 h-16 mx-auto border-4 border-[var(--accent-primary)]/20 border-t-[var(--accent-primary)] rounded-full animate-spin" />
                        <p className="text-[var(--text-primary)] font-semibold">Uploading… {uploadProgress}%</p>
                        <div className="w-48 h-2 bg-[var(--bg-secondary)] rounded-full mx-auto overflow-hidden">
                            <div
                                className="h-full bg-[var(--accent-primary)] rounded-full transition-all"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--accent-primary)]/10 group-hover:bg-[var(--accent-primary)]/20 flex items-center justify-center transition-colors">
                            <Upload size={28} className="text-[var(--accent-primary)]" />
                        </div>
                        <p className="font-semibold text-[var(--text-primary)]">Drop photos here or click to upload</p>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">JPEG, PNG, WEBP · Max 500 photos per session</p>
                    </>
                )}
            </div>

            {/* Photo grid header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] p-1 rounded-xl">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filter === 'all' ? 'bg-[var(--surface-base)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        All ({photos.length})
                    </button>
                    <button
                        onClick={() => setFilter('selected')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${filter === 'selected' ? 'bg-[var(--accent-primary)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    >
                        Selected ({photos.filter(p => getPhotoSelectionType(p.id) !== null).length})
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    {filter === 'selected' && photos.some(p => getPhotoSelectionType(p.id) !== null) && (
                        <button
                            onClick={downloadSelectedAsZip}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-1.5 bg-[var(--accent-primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity"
                        >
                            {isDownloading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    <span>Zipping...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={16} />
                                    <span>Download ZIP</span>
                                </>
                            )}
                        </button>
                    )}
                    <button
                        id="refresh-photos-btn"
                        onClick={refreshPhotos}
                        disabled={loadingPhotos}
                        className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors bg-[var(--bg-secondary)] rounded-xl"
                    >
                        <RefreshCw size={18} className={loadingPhotos ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {photos.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--bg-secondary)]">
                    <ImageIcon size={40} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-40" />
                    <p className="text-[var(--text-secondary)]">No photos uploaded yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    {(filter === 'all' ? photos : photos.filter(p => getPhotoSelectionType(p.id) !== null)).map((photo, i) => {
                        const selType = getPhotoSelectionType(photo.id);
                        const badge = selType ? TYPE_BADGE[selType] : null;

                        return (
                        <div key={photo.id} className={`relative aspect-square rounded-lg overflow-hidden bg-[var(--bg-secondary)] group ${selType ? 'ring-2 ring-[var(--accent-primary)] shadow-md' : ''}`}>
                            <img
                                src={photo.thumbnailUrl}
                                alt={`Photo ${i + 1}`}
                                className={`w-full h-full object-cover ${selType === 'rejected' ? 'opacity-50' : ''}`}
                                loading="lazy"
                            />
                            {badge && (
                                <div className={`absolute top-1.5 right-1.5 w-6 h-6 ${badge.bg} rounded-full flex items-center justify-center text-xs shadow-lg z-10`}>
                                    {badge.emoji}
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center z-0">
                                <span className="text-white text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">#{i + 1}</span>
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}

            {/* Settings modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">Session Settings</h2>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                                <Calendar size={14} /> Selection Deadline
                            </label>
                            <input
                                id="session-deadline-input"
                                type="datetime-local"
                                value={deadline}
                                onChange={e => setDeadline(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[var(--text-secondary)]">Max Selections (leave blank for unlimited)</label>
                            <input
                                id="session-max-selections-input"
                                type="number"
                                value={maxSel}
                                onChange={e => setMaxSel(e.target.value)}
                                placeholder="e.g. 100"
                                min="1"
                                max="500"
                                className="w-full px-3 py-2.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                            />
                        </div>

                        <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-2">
                            <p className="text-sm font-semibold text-red-400">Danger Zone</p>
                            <button
                                id="delete-session-settings-btn"
                                onClick={async () => {
                                    if (!window.confirm('Delete this entire session and all photos? This cannot be undone.')) return;
                                    await deleteSession(session.id);
                                    window.history.back();
                                }}
                                className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 text-sm font-medium rounded-xl transition-colors"
                            >
                                <Trash2 size={14} /> Delete Session
                            </button>
                        </div>

                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => setShowSettings(false)}
                                className="flex-1 py-2.5 border border-[var(--border-light)] text-[var(--text-secondary)] text-sm font-medium rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                id="save-session-settings-btn"
                                onClick={handleSaveSettings}
                                className="flex-1 py-2.5 bg-[var(--accent-primary)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-all"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PhotoSessionManager;
