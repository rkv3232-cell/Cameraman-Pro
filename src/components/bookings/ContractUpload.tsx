import { useRef, useState } from "react";
import {
    ref, uploadBytesResumable, getDownloadURL, deleteObject,
} from "firebase/storage";
import { storage } from "../../lib/firebase";
import { Paperclip, Upload, FileText, Image, ExternalLink, Trash2, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ContractFile {
    name: string;
    url: string;
    storagePath: string;  // for deletion
    type: "pdf" | "image" | "other";
    uploadedAt: string;  // ISO
    sizeKb: number;
}

interface ContractUploadProps {
    bookingId: string;
    studioId: string;
    contracts: ContractFile[];
    /** Called when the list changes (add or remove) */
    onChange: (files: ContractFile[]) => Promise<void>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const detectType = (filename: string): ContractFile["type"] => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "webp", "gif", "heic"].includes(ext)) return "image";
    return "other";
};

const FileIcon = ({ type }: { type: ContractFile["type"] }) => {
    if (type === "pdf") return <FileText size={16} className="text-red-500 shrink-0" />;
    if (type === "image") return <Image size={16} className="text-blue-500 shrink-0" />;
    return <Paperclip size={16} className="text-gray-400 shrink-0" />;
};

// ─── Component ───────────────────────────────────────────────────────────────

const ALLOWED = "application/pdf,image/*";
const MAX_MB = 10;

export const ContractUpload = ({
    bookingId, studioId, contracts, onChange,
}: ContractUploadProps) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    // ── Upload ──────────────────────────────────────────────────────────────
    const handleFile = async (file: File) => {
        if (!file) return;

        // Validate type
        const allowed = file.type === "application/pdf" || file.type.startsWith("image/");
        if (!allowed) {
            toast.error("Only PDF and image files are allowed");
            return;
        }
        // Validate size
        if (file.size > MAX_MB * 1024 * 1024) {
            toast.error(`File too large. Max size is ${MAX_MB} MB`);
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const path = `studios/${studioId}/bookings/${bookingId}/contracts/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, path);
            const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

            await new Promise<void>((resolve, reject) => {
                task.on(
                    "state_changed",
                    snap => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
                    reject,
                    resolve
                );
            });

            const url: string = await getDownloadURL(storageRef);
            const newFile: ContractFile = {
                name: file.name,
                url,
                storagePath: path,
                type: detectType(file.name),
                uploadedAt: new Date().toISOString(),
                sizeKb: Math.round(file.size / 1024),
            };

            await onChange([...contracts, newFile]);
            toast.success("Contract uploaded successfully");
        } catch (err: any) {
            console.error("Upload Error:", err);

            // Detect common CORS or unauthorized bucket errors
            const isCorsError = err?.message?.includes('failed to fetch') ||
                err?.message?.includes('CORS') ||
                err?.code === 'storage/retry-limit-exceeded' ||
                err?.code === 'storage/unknown';

            if (isCorsError) {
                toast.error("Upload blocked by CORS. Admin needs to configure bucket CORS rules.");
                console.warn(
                    "▶ ACTION REQUIRED for CORS:\n" +
                    "1. Install gsutil (Google Cloud CLI)\n" +
                    "2. Run: gsutil cors set cors.json gs://cameraman-pro-2aa2b.appspot.com"
                );
            } else if (err?.code === "storage/unauthorized") {
                toast.error("Permission denied. Check Firebase Storage rules.");
            } else {
                toast.error("Upload failed. Please try again.");
            }
        } finally {
            setUploading(false);
            setProgress(0);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    // ── Delete ──────────────────────────────────────────────────────────────
    const handleDelete = async (contract: ContractFile) => {
        if (!confirm(`Delete "${contract.name}"?`)) return;
        setDeleting(contract.storagePath);
        try {
            // Delete from storage
            try {
                await deleteObject(ref(storage, contract.storagePath));
            } catch {
                // File might already be gone — continue to update list
            }
            const updated = contracts.filter(c => c.storagePath !== contract.storagePath);
            await onChange(updated);
            toast.success("Contract deleted");
        } catch {
            toast.error("Failed to delete contract");
        } finally {
            setDeleting(null);
        }
    };

    return (
        <section className="bg-[var(--surface-base)] border border-[var(--border-light)] rounded-2xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <Paperclip size={20} className="text-sky-500" />
                    Contracts & Documents
                </h3>
                <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-secondary)] border border-[var(--border-light)] px-2 py-0.5 rounded-full uppercase">
                    {contracts.length} file{contracts.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Drop zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all select-none
                    ${dragOver
                        ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/5"
                        : "border-[var(--border-light)] hover:border-[var(--accent-primary)]/40 hover:bg-[var(--bg-secondary)]"
                    } ${uploading ? "pointer-events-none opacity-70" : ""}`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ALLOWED}
                    className="hidden"
                    onChange={handleInputChange}
                />

                {uploading ? (
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 size={24} className="animate-spin text-[var(--accent-primary)]" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">Uploading... {progress}%</p>
                        <div className="w-full max-w-xs bg-[var(--bg-secondary)] rounded-full h-1.5 border border-[var(--border-light)]">
                            <div
                                className="h-1.5 rounded-full bg-[var(--accent-primary)] transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1.5">
                        <Upload size={22} className="text-[var(--text-tertiary)]" />
                        <p className="text-sm font-medium text-[var(--text-primary)]">
                            {dragOver ? "Drop to upload" : "Upload Contract"}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            PDF or image · max {MAX_MB} MB · drag & drop or click
                        </p>
                    </div>
                )}
            </div>

            {/* File list */}
            {contracts.length > 0 && (
                <div className="mt-4 space-y-2">
                    {contracts.map(file => (
                        <div
                            key={file.storagePath}
                            className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-light)] rounded-xl hover:border-[var(--border-medium)] transition-colors group"
                        >
                            <FileIcon type={file.type} />

                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                                <p className="text-[10px] text-[var(--text-tertiary)]">
                                    {file.sizeKb} KB · {new Date(file.uploadedAt).toLocaleDateString("en-IN", {
                                        day: "numeric", month: "short", year: "numeric"
                                    })}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                                <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                    title="Open"
                                >
                                    <ExternalLink size={14} />
                                </a>
                                <button
                                    onClick={() => handleDelete(file)}
                                    disabled={deleting === file.storagePath}
                                    className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                    title="Delete"
                                >
                                    {deleting === file.storagePath
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : <Trash2 size={14} />
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {contracts.length === 0 && !uploading && (
                <p className="text-center text-xs text-[var(--text-tertiary)] mt-3">
                    No contracts attached yet.
                </p>
            )}
        </section>
    );
};
