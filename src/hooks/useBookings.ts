import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    runTransaction,
    Timestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Booking, TrashItem } from "../types";
import toast from "react-hot-toast";
import { normalizeFirestoreDate } from "../utils/date";

/**
 * REUSABLE HELPER: Sanitize Data for Firestore
 * Recursively converts undefined -> null
 * Handles Arrays and Objects
 * Skips Firestore FieldValues (like serverTimestamp)
 */
function sanitizeFirestoreData(obj: any): any {
    if (obj === undefined) {
        return null; // Firestore doesn't like undefined
    }
    if (obj === null) {
        return null;
    }
    if (typeof obj !== 'object') {
        return obj; // Primitives (string, number, boolean)
    }

    // Check for Firestore Timestamp
    if (obj instanceof Timestamp || typeof obj.toMillis === 'function') {
        return obj;
    }

    // Check for Arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeFirestoreData(item));
    }

    // Process Plain Object
    const sanitized: any = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Recursively sanitize
            sanitized[key] = sanitizeFirestoreData(value);
        }
    }
    return sanitized;
}

export const useBookings = () => {
    const { studioId, user, userProfile } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // READ: Real-time Listener
    useEffect(() => {
        if (!studioId) {
            console.log("useBookings: No studioId, waiting...");
            setLoading(false);
            return;
        }

        console.log("useBookings: initializing listener for studio:", studioId);
        const bookingsRef = collection(db, "bookings");

        // Simple query to avoid index issues
        const q = query(
            bookingsRef,
            where("studioId", "==", studioId),
            orderBy("eventDate", "desc")
        );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                console.log("useBookings: snapshot received", snapshot.size, "docs");

                const bookingsData = snapshot.docs
                    .map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Booking[];

                // Client-side filtering
                const activeBookings = bookingsData.filter(b => b.status !== 'deleted');
                setBookings(activeBookings);
                setLoading(false);
            },
            (err) => {
                console.error("Error fetching bookings:", err);
                if (err.message.includes("requires an index")) {
                    console.warn("Index missing. Click the link in console to create it.");
                    setError("System optimization needed. Check console.");
                } else {
                    setError("Failed to load bookings.");
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [studioId]);

    // CREATE
    const addBooking = async (data: Partial<Booking>) => {
        if (!studioId || !user) {
            toast.error("Session missing. Please refresh.");
            throw new Error("Missing studioId or user");
        }

        if (!data.clientName) throw new Error("Client Name is required");
        if (!data.clientPhone) throw new Error("Phone Number is required");

        try {
            console.log("Creating booking for studio:", studioId);
            const bookingsRef = collection(db, "bookings");

            // 1. Construct Strict Payload with Defaults
            // We define every field explicitly to catch missing ones
            const basePayload = {
                studioId: studioId,

                // Identity
                clientName: data.clientName || "Unknown",
                clientPhone: data.clientPhone || "",
                clientEmail: data.clientEmail || null,     // Optional -> null
                clientAddress: data.clientAddress || "",   // Optional -> ""

                // Event Details
                venue: data.venue || "",
                eventType: data.eventType || "other",
                eventDate: (() => {
                    // Safely convert any date format (string, Date, or Timestamp) to Firestore Timestamp
                    const normalized = normalizeFirestoreDate(data.eventDate);
                    return normalized ? Timestamp.fromDate(normalized) : Timestamp.now();
                })(),
                subEvents: Array.isArray(data.subEvents) ? data.subEvents : [],

                // Resources
                equipmentBooked: Array.isArray(data.equipmentBooked) ? data.equipmentBooked : [],

                // Financials (Strict Numbers)
                financials: {
                    totalAmount: Number(data.financials?.totalAmount) || 0,
                    advancePaid: Number(data.financials?.advancePaid) || 0,
                    balanceDue: Number(data.financials?.balanceDue) || 0,
                    paymentHistory: Array.isArray(data.financials?.paymentHistory) ? data.financials?.paymentHistory : []
                },

                // Sub-objects (Optional -> Null)
                postProductionStatus: data.postProductionStatus || null,

                // Meta
                notes: data.notes || "",
                status: data.status || 'pending',
                shootStatus: 'upcoming',

                // Audit
                createdBy: user.uid,
                createdByName: userProfile?.name || user.email || 'Unknown'
            };

            // 2. Sanitize Recursively (Catch-all for undefined keys)
            // This cleans up nested arrays/objects inside subEvents or equipmentBooked
            const safePayload = sanitizeFirestoreData(basePayload);

            // 3. Add Server Timestamps (after sanitization to avoid recursion issues)
            const finalPayload = {
                ...safePayload,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            // 4. Debug Log (As requested)
            console.log("FINAL FIRESTORE PAYLOAD:", finalPayload);

            // 5. Save
            await addDoc(bookingsRef, finalPayload);

            console.log("Booking created successfully");
            toast.success("Booking created successfully");
        } catch (err: any) {
            console.error("Error creating booking:", err);

            if (err.message.includes("undefined")) {
                toast.error("Critical: Data contained undefined values.");
            } else if (err.code === 'permission-denied') {
                toast.error("Access denied. Database rules issue.");
            } else {
                toast.error("Failed to save booking.");
            }
            throw err;
        }
    };

    // UPDATE
    const updateBooking = async (bookingId: string, data: Partial<Booking>) => {
        if (!studioId) return;
        try {
            const bookingRef = doc(db, "bookings", bookingId);

            // CLEANUP: Remove undefined keys before update
            // Also normalize eventDate to Firestore Timestamp if provided
            const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    if (key === 'eventDate' && value) {
                        // Safely convert any date format to Firestore Timestamp
                        const normalized = normalizeFirestoreDate(value);
                        acc[key] = normalized ? Timestamp.fromDate(normalized) : value;
                    } else {
                        acc[key] = value;
                    }
                }
                return acc;
            }, {} as any);

            await updateDoc(bookingRef, {
                ...cleanData,
                updatedAt: serverTimestamp()
            });
            toast.success("Booking updated");
        } catch (err: any) {
            console.error("Error updating booking:", err);
            toast.error("Failed to update booking");
            throw err;
        }
    };

    // MARK AS COMPLETED
    const markAsCompleted = async (bookingId: string) => {
        if (!studioId) return;
        try {
            const bookingRef = doc(db, "bookings", bookingId);
            await updateDoc(bookingRef, {
                shootStatus: 'completed',
                completedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            toast.success("Shoot marked as completed! 🎉");
        } catch (err: any) {
            console.error("Error marking shoot as completed:", err);
            toast.error("Failed to update shoot status");
            throw err;
        }
    };

    // DELETE (Soft Delete)
    const softDeleteBooking = async (booking: Booking) => {
        if (!studioId || !user) return;

        try {
            await runTransaction(db, async (transaction) => {
                const bookingRef = doc(db, "bookings", booking.id);
                // Ensure unique ID for trash
                const trashRef = doc(collection(db, "trash"));

                const trashData: Omit<TrashItem, 'id'> = {
                    originalCollection: 'bookings',
                    originalId: booking.id,
                    studioId: studioId,
                    data: booking,
                    deletedBy: user.uid,
                    deletedAt: Timestamp.now(),
                    expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
                };

                transaction.set(trashRef, trashData);
                transaction.update(bookingRef, {
                    status: 'deleted',
                    updatedAt: serverTimestamp()
                });
            });

            toast.success("Booking moved to trash");
        } catch (err) {
            console.error("Error deleting booking:", err);
            toast.error("Failed to delete booking");
            throw err;
        }
    };

    return {
        bookings,
        loading,
        error,
        addBooking,
        updateBooking,
        softDeleteBooking,
        markAsCompleted
    };
};
