import { Outlet, Link, useLocation } from "react-router-dom";
import { Camera, Menu, X, Instagram, Facebook, Youtube } from "lucide-react";
import { useContext, useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import ThemeToggle from "../ui/ThemeToggle";
import LanguageContext from "../../context/LanguageContext";
import { text } from "../../utils/text";
import { CustomerBabu } from "../ai/CustomerBabu";

export const PublicLayout = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();

    const { lang, toggleLanguage } = useContext(LanguageContext);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const navLinks = [
        { key: "home", path: "/" },
        { key: "gallery", path: "/gallery" },
        { key: "about", path: "/about" },
        { key: "contact", path: "/contact" },
    ] as const;

    const extraLinks = [
        { label: "📦 Track Order", labelHi: "📦 ट्रैक", path: "/track" },
        { label: "👤 Client Login", labelHi: "👤 लॉगिन", path: "/client/login" },
    ];

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans antialiased selection:bg-[var(--accent-primary)] selection:text-white flex flex-col">

            {/* Navbar */}
            <nav
                className="sticky top-0 w-full z-50 transition-all duration-300 bg-white/70 dark:bg-black/60 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm py-4"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg transform group-hover:scale-105 transition-all">
                                <Camera size={24} className="text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Cameraman Pro</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-6">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-semibold transition-colors hover:text-[var(--accent-primary)]",
                                        location.pathname === link.path
                                            ? "text-[var(--accent-primary)]"
                                            : "text-gray-700 dark:text-gray-200"
                                    )}
                                >
                                    {text.nav[link.key][lang]}
                                </Link>
                            ))}
                            {extraLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-semibold transition-colors hover:text-[var(--accent-primary)]",
                                        location.pathname === link.path
                                            ? "text-[var(--accent-primary)]"
                                            : "text-gray-700 dark:text-gray-200"
                                    )}
                                >
                                    {lang === 'hi' ? link.labelHi : link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Actions */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold hover:border-[var(--accent-primary)] transition-all bg-transparent text-gray-900 dark:text-white"
                            >
                                {lang === "en" ? "हिंदी" : "English"}
                            </button>
                            <ThemeToggle />
                            <Link
                                to="/enquiry"
                                className="px-6 py-2.5 rounded-full bg-[var(--accent-primary)] text-white text-sm font-bold shadow-lg shadow-[var(--accent-primary)]/20 hover:shadow-[var(--accent-primary)]/40 hover:-translate-y-0.5 transition-all"
                            >
                                {text.shared.bookNow[lang]}
                            </Link>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-3">
                            <button
                                onClick={toggleLanguage}
                                className="px-3 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-xs font-semibold transition-all hover:border-[var(--accent-primary)] text-gray-900 dark:text-white"
                            >
                                {lang === "en" ? "हिंदी" : "English"}
                            </button>
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-900 dark:text-white p-2"
                            >
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav */}
                <div
                    className={cn(
                        "md:hidden absolute top-full left-0 w-full bg-[var(--surface-base)] border-b border-[var(--border-light)] overflow-hidden transition-all duration-300 ease-in-out",
                        mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                    )}
                >
                    <div className="px-4 py-6 flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "text-lg font-medium py-2 border-b border-[var(--border-light)]",
                                    location.pathname === link.path
                                        ? "text-[var(--accent-primary)]"
                                        : "text-[var(--text-secondary)]"
                                )}
                            >
                                {text.nav[link.key][lang]}
                            </Link>
                        ))}
                        {extraLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "text-base font-medium py-2 border-b border-[var(--border-light)]",
                                    location.pathname === link.path
                                        ? "text-[var(--accent-primary)]"
                                        : "text-[var(--text-secondary)]"
                                )}
                            >
                                {lang === 'hi' ? link.labelHi : link.label}
                            </Link>
                        ))}
                        <Link
                            to="/enquiry"
                            className="mt-4 px-5 py-3 rounded-xl bg-[var(--accent-primary)] text-white text-center font-bold shadow-lg"
                        >
                            {text.shared.bookEvent[lang]}
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow">
                <Outlet />
            </main>

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/918601343232?text=Hello%20Cameraman%20Pro"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-green-500 shadow-xl shadow-green-500/40 flex items-center justify-center hover:scale-110 transition-all group"
                title="Chat on WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
            </a>

            {/* Customer AI */}
            <CustomerBabu />

            {/* Premium Footer */}
            <footer className="bg-[var(--surface-base)] border-t border-[var(--border-light)] pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                    <Camera size={20} className="text-white" />
                                </div>
                                <span className="font-bold text-lg tracking-tight">Cameraman Pro</span>
                            </Link>
                            <p className="text-[var(--text-secondary)] mb-6 max-w-sm">
                                Elevating moments into cinematic masterpieces. We specialize in luxury weddings, aerial cinematography, and timeless portraits.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--accent-primary)] hover:text-white transition-colors text-[var(--text-secondary)]">
                                    <Instagram size={20} />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-blue-600 hover:text-white transition-colors text-[var(--text-secondary)]">
                                    <Facebook size={20} />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-[var(--bg-secondary)] hover:bg-red-600 hover:text-white transition-colors text-[var(--text-secondary)]">
                                    <Youtube size={20} />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Quick Links</h4>
                            <ul className="space-y-3 text-[var(--text-secondary)]">
                                <li><Link to="/gallery" className="hover:text-[var(--accent-primary)] transition-colors">Portfolio Gallery</Link></li>
                                <li><Link to="/about" className="hover:text-[var(--accent-primary)] transition-colors">Our Story</Link></li>
                                <li><Link to="/contact" className="hover:text-[var(--accent-primary)] transition-colors">Contact Us</Link></li>
                                <li><Link to="/login" className="hover:text-[var(--accent-primary)] transition-colors">Studio Login</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold mb-4 uppercase text-sm tracking-wider">Contact</h4>
                            <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
                                <li>Chandan Kumar Verma</li>
                                <li>+91 8601343232</li>
                                <li className="pt-2 italic">Ghazipur, India</li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-[var(--border-light)] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-[var(--text-tertiary)]">
                            &copy; {new Date().getFullYear()} Cameraman Pro. All rights reserved.
                        </p>
                        <p className="text-sm text-[var(--text-tertiary)]">
                            Designed for modern visual artists.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PublicLayout;
