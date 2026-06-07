import { useState, useEffect, useCallback } from 'react';
import {
    collection, query, where, orderBy, onSnapshot,
    addDoc, updateDoc, doc, serverTimestamp,
    Timestamp, getDocs, deleteDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { useAuth } from './useAuth';
import { PhotoSession, SessionPhoto, SessionStatus } from '../types';
import toast from 'react-hot-toast';

const SESSIONS_COL = 'photoSessions';

// ─── Access Code Generator ────────────────────────────────────────────────────
const EVENT_PREFIXES: Record<string, string> = {
    wedding: 'WED',
    'pre-wedding': 'PRE',
    birthday: 'BDY',
    corporate: 'CRP',
    other: 'EVT',
};

function generateAccessCode(eventType: string): string {
    const prefix = EVENT_PREFIXES[eventType] ?? 'EVT';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I confusion
    let suffix = '';
    for (let i = 0; i < 4; i++) {
        suffix += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${prefix}-${suffix}`;
}

// Build Cloudinary thumbnail URL at 400px width
function buildThumbnailUrl(url: string): string {
    // Insert /w_400,c_limit,q_auto,f_auto/ before upload path segment
    return url.replace('/upload/', '/upload/w_400,c_limit,q_auto,f_auto/');
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const usePhotoSession = () => {
    const { studioId, user } = useAuth();
    const [sessions, setSessions] = useState<PhotoSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploading, setUploading] = useState(false);

    // ── Live list of all sessions for this studio ──────────────────────────────
    useEffect(() => {
        if (!studioId) { setLoading(false); return; }

        const q = query(
            collection(db, SESSIONS_COL),
            where('studioId', '==', studioId)
        );

        const unsub = onSnapshot(q,
            (snap) => {
                let data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as PhotoSession[];
                data = data.sort((a, b) => {
                    const tA = (a.createdAt as any)?.toMillis?.() || 0;
                    const tB = (b.createdAt as any)?.toMillis?.() || 0;
                    return tB - tA;
                });
                setSessions(data);
                setLoading(false);
            },
            (err) => {
                console.error('usePhotoSession listener error:', err);
                setError('Failed to load photo sessions.');
                setLoading(false);
            }
        );
        return unsub;
    }, [studioId]);

    // ── Create new session ─────────────────────────────────────────────────────
    const createSession = useCallback(async (payload: {
        bookingId: string;
        clientName: string;
        eventType: string;
        eventDate: Timestamp;
        notes?: string;
        maxSelections?: number;
    }): Promise<string | null> => {
        if (!studioId || !user) {
            toast.error('Session missing. Please refresh.');
            return null;
        }
        const t = toast.loading('Creating photo session…');
        try {
            const accessCode = generateAccessCode(payload.eventType);
            const ref = await addDoc(collection(db, SESSIONS_COL), {
                studioId,
                bookingId: payload.bookingId || '',
                clientName: payload.clientName || 'Unknown Client',
                eventType: payload.eventType || 'other',
                eventDate: payload.eventDate || null,
                status: 'draft' as SessionStatus,
                accessCode,
                totalPhotos: 0,
                maxSelections: payload.maxSelections ?? null,
                isLocked: false,
                notes: payload.notes || '',
                createdBy: user.uid,
                createdAt: serverTimestamp() as any,
                updatedAt: serverTimestamp() as any,
            });
            toast.success(`Session created! Code: ${accessCode}`, { id: t });
            return ref.id;
        } catch (err: any) {
            toast.error(err.message || 'Failed to create session.', { id: t });
            return null;
        }
    }, [studioId, user]);

    // ── Upload batch of photos to a session ───────────────────────────────────
    const uploadPhotos = useCallback(async (
        sessionId: string,
        files: File[],
        startOrder: number = 0
    ): Promise<void> => {
        if (!studioId || !user) return;
        if (files.length === 0) return;

        const MAX = 500;
        if (files.length > MAX) {
            toast.error(`Maximum ${MAX} photos per session.`);
            return;
        }

        setUploading(true);
        setUploadProgress(0);
        const t = toast.loading(`Uploading 0 / ${files.length} photos…`);

        try {
            const photosRef = collection(db, SESSIONS_COL, sessionId, 'photos');
            let done = 0;
            const BATCH_SIZE = 5; // Process 5 photos at a time

            for (let i = 0; i < files.length; i += BATCH_SIZE) {
                const batch = files.slice(i, i + BATCH_SIZE);
                
                await Promise.all(batch.map(async (file) => {
                    const result = await uploadImageToCloudinary(file);
                    const thumbUrl = buildThumbnailUrl(result.secure_url);

                    await addDoc(photosRef, {
                        sessionId,
                        studioId,
                        cloudinaryUrl: result.secure_url,
                        cloudinaryPublicId: result.public_id,
                        thumbnailUrl: thumbUrl,
                        order: startOrder + done,
                        uploadedAt: serverTimestamp() as any,
                    } satisfies Omit<SessionPhoto, 'id'>);
                    
                    done++;
                    const pct = Math.round((done / files.length) * 100);
                    setUploadProgress(pct);
                    toast.loading(`Uploading ${done} / ${files.length} photos…`, { id: t });
                }));
            }

            // Update totalPhotos counter on session doc
            await updateDoc(doc(db, SESSIONS_COL, sessionId), {
                totalPhotos: startOrder + done,
                status: 'active' as SessionStatus,
                updatedAt: serverTimestamp() as any,
            });

            toast.success(`${done} photos uploaded!`, { id: t });
        } catch (err: any) {
            toast.error(err.message || 'Upload failed.', { id: t });
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [studioId, user]);

    // ── Toggle session lock ────────────────────────────────────────────────────
    const toggleLock = useCallback(async (sessionId: string, lock: boolean): Promise<void> => {
        const t = toast.loading(lock ? 'Locking session…' : 'Unlocking session…');
        try {
            await updateDoc(doc(db, SESSIONS_COL, sessionId), {
                isLocked: lock,
                status: (lock ? 'locked' : 'active') as SessionStatus,
                updatedAt: serverTimestamp() as any,
            });
            toast.success(lock ? 'Session locked 🔒' : 'Session unlocked 🔓', { id: t });
        } catch (err: any) {
            toast.error(err.message || 'Failed to update lock.', { id: t });
        }
    }, []);

    // ── Update session meta ────────────────────────────────────────────────────
    const updateSession = useCallback(async (
        sessionId: string,
        data: Partial<Pick<PhotoSession, 'notes' | 'maxSelections' | 'deadlineAt' | 'watermark' | 'status'>>
    ): Promise<void> => {
        try {
            await updateDoc(doc(db, SESSIONS_COL, sessionId), {
                ...data,
                updatedAt: serverTimestamp() as any,
            });
            toast.success('Session updated.');
        } catch (err: any) {
            toast.error(err.message || 'Update failed.');
        }
    }, []);

    // ── Delete all photos in a session then the session doc ───────────────────
    const deleteSession = useCallback(async (sessionId: string): Promise<void> => {
        const t = toast.loading('Deleting session…');
        try {
            const photosSnap = await getDocs(collection(db, SESSIONS_COL, sessionId, 'photos'));
            const batch = writeBatch(db);
            photosSnap.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            await deleteDoc(doc(db, SESSIONS_COL, sessionId));
            toast.success('Session deleted.', { id: t });
        } catch (err: any) {
            toast.error(err.message || 'Delete failed.', { id: t });
        }
    }, []);

    // ── Load photos for a single session (used by manager page) ──────────────
    const loadSessionPhotos = useCallback(async (sessionId: string): Promise<SessionPhoto[]> => {
        try {
            const snap = await getDocs(
                query(collection(db, SESSIONS_COL, sessionId, 'photos'), orderBy('order', 'asc'))
            );
            return snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionPhoto[];
        } catch {
            return [];
        }
    }, []);

    // ── Load selections for a session (used by manager page) ─────────────────
    const loadSessionSelections = useCallback(async (sessionId: string): Promise<import('../types').PhotoSelection[]> => {
        try {
            const snap = await getDocs(collection(db, SESSIONS_COL, sessionId, 'selections'));
            return snap.docs.map(d => ({ id: d.id, ...d.data() })) as import('../types').PhotoSelection[];
        } catch {
            return [];
        }
    }, []);

    return {
        sessions,
        loading,
        error,
        uploading,
        uploadProgress,
        createSession,
        uploadPhotos,
        toggleLock,
        updateSession,
        deleteSession,
        loadSessionPhotos,
        loadSessionSelections,
    };
};
