import { useState, useEffect, useCallback, useRef } from 'react';
import {
    collection, doc, query, orderBy,
    onSnapshot, setDoc, updateDoc, serverTimestamp, Timestamp,
    getDocs, where
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { PhotoSession, SessionPhoto, PhotoSelection, SelectionType } from '../types';
import toast from 'react-hot-toast';

const SESSIONS_COL = 'photoSessions';

// Deterministic selection doc id from accessCode stored under selections/
const selectionDocId = (accessCode: string) =>
    accessCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();

export const usePhotoSelection = (accessCode: string | undefined) => {
    const [session, setSession] = useState<PhotoSession | null>(null);
    const [photos, setPhotos] = useState<SessionPhoto[]>([]);
    const [selection, setSelection] = useState<PhotoSelection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const photosUnsubRef = useRef<(() => void) | null>(null);

    // ── Step 1: Find session by accessCode ────────────────────────────────────
    useEffect(() => {
        if (!accessCode) { setError('Invalid access code.'); setLoading(false); return; }

        let cancelled = false;

        const findSession = async () => {
            try {
                // Query sessions collection for matching accessCode
                const snap = await getDocs(
                    query(collection(db, SESSIONS_COL), where('accessCode', '==', accessCode))
                );

                if (cancelled) return;

                if (snap.empty) {
                    setError('Gallery not found. Please check your link.');
                    setLoading(false);
                    return;
                }

                const d = snap.docs[0];
                const s = { id: d.id, ...d.data() } as PhotoSession;
                setSession(s);
                setSessionId(d.id);
            } catch (err: any) {
                if (!cancelled) {
                    setError('Failed to load gallery. Please try again.');
                    setLoading(false);
                }
            }
        };

        findSession();
        return () => { cancelled = true; };
    }, [accessCode]);

    // ── Step 2: Once sessionId known, subscribe to photos ─────────────────────
    useEffect(() => {
        if (!sessionId) return;

        const photosQ = query(
            collection(db, SESSIONS_COL, sessionId, 'photos'),
            orderBy('order', 'asc')
        );

        const unsub = onSnapshot(photosQ, (snap) => {
            const p = snap.docs.map(d => ({ id: d.id, ...d.data() })) as SessionPhoto[];
            setPhotos(p);
        });

        photosUnsubRef.current = unsub;
        return () => unsub();
    }, [sessionId]);

    // ── Step 3: Subscribe to this client's selection doc ──────────────────────
    useEffect(() => {
        if (!sessionId || !accessCode) return;

        const selDocRef = doc(
            db, SESSIONS_COL, sessionId, 'selections', selectionDocId(accessCode)
        );

        const unsub = onSnapshot(selDocRef, (snap) => {
            if (snap.exists()) {
                setSelection({ id: snap.id, ...snap.data() } as PhotoSelection);
            } else {
                setSelection(null);
            }
            setLoading(false);
        }, () => {
            setLoading(false);
        });

        return () => unsub();
    }, [sessionId, accessCode]);

    // ── Check if session is locked or past deadline ────────────────────────────
    const isLocked = (() => {
        if (!session) return true;
        if (session.isLocked) return true;
        if (session.deadlineAt) {
            const deadline = session.deadlineAt instanceof Timestamp
                ? session.deadlineAt.toDate()
                : new Date(session.deadlineAt as any);
            if (new Date() > deadline) return true;
        }
        return false;
    })();

    const isSubmitted = selection?.isSubmitted ?? false;

    // ── Toggle a selection type for a photo ───────────────────────────────────
    const toggleSelection = useCallback((photoId: string, type: SelectionType) => {
        if (isLocked) { toast.error('This gallery is locked.'); return; }
        if (isSubmitted) { toast.error('Selections already submitted.'); return; }

        setSelection(prev => {
            const current = prev?.selections ?? {};
            const existing = current[photoId];
            const updated = existing === type
                ? { ...current, [photoId]: null }  // deselect
                : { ...current, [photoId]: type };

            const total = Object.values(updated).filter(v => v !== null).length;

            return {
                id: selectionDocId(accessCode!),
                sessionId: sessionId!,
                studioId: session?.studioId ?? '',
                accessCode: accessCode!,
                selections: updated,
                totalSelected: total,
                isSubmitted: false,
                updatedAt: Timestamp.now(),
            };
        });
    }, [isLocked, isSubmitted, accessCode, sessionId, session]);

    // ── Persist current selection state to Firestore (auto-save) ─────────────
    const saveProgress = useCallback(async () => {
        if (!selection || !sessionId || !accessCode) return;
        const selDocRef = doc(
            db, SESSIONS_COL, sessionId, 'selections', selectionDocId(accessCode)
        );
        try {
            await setDoc(selDocRef, {
                ...selection,
                updatedAt: serverTimestamp(),
            }, { merge: true });
        } catch { /* silent auto-save failure */ }
    }, [selection, sessionId, accessCode]);

    // ── Final submit + lock ────────────────────────────────────────────────────
    const submitSelections = useCallback(async (): Promise<boolean> => {
        if (!selection || !sessionId || !accessCode) return false;
        const total = Object.values(selection.selections).filter(v => v !== null).length;
        if (total === 0) {
            toast.error('Please select at least one photo before submitting.');
            return false;
        }

        setSubmitting(true);
        const t = toast.loading('Submitting your selections…');
        try {
            const selDocRef = doc(
                db, SESSIONS_COL, sessionId, 'selections', selectionDocId(accessCode)
            );
            await setDoc(selDocRef, {
                ...selection,
                totalSelected: total,
                isSubmitted: true,
                submittedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            }, { merge: true });

            // Also mark the session itself as having received a submission
            await updateDoc(doc(db, SESSIONS_COL, sessionId), {
                updatedAt: serverTimestamp(),
            });

            toast.success(`${total} photos submitted to the studio! 🎉`, { id: t });
            return true;
        } catch (err: any) {
            toast.error(err.message || 'Submission failed.', { id: t });
            return false;
        } finally {
            setSubmitting(false);
        }
    }, [selection, sessionId, accessCode]);

    // ── Helpers ────────────────────────────────────────────────────────────────
    const getSelectedCount = (type?: SelectionType) => {
        if (!selection) return 0;
        const vals = Object.values(selection.selections);
        if (type) return vals.filter(v => v === type).length;
        return vals.filter(v => v !== null).length;
    };

    const getPhotoSelectionType = (photoId: string): SelectionType | null =>
        selection?.selections[photoId] ?? null;

    return {
        session,
        photos,
        selection,
        loading,
        error,
        submitting,
        isLocked,
        isSubmitted,
        toggleSelection,
        saveProgress,
        submitSelections,
        getSelectedCount,
        getPhotoSelectionType,
    };
};
