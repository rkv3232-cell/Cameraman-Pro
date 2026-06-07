import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Grid3X3, LayoutList, Send, Lock, Camera, Info, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePhotoSelection } from '../../hooks/usePhotoSelection';
import { PhotoLightbox } from '../../components/selection/PhotoLightbox';
import { SelectionProgressBar } from '../../components/selection/SelectionProgressBar';
import { SelectionType, SessionPhoto } from '../../types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SELECTION_BUTTONS: {
    type: SelectionType;
    emoji: string;
    label: string;
    activeClass: string;
    ringClass: string;
}[] = [
    { type: 'favorite', emoji: '✅', label: 'Selected', activeClass: 'bg-emerald-500 text-white border-emerald-400', ringClass: 'ring-emerald-500/40' },
];

const TYPE_BADGE: Record<SelectionType, { emoji: string; bg: string }> = {
    favorite: { emoji: '✅', bg: 'bg-emerald-500' },
    album:    { emoji: '✅', bg: 'bg-emerald-500' },
    priority: { emoji: '✅', bg: 'bg-emerald-500' },
    rejected: { emoji: '✅', bg: 'bg-emerald-500' },
    download: { emoji: '✅', bg: 'bg-emerald-500' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const PhotoCard = ({
    photo, index, selType, onTap, onLongPress
}: {
    photo: SessionPhoto;
    index: number;
    selType: SelectionType | null;
    onTap: () => void;
    onLongPress: () => void;
}) => {


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.01 }}
            className={`
                relative rounded-xl overflow-hidden cursor-pointer
                transition-transform duration-200 active:scale-95 select-none
                ${selType
                    ? `border-2 border-transparent shadow-lg ring-2 ${
                        selType === 'favorite' ? 'ring-rose-500/60' :
                        selType === 'album'    ? 'ring-amber-500/60' :
                        selType === 'priority' ? 'ring-orange-500/60' :
                        selType === 'rejected' ? 'ring-slate-500/40 opacity-60' :
                        'ring-sky-500/60'
                      }`
                    : 'border-2 border-transparent hover:border-[var(--border-light)]'
                }
                bg-[var(--bg-secondary)] mb-2 break-inside-avoid
            `}
            onClick={onLongPress}
        >
            <img
                src={photo.thumbnailUrl}
                alt={`Photo ${index + 1}`}
                className="w-full object-cover rounded-lg"
                loading="lazy"
                draggable={false}
            />
            
            {/* Watermark Overlay */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-100 bg-[right_10px_bottom_10px] bg-no-repeat" 
                style={{ backgroundImage: `url('/logo.png')`, backgroundSize: '60px', zIndex: 1 }} 
            />

            {/* Premium Gradient Overlay on Hover/Selection */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 ${selType ? 'opacity-100' : 'hover:opacity-100'}`} />

            {/* Selection Checkbox Button */}
            <button
                onClick={(e) => { e.stopPropagation(); onTap(); }}
                className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all z-20 shadow-md ${
                    selType ? 'bg-emerald-500 border border-white/20 text-white' : 'bg-black/30 border-2 border-white/50 text-transparent hover:bg-black/50 hover:text-white/50'
                }`}
            >
                <CheckCircle2 size={18} className={selType ? 'text-white' : ''} />
            </button>

            {/* Index label */}
            <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur-md rounded-md text-white/90 text-[10px] font-mono font-medium border border-white/10">
                {index + 1}
            </div>

            {/* Rejected overlay */}
            {selType === 'rejected' && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
            )}
        </motion.div>
    );
};

// ─── Main SelectionPortal ─────────────────────────────────────────────────────

