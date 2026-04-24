import { useState, useRef } from 'react';
import { useGallery } from '../hooks/useGallery';
import { GalleryCategory, GalleryImage } from '../types';
import { Upload, X, Image as ImageIcon, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

const CATEGORY_OPTIONS: GalleryCategory[] = ["Wedding", "Pre-Wedding", "Drone", "Cinematic"];

export const GalleryAdmin = () => {
    const { images, loading, error, uploadImage, removeImage, updateImage } = useGallery();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState<GalleryCategory>('Wedding');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit Modal State
    const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editCategory, setEditCategory] = useState<GalleryCategory>('Wedding');
    const [savingEdit, setSavingEdit] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);

            if (!title) {
                // Remove extension
                setTitle(file.name.replace(/\.[^/.]+$/, ""));
            }
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !title) return;

        setUploading(true);
        try {
            await uploadImage(selectedFile, category, title);
            setPreviewUrl(null);
            setSelectedFile(null);
            setTitle('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this image? This will remove it from the public website instantly.")) {
            removeImage(id);
        }
    };

    const handleEditOpen = (img: GalleryImage) => {
        setEditingImage(img);
        setEditTitle(img.title);
        setEditCategory(img.category);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingImage) return;
        setSavingEdit(true);
        try {
            await updateImage(editingImage.id, editTitle, editCategory);
            setEditingImage(null);
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="inline-flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-[var(--text-secondary)]">Loading your gallery...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10">
            <header>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Studio Gallery Control</h1>
                <p className="text-[var(--text-secondary)] mt-1">
                    Manage images displayed on your public website's Digital Showroom
                </p>
            </header>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                    <p className="font-medium">⚠️ Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Form */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleUpload} className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm sticky top-24">
                        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                            <Upload className="text-[var(--accent-primary)]" />
                            Add New Photo
                        </h2>

                        <div className="space-y-4">
                            {/* File Picker */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer
                                    ${previewUrl
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5'
                                        : 'border-[var(--border-light)] hover:border-[var(--border-medium)] hover:bg-[var(--surface-hover)]'
                                    }`}
                                onClick={() => !uploading && fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    disabled={uploading}
                                />

                                {previewUrl ? (
                                    <div className="relative group">
                                        <img src={previewUrl} alt="Preview" className="mx-auto max-h-48 rounded object-contain" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                            <span className="text-white text-sm font-medium">Click to Change</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-4 text-[var(--text-secondary)]">
                                        <ImageIcon size={40} className="mx-auto mb-3 text-[var(--text-tertiary)] opacity-50" />
                                        <p className="font-medium text-sm">Click to select an image</p>
                                        <p className="text-xs mt-1">JPEG, PNG up to 10MB</p>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Image Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Haldi Ceremony Joy"
                                    required
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                />
                            </div>

                            {/* Category */}
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as GalleryCategory)}
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 mt-4"
                                isLoading={uploading}
                                disabled={!selectedFile || !title}
                            >
                                <Plus size={18} className="mr-2" />
                                {uploading ? 'Uploading to Cloudinary...' : 'Upload to Gallery'}
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Gallery Grid */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-light)]">
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Live Gallery Images</h2>
                        <span className="text-sm font-mono bg-[var(--bg-secondary)] text-[var(--text-secondary)] px-3 py-1 rounded-full border border-[var(--border-light)]">
                            {images.length} Media
                        </span>
                    </div>

                    {images.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-[var(--border-light)] rounded-2xl bg-[var(--surface-base)] text-[var(--text-tertiary)]">
                            <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium text-[var(--text-primary)]">Your public gallery is empty</p>
                            <p className="text-sm mt-1">Upload high-quality images to attract more leads.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map(img => (
                                <div key={img.id} className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border-light)] shadow-sm">
                                    <img
                                        src={img.imageUrl}
                                        alt={img.title}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                                        <h3 className="text-white font-semibold text-sm truncate">{img.title}</h3>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded backdrop-blur-md">
                                                {img.category}
                                            </span>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditOpen(img)}
                                                    className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors shadow-lg"
                                                    title="Edit Details"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(img.id)}
                                                    className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-lg"
                                                    title="Delete Image"
                                                >
                                                    <X size={14} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editingImage && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingImage(null)}></div>
                    <form
                        onSubmit={handleUpdate}
                        className="relative w-full max-w-md bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-8 shadow-2xl animate-scale-in z-[10]"
                    >
                        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Edit Image Details</h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            Update the Firestore metadata that powers your public gallery.
                        </p>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Image Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    required
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-[var(--text-secondary)]">Category</label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value as GalleryCategory)}
                                    className="w-full h-11 rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] px-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]"
                                >
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt} value={opt}>
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-6">
                            <Button type="submit" className="flex-1" isLoading={savingEdit}>
                                Save Changes
                            </Button>
                            <Button
                                type="button"
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setEditingImage(null)}
                            >
                                Cancel
                            </Button>
                        </div>

                        <div className="mt-4 border-t border-[var(--border-light)] pt-4">
                            <p className="text-xs text-[var(--text-secondary)] mb-2">
                                Delete this entry to remove the image from the public gallery. The
                                file will remain in Cloudinary until you delete it there.
                            </p>
                            <Button
                                type="button"
                                className="w-full bg-red-600 hover:bg-red-700"
                                onClick={() => {
                                    if (editingImage) {
                                        handleDelete(editingImage.id);
                                        setEditingImage(null);
                                    }
                                }}
                            >
                                Delete Image
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};
