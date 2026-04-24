import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Booking } from "../types";

export const useClientBookings = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.email) {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(db, "bookings");
        // Query to find bookings associated with the client's email
        const q = query(
            bookingsRef,
            where("clientEmail", "==", user.email),
            orderBy("eventDate", "desc")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Booking[];
            setBookings(data.filter(b => b.status !== 'deleted'));
            setLoading(false);
        }, (err) => {
            console.error("Error fetching client bookings:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.email]);

    return { bookings, loading };
};
