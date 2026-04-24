import { createContext, useEffect, useState } from "react";

const STORAGE_KEY = "cameraman-language";

/** @typedef {'en' | 'hi'} Lang */
/** @typedef {{ lang: Lang; toggleLanguage: () => void }} LanguageContextValue */

/** @type {LanguageContextValue} */
const defaultLanguageContextValue = {
    lang: "en",
    toggleLanguage: () => {},
};

const LanguageContext = createContext(defaultLanguageContextValue);

/** @returns {Lang} */
const getInitialLang = () => {
    if (typeof window === "undefined") {
        return "en";
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "hi" ? "hi" : "en";
};

export const LanguageProvider = ({ children }) => {
    const [lang, setLang] = useState(getInitialLang);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }
        window.localStorage.setItem(STORAGE_KEY, lang);
    }, [lang]);

    const toggleLanguage = () => {
        setLang((current) => (current === "en" ? "hi" : "en"));
    };

    return (
        <LanguageContext.Provider value={{ lang, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export default LanguageContext;
