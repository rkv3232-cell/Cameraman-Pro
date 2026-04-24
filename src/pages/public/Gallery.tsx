import { useContext, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { useGallery } from '../../hooks/useGallery';
import LanguageContext from '../../context/LanguageContext';
import { text } from '../../utils/text';

export const Gallery = () => {
    const { images, loading, error } = useGallery();
    const [filter, setFilter] = useState('All');
    const [lightboxImg, setLightboxImg] = useState<string | null>(null);
    const { lang } = useContext(LanguageContext);
    const categoryOptions = text.gallery.categories;

    const filtered = filter === 'All'
        ? images
        : images.filter(img => img.category === filter);

    if (loading) {
        return (
            <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-[var(--text-secondary)]">{text.gallery.loading[lang]}</p>
                    </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6">{text.gallery.title[lang]}</h1>
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400 max-w-md mx-auto">
                            <p className="font-medium">{text.gallery.errorTitle[lang]}</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-20 min-h-screen bg-[var(--bg-primary)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text-primary)] mb-6">{text.gallery.title[lang]}</h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
                        {text.gallery.description[lang]}
                    </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {categoryOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setFilter(option.value)}
                            className={`px-6 py-2 rounded-full font-medium transition-all ${filter === option.value
                                ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-primary)]/20'
                                : 'bg-[var(--surface-base)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] border border-[var(--border-light)]'
                                }`}
                        >
                            {option.label[lang]}
                        </button>
                    ))}
                </div>

                {/* Gallery Content */}
                {images.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--surface-base)]">
                        <p className="text-lg font-medium text-[var(--text-primary)]">{text.gallery.empty[lang]}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{text.gallery.emptyDescription[lang]}</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--surface-base)]">
                        <p className="text-lg font-medium text-[var(--text-primary)]">{text.gallery.emptyFilter[lang]}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{text.gallery.emptyFilterDesc[lang]}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {filtered.map((img) => (
                            <div
                                key={img.id}
                                onClick={() => setLightboxImg(img.imageUrl)}
                                className="group relative rounded-2xl overflow-hidden bg-[var(--surface-base)] cursor-zoom-in aspect-[4/3] focus:outline-none focus:ring-4 focus:ring-[var(--accent-primary)]/50"
                            >
                                <img
                                    src={img.imageUrl}
                                    alt={img.title}
                                    className="absolute w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <span className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white">
                                        <Maximize2 size={24} />
                                    </span>
                                </div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-semibold rounded-full uppercase tracking-wider">
                                        {img.category}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Lightbox */}
            {lightboxImg && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setLightboxImg(null)}
                >
                    <button
                        className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full"
                        onClick={() => setLightboxImg(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={lightboxImg}
                        className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl animate-fade-in"
                        alt="Zoomed"
                        onClick={(e) => e.stopPropagation()} // Prevent close when clicking image
                    />
                </div>
            )}
        </div>
    );
};
