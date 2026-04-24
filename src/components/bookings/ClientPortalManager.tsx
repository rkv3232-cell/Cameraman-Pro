import { useState } from 'react';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Booking, ClientPortalImage } from '../../types';
import toast from 'react-hot-toast';
import { Share2, Link, RefreshCcw, Lock, Image as ImageIcon, CheckCircle2, Copy } from 'lucide-react';
import { Button } from '../ui/button';
import { sendWhatsAppMessage } from '../../utils/whatsapp';

interface Props {
    booking: Booking;
}

export const ClientPortalManager = ({ booking }: Props) => {
    const [loading, setLoading] = useState(false);
    const [newUrls, setNewUrls] = useState('');
    const [galleryLinkInput, setGalleryLinkInput] = useState(booking.clientPortal?.galleryLink || '');
    const [paymentLinkInput, setPaymentLinkInput] = useState(booking.clientPortal?.paymentLink || '');

    const portal = booking.clientPortal;
    const isActive = !!portal?.pin;

    const generatePin = async () => {
        setLoading(true);
        try {
            const pin = Math.floor(100000 + Math.random() * 900000).toString();
            await updateDoc(doc(db, 'bookings', booking.id), {
                'clientPortal.pin': pin,
                'clientPortal.status': 'active'
            });
            toast.success("Client PIN generated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to generate PIN");
        } finally {
            setLoading(false);
        }
    };

    const updateLinks = async () => {
        setLoading(true);
        try {
            await updateDoc(doc(db, 'bookings', booking.id), {
                'clientPortal.galleryLink': galleryLinkInput,
                'clientPortal.paymentLink': paymentLinkInput
            });
            toast.success("Links updated successfully");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update links");
        } finally {
            setLoading(false);
        }
    };

    const handleAddImages = async () => {
        if (!newUrls.trim()) return;

        const urls = newUrls.split('\n').filter(url => url.trim() !== '');
        if (urls.length === 0) return;

        const newImages: ClientPortalImage[] = urls.map(url => ({
            id: crypto.randomUUID(),
            url: url.trim(),
            isSelected: false
        }));

        const existingImages = portal?.selectionImages || [];
        const merged = [...existingImages, ...newImages];

        setLoading(true);
        try {
            await updateDoc(doc(db, 'bookings', booking.id), {
                'clientPortal.selectionImages': merged,
                'clientPortal.status': 'active' // reset status if new images added
            });
            setNewUrls('');
            toast.success(`${newImages.length} images added for selection`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add images");
        } finally {
            setLoading(false);
        }
    };

    const clearSelections = async () => {
        if (!confirm("Are you sure you want to delete all selection images?")) return;

        setLoading(true);
        try {
            await updateDoc(doc(db, 'bookings', booking.id), {
                'clientPortal.selectionImages': [],
                'clientPortal.status': 'active'
            });
            toast.success("Selection images cleared");
        } catch (error) {
            console.error(error);
            toast.error("Failed to clear images");
        } finally {
            setLoading(false);
        }
    };

    const shareToWhatsApp = () => {
        if (!portal?.pin) return;
        const portalUrl = `${window.location.origin}/client/login`;
        const msg = `Hello ${booking.clientName}! 👋\n\nYour Cameraman Pro VIP Portal is ready.\n\nYou can now view your album selections, download full galleries, and track your invoices directly from our portal.\n\n🔗 *Portal Link:* ${portalUrl}\n🔑 *Booking ID / Phone:* ${booking.clientPhone}\n🔒 *Secure PIN:* ${portal.pin}\n\nPlease login to proceed with your album selections!`;
        sendWhatsAppMessage(booking.clientPhone, msg);
    };

    const copyPin = () => {
        if (portal?.pin) {
            navigator.clipboard.writeText(portal.pin);
            toast.success("PIN copied to clipboard");
        }
    };

    return (
        <div className="bg-[var(--surface-base)] p-6 rounded-xl border border-[var(--border-light)] shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2 text-[var(--text-primary)]">
                        <Share2 size={20} className="text-[var(--accent-primary)]" />
                        Client Portal Management
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Control what the client sees (Invoices, Galleries, Album Selection)
                    </p>
                </div>

                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${portal?.status === 'selections_submitted'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                    : isActive
                        ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                        : 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20'
                    }`}>
                    {portal?.status ? portal.status.replace('_', ' ') : 'Inactive'}
                </div>
            </div>

            {/* Access Controls */}
            <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-light)]">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <Lock size={16} /> Portal Access
                </h3>

                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 flex items-center gap-2 bg-[var(--surface-base)] rounded-lg p-3 border border-[var(--border-light)] shadow-inner">
                        <span className="text-sm text-[var(--text-secondary)] whitespace-nowrap">Access PIN:</span>
                        <span className="font-mono text-lg font-bold tracking-widest text-[var(--text-primary)]">
                            {portal?.pin || '------'}
                        </span>
                        <button
                            onClick={copyPin}
                            disabled={!portal?.pin}
                            className="ml-auto p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded shadow-sm disabled:opacity-30"
                            title="Copy PIN"
                        >
                            <Copy size={14} />
                        </button>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            onClick={generatePin}
                            isLoading={loading}
                            className="flex items-center gap-2 bg-[var(--surface-base)] text-[var(--text-primary)] border-[var(--border-light)] hover:bg-[var(--surface-hover)]"
                        >
                            <RefreshCcw size={16} className={portal?.pin ? "text-[var(--text-secondary)]" : "text-emerald-500"} />
                            {portal?.pin ? "Reset PIN" : "Generate PIN"}
                        </Button>
                        <Button
                            onClick={shareToWhatsApp}
                            disabled={!portal?.pin}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white border-transparent"
                        >
                            Share <span className="hidden sm:inline">WhatsApp</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Links Config */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Link size={16} /> External Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Full Gallery Drop Link (Drive/Cloudinary)</label>
                        <input
                            type="url"
                            value={galleryLinkInput}
                            onChange={(e) => setGalleryLinkInput(e.target.value)}
                            className="w-full text-sm rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] p-2 focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none"
                            placeholder="https://drive.google.com/..."
                        />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-secondary)] font-medium mb-1 block">Payment Link (UPI/Razorpay/PhonePe)</label>
                        <input
                            type="url"
                            value={paymentLinkInput}
                            onChange={(e) => setPaymentLinkInput(e.target.value)}
                            className="w-full text-sm rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] p-2 focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none"
                            placeholder="upi://pay?pa=..."
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={updateLinks} isLoading={loading}>
                        Save Links
                    </Button>
                </div>
            </div>

            {/* Album Selection Config */}
            <div className="border-t border-[var(--border-light)] pt-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <ImageIcon size={16} /> Photo Selection Hub
                    </h3>
                    {portal?.selectionImages && portal.selectionImages.length > 0 && (
                        <span className="text-xs bg-[var(--surface-hover)] text-[var(--text-secondary)] px-2 py-1 rounded border border-[var(--border-light)] font-mono">
                            {portal.selectionImages.length} images
                        </span>
                    )}
                </div>

                {portal?.status === 'selections_submitted' && portal?.selectedCount && (
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                        <div>
                            <p className="font-bold text-emerald-800 dark:text-emerald-400">Client has finalized selections!</p>
                            <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                                They selected <strong>{portal.selectedCount}</strong> out of {portal.selectionImages?.length} images.
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs text-[var(--text-secondary)] font-medium block">Add Images for Selection (Enter raw Image URLs, one per line)</label>
                    <textarea
                        value={newUrls}
                        onChange={(e) => setNewUrls(e.target.value)}
                        className="w-full h-24 text-xs rounded-lg border border-[var(--border-light)] bg-[var(--bg-secondary)] p-3 focus:ring-1 focus:ring-[var(--accent-primary)] focus:outline-none font-mono resize-none"
                        placeholder="https://imgur.com/...&#10;https://unsplash.com/..."
                        disabled={portal?.status === 'selections_submitted'}
                    />

                    <div className="flex gap-2 pt-2">
                        <Button
                            onClick={handleAddImages}
                            isLoading={loading}
                            disabled={!newUrls.trim() || portal?.status === 'selections_submitted'}
                            size="sm"
                        >
                            Push Images to Portal
                        </Button>
                        <Button
                            variant="danger"
                            onClick={clearSelections}
                            disabled={!portal?.selectionImages?.length || portal?.status === 'selections_submitted'}
                            size="sm"
                        >
                            Clear All
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
};
