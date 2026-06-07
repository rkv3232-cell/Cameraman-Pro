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
    serverTimestamp
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { Enquiry, EnquiryStatus } from "../types";
import toast from "react-hot-toast";

export const useEnquiries = () => {
    const { studioId, userProfile } = useAuth();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);

    // READ: Real-time Listener
    useEffect(() => {
        if (!studioId) {
            setLoading(false);
            return;
        }

        const role = userProfile?.role || 'member';
        const permissions = {
            isAdmin: ['owner', 'admin'].includes(role),
            isOwner: role === 'owner' || (userProfile?.email === 'ckv3232@gmail.com'),
            isMaster: userProfile?.email === 'ckv3232@gmail.com'
        };
        const uid = userProfile?.uid;

        console.log("Resolved Role:", role);
        console.log("Resolved Permissions:", permissions);
        console.log("Current UID:", uid);

        const isMaster = userProfile?.email ? ["ckv3232@gmail.com"].includes(userProfile.email) : false;
        const enquiriesRef = collection(db, "enquiries");

        // Fetch all enquiries if master owner, otherwise filter by studioId
        const q = isMaster
            ? query(enquiriesRef, orderBy("createdAt", "desc"))
            : query(
                enquiriesRef,
                where("studioId", "==", studioId),
                orderBy("createdAt", "desc")
            );

        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Enquiry[];

                setEnquiries(data);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching enquiries:", error);

                if (error.message.includes("requires an index")) {
                    console.warn("Firestore index needed for enquiries: ", error.message);
                } else {
                    toast.error("Failed to load enquiries");
                }
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [studioId]);

    // CREATE (Mainly for testing or manual admin entry)
    const addEnquiry = async (data: Omit<Enquiry, 'id' | 'createdAt' | 'status'>) => {
        if (!studioId) return;

        try {
            const enquiriesRef = collection(db, "enquiries");
            await addDoc(enquiriesRef, {
                ...data,
                studioId,
                status: 'new' as EnquiryStatus,
                createdAt: serverTimestamp()
            });
            toast.success("Enquiry created successfully");
        } catch (error) {
            console.error("Error creating enquiry:", error);
            toast.error("Failed to create enquiry");
            throw error;
        }
    };

    // UPDATE STATUS
    const updateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
        try {
            const enquiryRef = doc(db, "enquiries", enquiryId);
            await updateDoc(enquiryRef, { status });
            toast.success(`Enquiry marked as ${status}`);
        } catch (error) {
            console.error("Error updating enquiry status:", error);
            toast.error("Failed to update status");
            throw error;
        }
    };

    return {
        enquiries,
        loading,
        addEnquiry,
        updateEnquiryStatus
    };
};
