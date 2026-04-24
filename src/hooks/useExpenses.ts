import { useState, useEffect, useMemo, useRef } from "react";
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Expense, ExpenseCategory } from "../types";
import toast from "react-hot-toast";

export const useExpenses = () => {
    const { studioId, user, userProfile } = useAuth();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [indexError, setIndexError] = useState(false);

    // Prevent the same toast from firing more than once per studioId lifecycle
    const indexToastShown = useRef(false);

    useEffect(() => {
        // Do not attach any listener until studioId is known
        if (!studioId) {
            setExpenses([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setIndexError(false);
        indexToastShown.current = false;

        // ── Single composite query (requires index: studioId ASC + date DESC) ──
        const q = query(
            collection(db, "expenses"),
            where("studioId", "==", studioId),
            orderBy("date", "desc")
        );

        // ── Single onSnapshot listener — cleanup returned from useEffect ──────
        const unsubscribe = onSnapshot(
            q,
            // ── Success handler ───────────────────────────────────────────────
            (snapshot) => {
                setExpenses(
                    snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Expense))
                );
                setLoading(false);
                setIndexError(false);
            },
            // ── Error handler ─────────────────────────────────────────────────
            (err: any) => {
                setLoading(false);

                if (err.code === "failed-precondition") {
                    // Missing composite index — show once, then stop
                    setIndexError(true);
                    if (!indexToastShown.current) {
                        indexToastShown.current = true;
                        // Extract the auto-fill URL Firestore embeds in the message
                        const url = (err.message as string)
                            ?.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];
                        console.error(
                            "[Expenses] Composite index missing.\n" +
                            "Required: collection=expenses | studioId ASC + date DESC\n" +
                            (url ? `Create it here: ${url}` : "See firestore.indexes.json")
                        );
                        toast.error(
                            "Firestore index missing for Expenses — check console for the creation link.",
                            { id: "expenses-index", duration: 6000 }
                        );
                    }
                } else if (err.code === "permission-denied") {
                    console.error("[Expenses] Permission denied:", err.message);
                    toast.error("Permission denied loading expenses.", { id: "expenses-perm" });
                } else {
                    console.error("[Expenses] Snapshot error:", err.code, err.message);
                }
            }
        );

        // ── Cleanup: called when studioId changes or component unmounts ───────
        return () => unsubscribe();
    }, [studioId]); // Only re-subscribe when the studio changes

    // ── Add ──────────────────────────────────────────────────────────────────

    const addExpense = async (data: {
        amount: number;          // rupees — stored as paise
        category: ExpenseCategory;
        date: Date;            // JS Date from the form
        linkedBookingId?: string | null;
        linkedBookingName?: string;
        notes?: string;
    }) => {
        if (!studioId || !user) {
            toast.error("Session error — please refresh.");
            throw new Error("Missing studioId or user");
        }

        await addDoc(collection(db, "expenses"), {
            studioId,
            amount: Math.round(data.amount * 100),
            category: data.category,
            date: Timestamp.fromDate(data.date), // must be Timestamp for index to work
            linkedBookingId: data.linkedBookingId ?? null,
            linkedBookingName: data.linkedBookingName ?? "",
            notes: data.notes ?? "",
            createdBy: user.uid,
            createdByName: userProfile?.name || user.email || "Unknown",
            createdAt: serverTimestamp(),
        });

        toast.success("Expense added!");
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const deleteExpense = async (expenseId: string) => {
        await deleteDoc(doc(db, "expenses", expenseId));
        toast.success("Expense deleted");
    };

    // ── Analytics (derived client-side, no extra reads) ───────────────────────

    const analytics = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const monthly = expenses.filter(e => {
            try {
                const d = e.date?.toDate ? e.date.toDate() : new Date(e.date as any);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            } catch { return false; }
        });

        const byCategory: Record<ExpenseCategory, number> = {
            fuel: 0, assistant_payment: 0, repair_maintenance: 0, miscellaneous: 0,
        };
        monthly.forEach(e => { byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount; });

        const top = (Object.entries(byCategory) as [ExpenseCategory, number][])
            .sort(([, a], [, b]) => b - a)[0];

        return {
            totalThisMonth: monthly.reduce((s, e) => s + e.amount, 0),
            totalAllTime: expenses.reduce((s, e) => s + e.amount, 0),
            byCategory,
            topCategory: top ? { name: top[0] as ExpenseCategory, amount: top[1] } : null,
            count: monthly.length,
        };
    }, [expenses]);

    return { expenses, loading, indexError, addExpense, deleteExpense, analytics };
};
