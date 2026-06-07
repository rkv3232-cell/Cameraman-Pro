import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyD1I_UuatLVl8voku0M-E6TRr-GQeQhKZ0",
    authDomain: "cameraman-pro-2aa2b.firebaseapp.com",
    databaseURL: "https://cameraman-pro-2aa2b-default-rtdb.firebaseio.com",
    projectId: "cameraman-pro-2aa2b",
    storageBucket: "cameraman-pro-2aa2b.appspot.com",
    messagingSenderId: "35359737634",
    appId: "1:35359737634:web:e280b0e951ef77e295877b",
    measurementId: "G-KH2WE53E3L"
};

// Initialize Firebase once, safe for Vite HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
