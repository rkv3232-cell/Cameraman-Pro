import { useState, useEffect, useCallback } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "./useAuth";
import { TeamMember, TeamRole, Studio } from "../types";

interface UseTeamReturn {
    members: TeamMember[];
    studioInfo: Studio | null;
    loading: boolean;
    error: string | null;
    currentUserRole: TeamRole | null;
    isOwner: boolean;
    isAdmin: boolean;
    canManageTeam: boolean;

    // Actions
    addMember: (email: string, role: TeamRole) => Promise<void>;
    updateMemberRole: (memberUid: string, newRole: TeamRole) => Promise<void>;
    removeMember: (memberUid: string) => Promise<void>;
    refreshTeam: () => Promise<void>;
}

export const useTeam = (): UseTeamReturn => {
    const { user, studioId } = useAuth();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [studioInfo, setStudioInfo] = useState<Studio | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);

    // Fetch studio info
    const fetchStudioInfo = useCallback(async () => {
        if (!studioId) return;
        try {
            const studioRef = doc(db, "studios", studioId);
            const studioSnap = await getDoc(studioRef);
            if (studioSnap.exists()) {
                setStudioInfo({ id: studioSnap.id, ...studioSnap.data() } as Studio);
            }
        } catch (err) {
            console.error("Error fetching studio info:", err);
        }
    }, [studioId]);

    // Fetch team members — uses the `users` collection
    // since there's no dedicated members subcollection yet,
    // we query all users whose studioId matches the current studio
    const fetchTeamMembers = useCallback(async () => {
        if (!studioId || !user) return;
        setLoading(true);
        setError(null);

        try {
            // Get all users who belong to this studio
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("studioId", "==", studioId));
            const snapshot = await getDocs(q);

            const studioRef = doc(db, "studios", studioId);
            const studioSnap = await getDoc(studioRef);
            const studioData = studioSnap.exists() ? studioSnap.data() : null;
            const ownerId = studioData?.ownerId;

            const memberList: TeamMember[] = snapshot.docs.map((docSnap) => {
                const data = docSnap.data();
                const isOwner = data.uid === ownerId;

                // Determine role
                let role: TeamRole = 'member';
                if (isOwner) {
                    role = 'owner';
                } else if (data.role === 'admin') {
                    role = 'admin';
                } else {
                    role = 'member';
                }

                // Set current user's role
                if (data.uid === user.uid) {
                    setCurrentUserRole(role);
                }

                return {
                    uid: data.uid,
                    name: data.name || "Unknown",
                    email: data.email || "",
                    phone: data.phone || "",
                    photoURL: data.photoURL || user?.photoURL || "",
                    role,
                    status: 'active' as const,
                    joinedAt: data.createdAt || Timestamp.now(),
                    addedBy: isOwner ? undefined : ownerId,
                };
            });

            // Sort: Owner first, then Admin, then Members
            const roleOrder: Record<TeamRole, number> = { owner: 0, admin: 1, member: 2 };
            memberList.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

            setMembers(memberList);
        } catch (err: any) {
            console.error("Error fetching team members:", err);
            setError(err.message || "Failed to load team members");
        } finally {
            setLoading(false);
        }
    }, [studioId, user]);

    // Initial load
    useEffect(() => {
        fetchStudioInfo();
        fetchTeamMembers();
    }, [fetchStudioInfo, fetchTeamMembers]);

    // Derived state
    const isOwner = currentUserRole === 'owner';
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'owner';
    const canManageTeam = isOwner || isAdmin;

    // Add a member by email
    const addMember = async (_email: string, _role: TeamRole) => {
        if (!studioId || !user) throw new Error("Not authenticated");
        if (!canManageTeam) throw new Error("Insufficient permissions");

        // We can't directly add members by email in this architecture
        // because users must sign up first. Instead, we provide the studio code.
        // This is a placeholder for future invite-by-email functionality.
        throw new Error(
            "Currently, members join via Studio Code. Share the code from the Team page."
        );
    };

    // Update a member's role
    const updateMemberRole = async (memberUid: string, newRole: TeamRole) => {
        if (!studioId || !user) throw new Error("Not authenticated");
        if (!canManageTeam) throw new Error("Insufficient permissions");

        // Prevent changing owner's role
        const targetMember = members.find(m => m.uid === memberUid);
        if (targetMember?.role === 'owner') {
            throw new Error("Cannot change the owner's role");
        }

        // Only owner can promote to admin
        if (newRole === 'admin' && !isOwner) {
            throw new Error("Only the owner can assign Admin role");
        }

        // Cannot make someone owner
        if (newRole === 'owner') {
            throw new Error("Owner role cannot be assigned");
        }

        try {
            const userRef = doc(db, "users", memberUid);
            const firestoreRole = newRole === 'admin' ? 'admin' : 'assistant';
            await updateDoc(userRef, { role: firestoreRole });
            await fetchTeamMembers(); // Refresh
        } catch (err: any) {
            console.error("Error updating role:", err);
            throw new Error(err.message || "Failed to update role");
        }
    };

    // Remove a member (switch their studioId away)
    const removeMember = async (memberUid: string) => {
        if (!studioId || !user) throw new Error("Not authenticated");
        if (!canManageTeam) throw new Error("Insufficient permissions");

        const targetMember = members.find(m => m.uid === memberUid);
        if (!targetMember) throw new Error("Member not found");

        // Cannot remove owner
        if (targetMember.role === 'owner') {
            throw new Error("Cannot remove the studio owner");
        }

        // Only owner can remove admins
        if (targetMember.role === 'admin' && !isOwner) {
            throw new Error("Only the owner can remove admins");
        }

        // Cannot remove yourself
        if (memberUid === user.uid) {
            throw new Error("Cannot remove yourself from the team");
        }

        try {
            // Generate a new personal studio for the removed member
            // so they still have access to the app
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            let newCode = '';
            for (let i = 0; i < 6; i++) {
                newCode += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            // Create a new personal studio for them
            await setDoc(doc(db, "studios", newCode), {
                name: `${targetMember.name}'s Studio`,
                ownerId: memberUid,
                createdAt: serverTimestamp(),
                settings: { currency: 'INR' }
            });

            // Switch their studio
            const userRef = doc(db, "users", memberUid);
            await updateDoc(userRef, {
                studioId: newCode,
                role: 'admin'
            });

            await fetchTeamMembers(); // Refresh
        } catch (err: any) {
            console.error("Error removing member:", err);
            throw new Error(err.message || "Failed to remove member");
        }
    };

    const refreshTeam = async () => {
        await fetchStudioInfo();
        await fetchTeamMembers();
    };

    return {
        members,
        studioInfo,
        loading,
        error,
        currentUserRole,
        isOwner,
        isAdmin,
        canManageTeam,
        addMember,
        updateMemberRole,
        removeMember,
        refreshTeam,
    };
};
