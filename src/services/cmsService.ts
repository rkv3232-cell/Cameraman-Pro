import { db } from "../lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface ThemeConfig {
    primaryColor: string;
    secondaryColor: string;
    background: string;
    cardStyle: string;
    borderRadius: string;
    darkMode: boolean;
}

export const cmsService = {
    // Theme Config
    async getTheme(studioId: string): Promise<ThemeConfig | null> {
        const docRef = doc(db, `studios/${studioId}/themeConfig`, "main");
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) return snapshot.data() as ThemeConfig;
        return null;
    },
    async saveTheme(studioId: string, data: ThemeConfig) {
        const docRef = doc(db, `studios/${studioId}/themeConfig`, "main");
        await setDoc(docRef, data, { merge: true });
    }
};
