import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { InventoryItem } from "../types";
import toast from "react-hot-toast";

export const useInventory = () => {
    const { studioId } = useAuth();
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!studioId) return;

        // Root Collection 'inventory'
        const q = query(
            collection(db, "inventory"),
            where("studioId", "==", studioId),
            where("status", "!=", "deleted")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as InventoryItem[];
            setInventory(items);
            setLoading(false);
        }, (err) => {
            console.error("Inventory error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studioId]);

    const addEquipment = async (item: Omit<InventoryItem, 'id' | 'studioId' | 'currentBookingId' | 'status'>) => {
        console.log('🔧 Adding equipment...', { item, studioId });

        if (!studioId) {
            console.error('❌ No studioId found!');
            toast.error("Studio ID missing. Please sign out and sign in again.");
            return;
        }

        try {
            const docData = {
                ...item,
                studioId,
                status: 'available' as const,
                currentBookingId: null,
                createdAt: serverTimestamp()
            };

            console.log('📤 Writing to Firestore:', docData);

            await addDoc(collection(db, "inventory"), docData);

            console.log('✅ Equipment added successfully');
            toast.success("Equipment added");
        } catch (err: any) {
            console.error('❌ Firebase error:', err);
            console.error('Error code:', err?.code);
            console.error('Error message:', err?.message);

            // Better error messages
            if (err?.code === 'permission-denied') {
                toast.error("❌ Permission denied. Check Firestore rules or sign in again.");
            } else if (err?.code === 'unauthenticated') {
                toast.error("❌ Please sign in again.");
            } else {
                toast.error(`❌ Failed: ${err?.message || 'Unknown error'}`);
            }
        }
    };

    const deleteEquipment = async (id: string) => {
        if (!studioId) return;
        try {
            // Hard delete for now to simplify
            await deleteDoc(doc(db, "inventory", id));
            toast.success("Equipment deleted");
        } catch (err: any) {
            console.error(err);
            if (err?.code === 'permission-denied') {
                toast.error("Permission denied.");
            } else {
                toast.error("Failed to delete equipment");
            }
        }
    };

    return { inventory, loading, addEquipment, deleteEquipment };
};
