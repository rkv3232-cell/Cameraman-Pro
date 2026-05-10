import { createContext, useEffect, useState, ReactNode } from "react";
import {
    User,
    onAuthStateChanged,
    signInWithPopup,
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
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { UserProfile } from "../types";

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

    // Role helpers derived from userProfile
    const isOwner = userProfile?.role === 'owner' || (userProfile?.email ? MASTER_OWNER_EMAILS.includes(userProfile.email) : false);
    const isAdmin = ['owner', 'admin'].includes(userProfile?.role ?? '');
    const isEditor = ['owner', 'admin', 'photographer'].includes(userProfile?.role ?? '');
    const isClient = userProfile?.role === 'client';

    useEffect(() => {
        let profileUnsub: (() => void) | null = null;

        const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (profileUnsub) {
                profileUnsub();
                profileUnsub = null;
            }

            if (firebaseUser) {
                setUser(firebaseUser);
                const userDocRef = doc(db, "users", firebaseUser.uid);
                profileUnsub = onSnapshot(userDocRef, (snap) => {
                    if (snap.exists()) {
                        let data = snap.data() as UserProfile;

                        // MASTER OVERRIDE: Ensure owners always have the role
                        const isMaster = data.email ? MASTER_OWNER_EMAILS.includes(data.email) : false;
                        if (isMaster) {
                            data = {
                                ...data,
                                role: 'owner'
                            };
                        }

                        setUserProfile(data);
                        setStudioId(data.studioId);
                    } else {
                        setUserProfile(null);
                        setStudioId(null);
                    }
                    setLoading(false);
                }, () => {
                    setLoading(false);
                });
            } else {
                setUser(null);
                setUserProfile(null);
                setStudioId(null);
                setLoading(false);
            }
        });

        return () => {
            authUnsub();
            if (profileUnsub) profileUnsub();
        };
    }, []);

    const createNewUserProfile = async (fbUser: User) => {
        const isMaster = fbUser.email ? MASTER_OWNER_EMAILS.includes(fbUser.email) : false;
        const role = isMaster ? 'owner' : 'client';

        // Use a real studioId format even for masters, or they can join one later.
        // For masters, we'll generate a fresh code just like a studio.
        const newStudioId = isMaster ? generateStudioCode() : `CLIENT_${fbUser.uid.slice(0, 5)}`;

        if (isMaster) {
            // Create the Master Studio record if it doesn't exist
            await setDoc(doc(db, "studios", newStudioId), {
                name: "Cameraman Pro Master",
                ownerId: fbUser.uid,
                createdAt: serverTimestamp(),
                settings: {
                    currency: 'INR',
                    businessHours: { start: '09:00', end: '18:00' }
                }
            }, { merge: true });
        }

        const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || (isMaster ? "Main Owner" : "Client User"),
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || undefined,
            studioId: newStudioId,
            role: role as any,
            createdAt: serverTimestamp() as any
        };

        await setDoc(doc(db, "users", fbUser.uid), newProfile);
        setUserProfile(newProfile);
        setStudioId(newStudioId);
    };

    const loginWithGoogle = async () => {
        try {
            setLoading(true);
            let fbUser: User;
            const provider = new GoogleAuthProvider();

            // When loading from a remote URL, the bundled Capacitor might not detect native correctly.
            // Explicitly checking window.Capacitor object injected by the native wrapper.
            const isNativeWrapper = Capacitor.isNativePlatform() || !!(window as any).Capacitor?.isNative;

            if (isNativeWrapper) {
                const result = await FirebaseAuthentication.signInWithGoogle();
                const credential = GoogleAuthProvider.credential(result.credential?.idToken);
                const authResult = await signInWithCredential(auth, credential);
                fbUser = authResult.user;
            } else {
                // In normal web browser
                const result = await signInWithPopup(auth, provider);
                fbUser = result.user;
            }

            const userDocRef = doc(db, "users", fbUser.uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
                await createNewUserProfile(fbUser);
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
        if (Capacitor.isNativePlatform()) {
            await FirebaseAuthentication.signOut();
        }
        await signOut(auth);
        if (typeof window !== "undefined") {
            sessionStorage.clear();
        }
    };

    const joinTeam = async (teamCode: string) => {
        if (!user) throw new Error("User not authenticated");
        if (!/^[A-Z2-9]{6}$/.test(teamCode.toUpperCase())) {
            throw new Error("Invalid team code format. Must be 6 characters.");
        }
        const normalizedCode = teamCode.toUpperCase();
        const studioRef = doc(db, "studios", normalizedCode);
        const studioSnap = await getDoc(studioRef);
        if (!studioSnap.exists()) {
            throw new Error("Team code not found.");
        }
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
            studioId: normalizedCode,
            role: 'assistant'
        });
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
            joinTeam
        }}>
            {children}
        </AuthContext.Provider>
    );
};
