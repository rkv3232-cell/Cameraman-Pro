import { useState, useEffect } from "react";
import { collection, query, orderBy, where, onSnapshot, deleteDoc, doc, runTransaction } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { TrashItem } from "../types";
import toast from "react-hot-toast";

export const useTrash = () => {
    const { studioId } = useAuth();
    const [trashItems, setTrashItems] = useState<TrashItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studioId) {
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, "trash"),
            where("studioId", "==", studioId),
            orderBy("deletedAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as TrashItem[];
            setTrashItems(items);
            setLoading(false);
        }, (err) => {
            console.error("Trash error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studioId]);

    const restoreItem = async (item: TrashItem) => {
        if (!studioId) return;

        try {
            await runTransaction(db, async (transaction) => {
                const trashRef = doc(db, "trash", item.id);

                // Construct Original Path
                // Now using Root Collections, so originalCollection is implicitly the root name
                const originalRef = doc(db, item.originalCollection, item.originalId);

                // Restore
                const restoredData = { ...item.data };
                // Ensure status is active/pending if it was part of the data
                if (restoredData.status === 'deleted') {
                    restoredData.status = 'pending'; // Default to pending on restore or keep original state if valid
                }

                transaction.set(originalRef, restoredData);
                transaction.delete(trashRef);
            });
            toast.success("Item restored successfully");
        } catch (err) {
            console.error(err);
            toast.error("Failed to restore item");
        }
    };

    const permanentDelete = async (id: string) => {
        if (!studioId) return;
        if (!window.confirm("Are you sure? This cannot be undone.")) return;

        try {
            await deleteDoc(doc(db, "trash", id));
            toast.success("Permanently deleted");
        } catch (err) {
            toast.error("Failed to delete");
        }
    };

    return { trashItems, loading, restoreItem, permanentDelete };
};