export const SelectionPortal = () => {
    const { accessCode } = useParams<{ accessCode: string }>();
    const {
        session, photos, loading, error,
        isLocked, isSubmitted,
        toggleSelection, saveProgress, submitSelections,
        getSelectedCount, getPhotoSelectionType
    } = usePhotoSelection(accessCode);

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [activeFilter, setActiveFilter] = useState<SelectionType | 'all'>('all');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showTip, setShowTip] = useState(true);

    // Auto-save every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => { saveProgress(); }, 30_000);
        return () => clearInterval(interval);
    }, [saveProgress]);

    // Dismiss tip after 5 seconds
    useEffect(() => {
        if (!loading && photos.length > 0) {
            const t = setTimeout(() => setShowTip(false), 5000);
            return () => clearTimeout(t);
        }
    }, [loading, photos.length]);

    // Compute counts for progress bar
    const countByType = {
        favorite: getSelectedCount('favorite'),
        album:    getSelectedCount('album'),
        priority: getSelectedCount('priority'),
        rejected: getSelectedCount('rejected'),
        download: getSelectedCount('download'),
    };
    const totalSelected = getSelectedCount();

    // Filter photos for the active filter tab
    const displayPhotos = activeFilter === 'all'
        ? photos
        : photos.filter(p => getPhotoSelectionType(p.id) === activeFilter);

    const deadlineDate = session?.deadlineAt
        ? (session.deadlineAt as any).toDate?.() ?? null
        : null;

    const handleTap = (photo: SessionPhoto) => {
        if (isLocked || isSubmitted) {
            return;
        }
        const cur = getPhotoSelectionType(photo.id);
        toggleSelection(photo.id, cur ? cur : 'favorite'); // Toggle favorite
    };

    const handleLongPress = (idx: number) => {
        setLightboxIndex(idx);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        const ok = await submitSelections();
        setSubmitting(false);
        if (ok) setShowSubmitModal(false);
    };

    // ── Loading ────────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center gap-4">
                <motion.div
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-500/40"
                >
                    <Camera size={32} className="text-white" />
                </motion.div>
                <div className="flex flex-col items-center gap-2 mt-4">
                    <div className="w-48 h-1 bg-[var(--border-light)] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide">Preparing your cinematic gallery…</p>
                </div>
            </div>
        );
    }

    // ── Error ──────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-6">
                <div className="max-w-sm w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto">
                        <Camera size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Gallery Not Found</h2>
                    <p className="text-[var(--text-secondary)] text-sm">{error}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">Access code: <code className="font-mono bg-[var(--bg-secondary)] px-2 py-1 rounded">{accessCode}</code></p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans">
            
            {/* Premium Header / Hero */}
            <div className="relative pt-8 pb-6 px-4 bg-gradient-to-b from-[var(--surface-base)] to-[var(--bg-primary)] border-b border-[var(--border-light)] z-10">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="space-y-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-2"
                        >
                            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-500 text-[10px] font-bold uppercase tracking-wider">
                                {session.eventType}
                            </span>
                            {isLocked && <span className="px-2.5 py-1 rounded-md bg-slate-500/10 text-slate-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Lock size={10} /> Locked</span>}
                            {isSubmitted && <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle2 size={10} /> Submitted</span>}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight"
                        >
                            {session.clientName}'s Gallery
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-sm text-[var(--text-tertiary)]"
                        >
                            {photos.length} beautifully captured moments
                        </motion.p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-end">
                        <div className="flex items-center bg-[var(--bg-secondary)] rounded-xl p-1 shadow-inner border border-[var(--border-light)]/50">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[var(--surface-base)] shadow-sm text-indigo-500' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                            >
                                <Grid3X3 size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[var(--surface-base)] shadow-sm text-indigo-500' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                            >
                                <LayoutList size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Progress Bar */}
            <div className="sticky top-0 z-20 shadow-sm">
                <SelectionProgressBar
                    totalPhotos={photos.length}
                    selectedCount={totalSelected}
                    deadlineAt={deadlineDate}
                    isLocked={isLocked}
                    isSubmitted={isSubmitted}
                    countByType={countByType}
                />
            </div>

            {/* Filter tabs - Scrollable */}
            {!isLocked && !isSubmitted && (
                <div className="px-4 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-[var(--border-light)] bg-[var(--surface-base)]/50 backdrop-blur-xl sticky top-1 z-10">
                    {([
                        { key: 'all', label: `All Photos`, count: photos.length },
                        { key: 'favorite', label: `Selected`, emoji: '✅', count: countByType.favorite + countByType.album + countByType.priority + countByType.download },
                    ] as {key: string, label: string, emoji?: string, count: number}[]).map(({ key, label, emoji, count }) => (
                        <button
                            key={key}
                            id={`filter-${key}`}
                            onClick={() => setActiveFilter(key as any)}
                            className={`
                                flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                                ${activeFilter === key
                                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 border border-transparent'
                                    : 'bg-[var(--surface-base)] border border-[var(--border-light)] text-[var(--text-secondary)] hover:border-indigo-500/30 hover:bg-indigo-500/5'
                                }
                            `}
                        >
                            {emoji && <span>{emoji}</span>}
                            <span>{label}</span>
                            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeFilter === key ? 'bg-white/20' : 'bg-[var(--bg-secondary)]'}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Interaction tip */}
            <AnimatePresence>
                {showTip && !isLocked && !isSubmitted && photos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mx-4 mt-4 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 text-indigo-500 text-sm cursor-pointer shadow-sm"
                        onClick={() => setShowTip(false)}
                    >
                        <Info size={18} className="flex-shrink-0 mt-0.5" />
                        <span className="leading-tight font-medium">
                            <strong>Tap</strong> a photo to open · Click the <strong>check mark</strong> to select.
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main gallery */}
            <main className="flex-1 px-3 sm:px-4 py-6 pb-32 max-w-screen-2xl mx-auto w-full">
                {photos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
                        <div className="w-24 h-24 rounded-full bg-[var(--surface-base)] shadow-inner border border-[var(--border-light)] flex items-center justify-center">
                            <Camera size={40} className="text-[var(--text-tertiary)] opacity-30" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mt-4">No photos yet</h3>
                        <p className="text-[var(--text-secondary)]">The studio is preparing your gallery. Check back soon!</p>
                    </div>
                ) : displayPhotos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
                        <div className="text-4xl mb-2">🔍</div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">No photos found</h3>
                        <p className="text-[var(--text-secondary)]">You haven't selected any photos for this category.</p>
                        <button
                            onClick={() => setActiveFilter('all')}
                            className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-500 rounded-xl font-medium hover:bg-indigo-500/20 transition-colors"
                        >
                            View All Photos
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 gap-2 space-y-2">
                        {displayPhotos.map((photo) => {
                            const globalIdx = photos.findIndex(p => p.id === photo.id);
                            return (
                                <PhotoCard
                                    key={photo.id}
                                    photo={photo}
                                    index={globalIdx}
                                    selType={getPhotoSelectionType(photo.id)}
                                    onTap={() => handleTap(photo)}
                                    onLongPress={() => handleLongPress(globalIdx)}
                                />
                            );
                        })}
                    </div>
                ) : (
                    /* List view - Premium styled */
                    <div className="space-y-3 max-w-3xl mx-auto">
                        {displayPhotos.map((photo) => {
                            const globalIdx = photos.findIndex(p => p.id === photo.id);
                            const selType = getPhotoSelectionType(photo.id);
                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    key={photo.id}
                                    className={`flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-2xl border transition-all ${
                                        selType
                                            ? 'border-indigo-500/30 bg-indigo-500/5 shadow-sm'
                                            : 'border-[var(--border-light)] bg-[var(--surface-base)] hover:border-indigo-500/20'
                                    }`}
                                >
                                    <div
                                        className="w-full sm:w-32 h-48 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative group"
                                        onClick={() => setLightboxIndex(globalIdx)}
                                    >
                                        <img src={photo.thumbnailUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                                        
                                        {/* Watermark Overlay */}
                                        <div 
                                            className="absolute inset-0 pointer-events-none opacity-100 bg-[right_8px_bottom_8px] bg-no-repeat" 
                                            style={{ backgroundImage: `url('/logo.png')`, backgroundSize: '50px', zIndex: 1 }} 
                                        />

                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                            <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-md backdrop-blur-md">View Full</span>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-base font-bold text-[var(--text-primary)]">IMG_{photo.id.substring(0,6).toUpperCase()}</p>
                                                <span className="text-xs font-mono bg-[var(--bg-secondary)] px-2 py-0.5 rounded text-[var(--text-tertiary)]">#{globalIdx + 1}</span>
                                            </div>
                                            {selType && (
                                                <div className="mt-1 flex items-center gap-1.5">
                                                    <span className={`w-2 h-2 rounded-full ${TYPE_BADGE[selType].bg}`}></span>
                                                    <span className="text-sm text-[var(--text-secondary)] capitalize font-medium">
                                                        {selType}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {!isLocked && !isSubmitted && (
                                            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
                                                {SELECTION_BUTTONS.map(({ type, emoji, activeClass }) => (
                                                    <button
                                                        key={type}
                                                        id={`list-sel-${type}-${photo.id}`}
                                                        onClick={() => toggleSelection(photo.id, type)}
                                                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all active:scale-95 flex items-center gap-1 ${
                                                            selType === type ? activeClass + ' shadow-md' : 'border-[var(--border-light)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                                        }`}
                                                    >
                                                        <span>{emoji}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Floating bottom action bar - Glassmorphism */}
            {!isSubmitted && !isLocked && photos.length > 0 && (
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-30 safe-area-bottom pointer-events-none"
                >
                    <div className="max-w-2xl mx-auto flex items-center justify-between gap-3 bg-[var(--surface-base)]/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 p-3 rounded-2xl shadow-2xl shadow-black/10 pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <span className="text-indigo-500 font-bold text-lg">{totalSelected}</span>
                            </div>
                            <div className="text-sm text-[var(--text-secondary)] hidden sm:block">
                                Photos<br/><span className="text-xs">Selected</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                id="save-progress-btn"
                                onClick={saveProgress}
                                className="px-5 py-3 bg-[var(--bg-secondary)] border border-[var(--border-light)] text-[var(--text-primary)] text-sm font-bold rounded-xl hover:bg-[var(--surface-hover)] transition-all active:scale-95"
                            >
                                Save Draft
                            </button>
                            <button
                                id="submit-selections-btn"
                                onClick={() => setShowSubmitModal(true)}
                                disabled={totalSelected === 0}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-bold rounded-xl disabled:opacity-40 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                            >
                                <Send size={18} className="fill-white/20" /> Submit Gallery
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Submitted banner */}
            {isSubmitted && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-emerald-500 px-4 py-4 text-center text-white font-semibold safe-area-bottom shadow-xl">
                    ✅ Your {totalSelected} photos have been successfully submitted to the studio!
                </div>
            )}

            {/* Locked banner */}
            {isLocked && !isSubmitted && (
                <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-800/95 backdrop-blur-md px-4 py-4 flex items-center justify-center gap-2 text-slate-200 font-medium safe-area-bottom shadow-xl border-t border-slate-700">
                    <Lock size={18} /> This gallery is currently locked by the studio
                </div>
            )}

            {/* Lightbox */}
            {lightboxIndex !== null && (
                <PhotoLightbox
                    photos={photos}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                    getSelectionType={getPhotoSelectionType}
                    onSelect={(photoId, type) => toggleSelection(photoId, type)}
                    isLocked={isLocked || isSubmitted}
                />
            )}

            {/* Submit confirmation modal */}
            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    >
                        <motion.div 
                            initial={{ y: 100, scale: 0.9 }}
                            animate={{ y: 0, scale: 1 }}
                            exit={{ y: 100, scale: 0.9 }}
                            className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6"
                        >
                            <div className="text-center space-y-3">
                                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                                    <span className="text-4xl">✨</span>
                                </div>
                                <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Ready to submit?</h2>
                                <p className="text-[var(--text-secondary)] text-sm px-4">
                                    You're about to finalize <strong className="text-[var(--text-primary)]">{totalSelected} photos</strong>. 
                                    Once submitted, the studio will begin processing them.
                                </p>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 bg-[var(--bg-secondary)] p-3 rounded-2xl border border-[var(--border-light)]">
                                {SELECTION_BUTTONS.map(({ type, emoji, label }) =>
                                    countByType[type] > 0 ? (
                                        <div key={type} className="text-center p-2 rounded-xl bg-[var(--surface-base)] shadow-sm border border-[var(--border-light)]/50 flex flex-col items-center justify-center">
                                            <div className="text-2xl mb-1">{emoji}</div>
                                            <div className="text-sm font-extrabold text-[var(--text-primary)]">{countByType[type]}</div>
                                            <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold mt-0.5">{label}</div>
                                        </div>
                                    ) : null
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowSubmitModal(false)}
                                    disabled={submitting}
                                    className="flex-1 py-3.5 border-2 border-[var(--border-light)] text-[var(--text-secondary)] font-bold rounded-2xl hover:bg-[var(--surface-hover)] transition-colors active:scale-95"
                                >
                                    Review Again
                                </button>
                                <button
                                    id="confirm-submit-btn"
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="flex-1 py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold rounded-2xl disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95"
                                >
                                    {submitting ? 'Submitting…' : 'Confirm Submission'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SelectionPortal;
