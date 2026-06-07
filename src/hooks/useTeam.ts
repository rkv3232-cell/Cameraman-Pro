import { useState, useEffect, useCallback } from "react";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
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

    // Fetch team members — queries workspaces/{studioId}/members subcollection for security and isolation
    const fetchTeamMembers = useCallback(async () => {
        if (!studioId || !user) return;
        setLoading(true);
        setError(null);

        console.log("[useTeam] fetchTeamMembers — studioId:", studioId, "user:", user.uid);

        try {
            // Load members from workspaces/{studioId}/members subcollection
            const membersRef = collection(db, "workspaces", studioId, "members");
            const membersSnap = await getDocs(membersRef);
            
            const studioRef = doc(db, "studios", studioId);
            const studioSnap = await getDoc(studioRef);
            const studioData = studioSnap.exists() ? studioSnap.data() : null;
            const ownerId = studioData?.ownerId;

            console.log("[useTeam] Studio owner:", ownerId);

            // Fetch owner profile for details
            let ownerProfile: any = null;
            if (ownerId) {
                const ownerSnap = await getDoc(doc(db, "users", ownerId));
                if (ownerSnap.exists()) {
                    ownerProfile = { uid: ownerId, ...ownerSnap.data() };
                }
            }

            const rawMembersList = [];
            for (const memberDoc of membersSnap.docs) {
                const mData = memberDoc.data();
                const mUid = memberDoc.id || mData.uid || mData.userId;
                
                // Fetch the actual user profile for live details
                const uSnap = await getDoc(doc(db, "users", mUid));
                if (uSnap.exists()) {
                    rawMembersList.push({
                        uid: mUid,
                        ...uSnap.data(),
                        role: mData.role || uSnap.data().role || 'member',
                        joinedAt: mData.joinedAt || uSnap.data().createdAt || new Date().toISOString()
                    });
                } else {
                    // Fallback using member doc data
                    rawMembersList.push({
                        uid: mUid,
                        name: mData.name || mData.displayName || "Unknown",
                        email: mData.email || "",
                        phone: mData.phone || "",
                        photoURL: mData.photoURL || "",
                        role: mData.role || "member",
                        joinedAt: mData.joinedAt || new Date().toISOString()
                    });
                }
            }

            // Ensure the owner is in the list
            if (ownerProfile && !rawMembersList.some(m => m.uid === ownerId)) {
                rawMembersList.push({
                    uid: ownerId,
                    name: ownerProfile.name || ownerProfile.displayName || "Unknown",
                    email: ownerProfile.email || "",
                    phone: ownerProfile.phone || "",
                    photoURL: ownerProfile.photoURL || "",
                    role: 'owner',
                    joinedAt: ownerProfile.createdAt || new Date().toISOString()
                });
            }

            const memberList: TeamMember[] = rawMembersList.map((m: any) => {
                const isOwner = m.uid === ownerId;
                let role: TeamRole = 'member';
                if (isOwner) {
                    role = 'owner';
                } else if (m.role && ['admin', 'manager', 'member', 'accountant', 'coordinator'].includes(m.role)) {
                    role = m.role as TeamRole;
                }

                if (m.uid === user.uid) {
                    setCurrentUserRole(role);
                }

                return {
                    uid: m.uid,
                    name: m.name || m.displayName || "Unknown",
                    email: m.email || "",
                    phone: m.phone || "",
                    photoURL: m.photoURL || "",
                    role,
                    status: 'active' as const,
                    joinedAt: m.joinedAt instanceof Timestamp ? m.joinedAt : (typeof m.joinedAt === 'string' ? Timestamp.fromDate(new Date(m.joinedAt)) : Timestamp.now()),
                    addedBy: isOwner ? undefined : ownerId,
                };
            });

            // Sort: Owner first, then Admin, then Managers, Coordinators, Accountants, Members
            const roleOrder: Record<TeamRole, number> = {
                owner: 0,
                admin: 1,
                manager: 2,
                coordinator: 3,
                accountant: 4,
                member: 5
            };
            memberList.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);

            // Temporary debug logging as requested
            console.log("[DEBUG] CURRENT USER ID:", user.uid);
            console.log("[DEBUG] CURRENT WORKSPACE ID:", studioId);
            const currentUserInList = memberList.find(m => m.uid === user.uid);
            const activeRoleVal = currentUserInList ? currentUserInList.role : "none";
            console.log("[DEBUG] ACTIVE ROLE:", activeRoleVal);
            console.log("[DEBUG] MEMBER COUNT:", memberList.length);
            console.log("[DEBUG] WORKSPACE MEMBERS QUERY RESULT:", memberList.map(m => ({ uid: m.uid, email: m.email, role: m.role })));

            setMembers(memberList);
        } catch (err: any) {
            console.error("[useTeam] Error fetching team members:", err);
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
    const canManageTeam = isOwner || isAdmin || currentUserRole === 'manager';

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
            // Update role in workspaces subcollection
            const memberDocRef = doc(db, "workspaces", studioId, "members", memberUid);
            await updateDoc(memberDocRef, { role: newRole });

            // Update role in users collection
            const userRef = doc(db, "users", memberUid);
            await updateDoc(userRef, { role: newRole });
            
            await fetchTeamMembers(); // Refresh
        } catch (err: any) {
            console.error("Error updating role:", err);
            throw new Error(err.message || "Failed to update role");
        }
    };

    // Remove a member (authoritative eviction flow)
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
            console.log("[removeMember] Evicting member:", memberUid, "from workspace:", studioId);

            // Optimistically update local state for immediate UI update
            setMembers(prev => prev.filter(m => m.uid !== memberUid));

            // STEP 1: Delete membership doc from workspaces/{studioId}/members/{memberUid}
            const memberDocRef = doc(db, "workspaces", studioId, "members", memberUid);
            await deleteDoc(memberDocRef);
            console.log("[removeMember] Membership doc deleted from workspaces");

            // STEP 2: Nullify all workspace-related fields on the evicted user's profile
            const userRef = doc(db, "users", memberUid);
            await updateDoc(userRef, {
                studioId: null,
                role: null,
                workspaceRole: null,
                workspaceStatus: 'removed',
                activeWorkspaceId: null,
                joinedWorkspaceId: null,
                workspacePermissions: null
            });
            console.log("[removeMember] User profile fields successfully nulled");

            await fetchTeamMembers(); // Refresh
        } catch (err: any) {
            console.error("[removeMember] Error:", err);
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
