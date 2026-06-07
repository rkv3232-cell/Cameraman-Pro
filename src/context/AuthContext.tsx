import { createContext, useEffect, useState, ReactNode, useRef } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    signOut,
    signInWithCredential,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    sendPasswordResetEmail,
} from "firebase/auth";
import { Capacitor } from "@capacitor/core";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { 
    doc, 
    getDoc, 
    setDoc, 
    serverTimestamp, 
    updateDoc, 
    onSnapshot, 
    collection, 
    getDocs, 
    query, 
    where 
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";
import toast from "react-hot-toast";

const MASTER_OWNER_EMAILS = ["ckv3232@gmail.com"];

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    studioId: string | null;
    loading: boolean;
    // Role helpers
    isOwner: boolean;
    isAdmin: boolean;
    isEditor: boolean;
    isClient: boolean;
    // Auth methods
    loginWithGoogle: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    registerWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    logout: () => Promise<void>;
    joinTeam: (teamCode: string) => Promise<void>;
    clearWorkspaceSession: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Generate 6-character alphanumeric Studio Code
const generateStudioCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [studioId, setStudioId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const redirectCheckedRef = useRef(false);

    // Role helpers derived from userProfile
    const isOwner = userProfile?.role === 'owner' || (userProfile?.email ? MASTER_OWNER_EMAILS.includes(userProfile.email) : false);
    const isAdmin = ['owner', 'admin'].includes(userProfile?.role ?? '');
    const isEditor = ['owner', 'admin', 'photographer'].includes(userProfile?.role ?? '');
    const isClient = userProfile?.role === 'client';

    // Centralized workspace session purging helper
    const clearWorkspaceSession = () => {
        console.log('[Cameraman Pro] Purging all workspace session keys from storage');
        const keysToRemove = [
            'workspaceId', 'workspaceRole', 'teamRole', 'memberPermissions',
            'activeWorkspace', 'sessionWorkspaceId', 'studioId', 'activeStudioId',
            'activeWorkspaceId', 'workspacePermissions', 'workspaceStatus', 'joinedWorkspaceId'
        ];
        keysToRemove.forEach(k => {
            localStorage.removeItem(k);
            sessionStorage.removeItem(k);
        });
        sessionStorage.clear();
    };

    useEffect(() => {
        if (redirectCheckedRef.current) return;
        redirectCheckedRef.current = true;

        const checkRedirect = async () => {
            try {
                const result = await getRedirectResult(auth);
                if (result) {
                    const fbUser = result.user;
                    console.log("[Auth Redirect] Successfully authenticated via redirect. UID:", fbUser.uid);
                    const userDocRef = doc(db, "users", fbUser.uid);
                    const userSnap = await getDoc(userDocRef);
                    if (!userSnap.exists()) {
                        await createNewUserProfile(fbUser);
                    }
                }
            } catch (error: any) {
                console.error("[Auth Redirect] Redirect result error:", error);
                const code = error?.code || error?.message;
                let msg = "Google login redirect failed.";
                if (code) {
                    if (code.includes("unauthorized-domain") || code.includes("unauthorized_domain")) {
                        msg = "This domain is not authorized for Google Sign-In redirect.";
                    } else if (code.includes("network-request-failed") || code.includes("network_request_failed")) {
                        msg = "Network request failed during Google login redirect.";
                    } else {
                        msg = `Google login redirect failed: ${code.replace("auth/", "").replace(/-/g, " ")}`;
                    }
                }
                toast.error(msg);
            }
        };
        checkRedirect();
    }, []);

    useEffect(() => {
        console.log('[Auth State Transition] APP_START: AuthProvider mounted');
        let profileUnsub: (() => void) | null = null;
        let memberUnsub: (() => void) | null = null;
        let currentSubscribedStudioId: string | null = null;

        console.log('[Auth State Transition] AUTH_LOADING: Checking Firebase Auth state...');
        const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
            // Wiping session keys on every auth change to prevent cross-app leakage
            clearWorkspaceSession();

            if (profileUnsub) {
                profileUnsub();
                profileUnsub = null;
            }
            if (memberUnsub) {
                memberUnsub();
                memberUnsub = null;
            }
            currentSubscribedStudioId = null;

            if (firebaseUser) {
                setUser(firebaseUser);
                console.log('[Auth State Transition] AUTHENTICATED: Firebase user detected. UID:', firebaseUser.uid, 'Email:', firebaseUser.email);
                console.log('[Auth State Transition] ROLE_LOADING: Fetching user profile from Firestore...');

                const userDocRef = doc(db, 'users', firebaseUser.uid);
                profileUnsub = onSnapshot(userDocRef, async (snap) => {
                    if (snap.exists()) {
                        let data = snap.data() as UserProfile;

                        console.log('[Auth State Transition] ROLE_LOADED: User profile fetched. Role:', data.role, 'Studio:', data.studioId);

                        // MASTER OVERRIDE: Ensure owners always have the role
                        const isMaster = data.email ? MASTER_OWNER_EMAILS.includes(data.email) : false;
                        if (isMaster) {
                            data = {
                                ...data,
                                role: 'owner'
                            };
                            console.log('[Auth Context] Master email override: Forced role to owner');
                        }

                        // MIGRATION: Fix legacy CLIENT_xxx studioIds (no studios/ document)
                        if (data.studioId && data.studioId.startsWith('CLIENT_')) {
                            console.log('[Cameraman Pro] Migrating legacy CLIENT_ studioId for user:', firebaseUser.uid);
                            try {
                                const newStudioId = generateStudioCode();
                                await setDoc(doc(db, 'studios', newStudioId), {
                                    name: firebaseUser.displayName ? `${firebaseUser.displayName}'s Studio` : 'My Studio',
                                    ownerId: firebaseUser.uid,
                                    createdAt: serverTimestamp(),
                                    settings: { currency: 'INR' }
                                }, { merge: true });
                                await updateDoc(userDocRef, { studioId: newStudioId, role: 'owner' });
                                return;
                            } catch (migErr) {
                                console.error('[Cameraman Pro] Migration failed:', migErr);
                            }
                        }

                        setUserProfile(data);
                        setStudioId(data.studioId);

                        // ── VERIFY-THEN-ACTION: Real-time eviction checking ──
                        // Only run eviction checks for staff roles (admin, manager, member, accountant, coordinator).
                        // Do not check owners (who own the studio) or clients (who are not workspace members).
                        const staffRoles = ['admin', 'manager', 'member', 'accountant', 'coordinator'];
                        if (data.studioId && staffRoles.includes(data.role)) {
                            const currentStudioIdVal = data.studioId;
                            if (currentSubscribedStudioId !== currentStudioIdVal) {
                                if (memberUnsub) {
                                    memberUnsub();
                                    memberUnsub = null;
                                }
                                currentSubscribedStudioId = currentStudioIdVal;

                                console.log('[Auth Context] Subscribing to workspace membership for staff eviction check:', currentStudioIdVal);
                                const memberDocRef = doc(db, 'workspaces', currentStudioIdVal, 'members', firebaseUser.uid);
                                memberUnsub = onSnapshot(memberDocRef, async (memberSnap) => {
                                    if (!memberSnap.exists()) {
                                        console.warn('[Cameraman Pro] Eviction detected! Membership document not found in workspaces subcollection.');
                                        
                                        // Purge all session details immediately
                                        clearWorkspaceSession();

                                        try {
                                            // Recovery: Find original personal studio or provision a new one
                                            const studiosRef = collection(db, "studios");
                                            const qStudios = query(studiosRef, where("ownerId", "==", firebaseUser.uid));
                                            const studioSnap = await getDocs(qStudios);
                                            let personalStudio = null;
                                            if (!studioSnap.empty) {
                                                personalStudio = studioSnap.docs[0].id;
                                            } else {
                                                personalStudio = generateStudioCode();
                                                await setDoc(doc(db, 'studios', personalStudio), {
                                                    name: firebaseUser.displayName ? `${firebaseUser.displayName}'s Studio` : 'My Studio',
                                                    ownerId: firebaseUser.uid,
                                                    createdAt: serverTimestamp(),
                                                    settings: { currency: 'INR' }
                                                }, { merge: true });
                                            }

                                            // Revert user document fields to personal studio and owner role
                                            console.log('[Cameraman Pro] Reverting user profile to personal studio owner:', personalStudio);
                                            await updateDoc(userDocRef, {
                                                studioId: personalStudio,
                                                role: 'owner',
                                                workspaceRole: null,
                                                workspacePermissions: null,
                                                workspaceStatus: 'removed',
                                                activeWorkspaceId: null,
                                                joinedWorkspaceId: null
                                            });
                                        } catch (err) {
                                            console.error('[Cameraman Pro] Error resetting user workspace fields:', err);
                                        }

                                        toast.error('Your access to this workspace has been revoked.');
                                        window.location.href = '/dashboard';
                                    }
                                }, (err) => {
                                    console.error('[Cameraman Pro] Error in membership listener:', err);
                                    if (err.code === 'permission-denied') {
                                        clearWorkspaceSession();
                                        toast.error('Your access to this workspace has been revoked.');
                                        window.location.href = '/dashboard';
                                    }
                                });
                            }
                        } else {
                            if (memberUnsub) {
                                memberUnsub();
                                memberUnsub = null;
                            }
                            currentSubscribedStudioId = null;
                        }
                    } else {
                        console.warn('[Auth State Transition] ROLE_NOT_FOUND: User profile does not exist in Firestore. Provisioning default profile.');
                        try {
                            await createNewUserProfile(firebaseUser);
                        } catch (err) {
                            console.error('[Cameraman Pro] Failed to provision default user profile:', err);
                            setUserProfile(null);
                            setStudioId(null);
                            setLoading(false);
                        }
                    }
                    setLoading(false);
                }, (err) => {
                    console.error('[Auth State Transition] ROLE_LOAD_ERROR: Error fetching user profile:', err);
                    setUserProfile(null);
                    setStudioId(null);
                    setLoading(false);
                });
            } else {
                console.log('[Auth State Transition] UNAUTHENTICATED: No firebase user. Clearing auth and role state.');
                setUser(null);
                setUserProfile(null);
                setStudioId(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsub();
            if (profileUnsub) profileUnsub();
            if (memberUnsub) memberUnsub();
        };
    }, []);

    const createNewUserProfile = async (fbUser: User) => {
        const isMaster = fbUser.email ? MASTER_OWNER_EMAILS.includes(fbUser.email) : false;
        const newStudioId = generateStudioCode();
        const studioName = isMaster
            ? "Cameraman Pro Master"
            : (fbUser.displayName ? `${fbUser.displayName}'s Studio` : "My Studio");

        await setDoc(doc(db, "studios", newStudioId), {
            name: studioName,
            ownerId: fbUser.uid,
            createdAt: serverTimestamp(),
            settings: {
                currency: 'INR',
                businessHours: { start: '09:00', end: '18:00' }
            }
        }, { merge: true });

        const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || (isMaster ? "Main Owner" : "New User"),
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || undefined,
            studioId: newStudioId,
            role: 'owner',
            createdAt: serverTimestamp() as any
        };

        await setDoc(doc(db, "users", fbUser.uid), newProfile);
        setUserProfile(newProfile);
        setStudioId(newStudioId);
    };

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({
                prompt: 'select_account'
            });

            const isNativeWrapper = Capacitor.isNativePlatform() || !!(window as any).Capacitor?.isNative || !!(window as any).Capacitor?.Plugins;

            if (isNativeWrapper) {
                const result = await FirebaseAuthentication.signInWithGoogle();
                const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                const fbUser = (await signInWithCredential(auth, credential)).user;
                const userDocRef = doc(db, "users", fbUser.uid);
                const userSnap = await getDoc(userDocRef);
                if (!userSnap.exists()) {
                    await createNewUserProfile(fbUser);
                }
            } else {
                const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobileBrowser) {
                    await signInWithRedirect(auth, provider);
                } else {
                    try {
                        const result = await signInWithPopup(auth, provider);
                        const fbUser = result.user;
                        const userDocRef = doc(db, "users", fbUser.uid);
                        const userSnap = await getDoc(userDocRef);
                        if (!userSnap.exists()) {
                            await createNewUserProfile(fbUser);
                        }
                    } catch (popupError: any) {
                        console.warn("[Auth] signInWithPopup failed, falling back to signInWithRedirect", popupError);
                        const code = popupError?.code;
                        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/operation-not-supported-in-this-environment') {
                            await signInWithRedirect(auth, provider);
                        } else {
                            throw popupError;
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Google login failed", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const loginWithEmail = async (email: string, password: string) => {
        try {
            setLoading(true);
            const result = await signInWithEmailAndPassword(auth, email, password);
            const userDocRef = doc(db, "users", result.user.uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                await createNewUserProfile(result.user);
            }
        } catch (error) {
            console.error("Email login failed", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const registerWithEmail = async (email: string, password: string, displayName: string) => {
        try {
            setLoading(true);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(result.user, { displayName });
            await createNewUserProfile({ ...result.user, displayName } as User);
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email: string) => {
        await sendPasswordResetEmail(auth, email);
    };

    const logout = async () => {
        console.log('[Cameraman Pro] Logging out — clearing all storage');
        clearWorkspaceSession();

        if (Capacitor.isNativePlatform()) {
            await FirebaseAuthentication.signOut();
        }
        await signOut(auth);
    };

    const joinTeam = async (teamCode: string) => {
        if (!user) throw new Error("User not authenticated");
        const normalizedCode = teamCode.toUpperCase().trim();
        if (!/^[A-Z2-9]{6}$/.test(normalizedCode)) {
            throw new Error("Invalid team code format. Must be 6 alphanumeric characters.");
        }

        console.log("[joinTeam] Attempting to join studio:", normalizedCode);
        console.log("[joinTeam] Current user:", user.uid);

        const studioRef = doc(db, "studios", normalizedCode);
        const studioSnap = await getDoc(studioRef);

        if (!studioSnap.exists()) {
            console.error("[joinTeam] Studio not found:", normalizedCode);
            throw new Error("Studio code not found. Please check the code and try again.");
        }

        const studioData = studioSnap.data();
        console.log("[joinTeam] Found studio:", studioData?.name, "owner:", studioData?.ownerId);

        if (studioData?.ownerId === user.uid) {
            throw new Error("You cannot join your own studio.");
        }

        // STEP 1: Add member document under workspaces/{normalizedCode}/members/{user.uid}
        const memberRef = doc(db, "workspaces", normalizedCode, "members", user.uid);
        await setDoc(memberRef, {
            uid: user.uid,
            userId: user.uid,
            workspaceId: normalizedCode,
            role: 'member',
            status: 'active',
            joinedAt: new Date().toISOString(),
            name: userProfile?.name || user.displayName || 'Team Member',
            email: user.email || ''
        }, { merge: true });

        // STEP 2: Update the joining user's profile to point to this studio as a 'member'
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            studioId: normalizedCode,
            role: 'member'
        });

        console.log("[joinTeam] Successfully joined studio. studioId set to:", normalizedCode);
    };

    return (
        <AuthContext.Provider value={{
            user,
            userProfile,
            studioId,
            loading,
            isOwner,
            isAdmin,
            isEditor,
            isClient,
            loginWithGoogle,
            loginWithEmail,
            registerWithEmail,
            resetPassword,
            logout,
            joinTeam,
            clearWorkspaceSession
        }}>
            {children}
        </AuthContext.Provider>
    );
};
