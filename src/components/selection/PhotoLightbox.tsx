import { useEffect, useCallback, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Star, ZoomIn, ZoomOut, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SessionPhoto, SelectionType } from '../../types';

interface PhotoLightboxProps {
    photos: SessionPhoto[];
    initialIndex: number;
    onClose: () => void;
    getSelectionType: (photoId: string) => SelectionType | null;
    onSelect: (photoId: string, type: SelectionType) => void;
    isLocked: boolean;
}

const SELECTION_BUTTONS: { type: SelectionType; icon: React.ElementType; label: string; color: string; bg: string }[] = [
    { type: 'favorite', icon: Check,     label: 'Selected', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/50 hover:bg-emerald-500/40' },
];

const TYPE_ACTIVE: Record<SelectionType, string> = {
    favorite: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40',
    album:    'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40',
    priority: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40',
    rejected: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40',
    download: 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/40',
};

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
        scale: 1
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0,
        scale: 0.95
    })
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
};

export const PhotoLightbox = ({
    photos, initialIndex, onClose, getSelectionType, onSelect, isLocked
}: PhotoLightboxProps) => {
    const [[page, direction], setPage] = useState([initialIndex, 0]);
    const [zoom, setZoom] = useState(1);
    const [imgLoaded, setImgLoaded] = useState(false);
    
    // page index needs to be wrapped if it goes out of bounds, but we bound it below anyway.
    const idx = Math.max(0, Math.min(photos.length - 1, page));
    const photo = photos[idx];
    const currentType = photo ? getSelectionType(photo.id) : null;

    const paginate = useCallback((newDirection: number) => {
        if (page + newDirection < 0 || page + newDirection >= photos.length) return;
        setPage([page + newDirection, newDirection]);
        setZoom(1);
        setImgLoaded(false);
    }, [page, photos.length]);

    // ── Keyboard navigation ───────────────────────────────────────────────────
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') paginate(-1);
            else if (e.key === 'ArrowRight') paginate(1);
            else if (e.key === 'Escape') onClose();
            else if (e.key === '+' || e.key === '=') setZoom(z => Math.min(3, z + 0.5));
            else if (e.key === '-') setZoom(z => Math.max(1, z - 0.5));
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [paginate, onClose]);

    if (!photo) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col font-sans"
        >
            {/* Top bar */}
            <motion.div 
                initial={{ y: -50 }}
                animate={{ y: 0 }}
                className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0 bg-gradient-to-b from-black/80 to-transparent z-20"
            >
                <div className="flex items-center gap-3">
                    <span className="text-white/80 font-semibold tracking-wider text-sm bg-white/10 px-3 py-1 rounded-lg backdrop-blur-md">
                        {idx + 1} / {photos.length}
                    </span>
                    {photo.aiScore && photo.aiScore > 85 && (
                        <span className="hidden sm:flex items-center gap-1 text-yellow-400 text-xs font-bold bg-yellow-400/10 px-2 py-1 rounded-md border border-yellow-400/20">
                            <Star size={12} className="fill-yellow-400" /> Best Shot
                        </span>
                    )}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setZoom(z => Math.max(1, z - 0.5))}
                        disabled={zoom <= 1}
                        className="p-2.5 text-white/60 hover:text-white disabled:opacity-30 transition-colors rounded-full hover:bg-white/10"
                        aria-label="Zoom out"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-white/60 text-xs w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(z => Math.min(3, z + 0.5))}
                        disabled={zoom >= 3}
                        className="p-2.5 text-white/60 hover:text-white disabled:opacity-30 transition-colors rounded-full hover:bg-white/10"
                        aria-label="Zoom in"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-2 hidden sm:block"></div>
                    <button
                        onClick={onClose}
                        className="p-2.5 ml-1 text-white hover:text-white bg-white/10 hover:bg-white/25 rounded-full transition-all backdrop-blur-md border border-white/10"
                        aria-label="Close lightbox"
                    >
                        <X size={24} />
                    </button>
                </div>
            </motion.div>

            {/* Main image area */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden min-h-0 touch-none">
                {/* Prev button */}
                <button
                    onClick={() => paginate(-1)}
                    disabled={idx === 0}
                    className="absolute left-4 sm:left-8 z-20 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white disabled:opacity-0 transition-all backdrop-blur-md border border-white/10"
                    aria-label="Previous photo"
                >
                    <ChevronLeft size={28} />
                </button>

                {/* Image */}
                <div
                    className="w-full h-full flex items-center justify-center relative overflow-hidden"
                    style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
                >
                    {/* Image Loading State */}
                    {!imgLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <div className="w-12 h-12 border-4 border-white/10 border-t-indigo-500 rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                        </div>
                    )}
                    
                    <AnimatePresence initial={false} custom={direction}>
                        <motion.div
                            key={page}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            className="relative flex items-center justify-center"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                        >
                            {/* Watermark Overlay - Now relative to image container */}
                            <div 
                                className="absolute bottom-4 right-4 pointer-events-none opacity-100 z-20 bg-no-repeat bg-center bg-contain" 
                                style={{ backgroundImage: `url('/logo.png')`, width: '80px', height: '80px' }} 
                            />

                            <motion.img
                                src={photo.cloudinaryUrl}
                                drag={zoom === 1 ? "x" : false}
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={1}
                                onDragEnd={(_, { offset, velocity }) => {
                                    const swipe = swipePower(offset.x, velocity.x);
                                    if (swipe < -swipeConfidenceThreshold) {
                                        paginate(1);
                                    } else if (swipe > swipeConfidenceThreshold) {
                                        paginate(-1);
                                    }
                                }}
                                onLoad={() => setImgLoaded(true)}
                                className="max-w-full max-h-[85vh] object-contain select-none shadow-2xl rounded-sm"
                                style={{
                                    transform: `scale(${zoom})`,
                                    opacity: imgLoaded ? 1 : 0,
                                    transition: zoom > 1 ? 'transform 0.2s ease' : 'none'
                                }}
                                draggable={false}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Next button */}
                <button
                    onClick={() => paginate(1)}
                    disabled={idx === photos.length - 1}
                    className="absolute right-4 sm:right-8 z-20 p-3 sm:p-4 rounded-full bg-black/40 hover:bg-black/80 text-white disabled:opacity-0 transition-all backdrop-blur-md border border-white/10"
                    aria-label="Next photo"
                >
                    <ChevronRight size={28} />
                </button>

                {/* Current selection badge */}
                <AnimatePresence>
                    {currentType && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-6 left-6 px-4 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/20 text-white text-sm font-bold capitalize flex items-center gap-2 z-20 shadow-2xl"
                        >
                            <span className="text-lg">
                                ✅
                            </span>
                            Selected
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom selection bar */}
            {!isLocked && (
                <motion.div 
                    initial={{ y: 50 }}
                    animate={{ y: 0 }}
                    className="flex-shrink-0 bg-gradient-to-t from-black/90 to-black/60 backdrop-blur-xl border-t border-white/10 px-2 sm:px-4 py-4 sm:py-6 z-20"
                >
                    <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap max-w-2xl mx-auto">
                        {SELECTION_BUTTONS.map(({ type, icon: Icon, label, bg }) => {
                            const isActive = currentType === type;
                            return (
                                <button
                                    key={type}
                                    id={`lightbox-select-${type}`}
                                    onClick={() => onSelect(photo.id, type)}
                                    className={`
                                        flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border text-xs sm:text-sm font-bold
                                        transition-all duration-200 active:scale-90
                                        ${isActive ? TYPE_ACTIVE[type] : bg + ' border-white/10 text-white/70 hover:text-white'}
                                    `}
                                >
                                    <Icon size={18} className={isActive ? 'text-white' : ''} />
                                    <span className="tracking-wide">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
};
