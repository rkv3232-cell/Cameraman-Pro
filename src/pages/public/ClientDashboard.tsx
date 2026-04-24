import { useAuth } from "../../hooks/useAuth";
import { useClientBookings } from "../../hooks/useClientBookings";
import { LogOut, Camera, Calendar, Clock, ChevronRight, MessageSquare, Star, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { Logo } from "../../components/layout/Logo";

export const ClientDashboard = () => {
    const { userProfile, logout } = useAuth();
    const { bookings, loading } = useClientBookings();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
            {/* Header */}
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Logo size="md" />
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400 hidden sm:block">Welcome, {userProfile?.name}</span>
                        <button
                            onClick={() => logout()}
                            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                        Your Visual Journey
                    </h1>
                    <p className="text-slate-400 max-w-2xl">
                        Welcome to your personal studio space. Here you can track your upcoming shoots, view your galleries, and manage your bookings with Cameraman Pro.
                    </p>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: My Bookings */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Calendar className="text-orange-500" size={22} />
                                My Bookings
                            </h2>
                        </div>

                        {loading ? (
                            <div className="grid gap-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-32 bg-slate-900/50 rounded-2xl animate-pulse border border-slate-800" />
                                ))}
                            </div>
                        ) : bookings.length > 0 ? (
                            <div className="grid gap-4">
                                {bookings.map(booking => (
                                    <Link
                                        key={booking.id}
                                        to={`/client/${booking.id}`}
                                        className="group bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all duration-300"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="px-3 py-1 bg-orange-500/10 text-orange-500 text-[10px] font-bold uppercase tracking-wider rounded-full border border-orange-500/20">
                                                        {booking.eventType}
                                                    </span>
                                                    <span className="text-slate-500 text-xs font-mono">ID: {booking.id.slice(0, 8)}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                                                    {booking.venue || "Studio Session"}
                                                </h3>
                                                <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock size={14} className="text-slate-500" />
                                                        {format(booking.eventDate.toDate(), 'MMMM dd, yyyy')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 font-medium text-emerald-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                        {booking.status}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-xs text-slate-500 uppercase font-bold">Portal Access</p>
                                                    <p className="text-sm text-white font-medium">View Media</p>
                                                </div>
                                                <div className="p-3 bg-slate-800 rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-3xl p-12 text-center">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Camera className="text-slate-600" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-slate-300">No bookings yet</h3>
                                <p className="text-slate-500 text-sm mt-2 mb-6">When you book a shoot with us using this email address, it will appear here automatically.</p>
                                <Link to="/book-now" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20">
                                    Book Your First Shoot
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Quick Links & Info */}
                    <div className="space-y-8">
                        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-3xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="text-indigo-400" size={18} />
                                Quick Links
                            </h3>
                            <div className="grid gap-3">
                                <Link to="/gallery" className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800 transition">
                                    <ImageIcon size={18} className="text-indigo-400" />
                                    <span className="text-sm font-medium">Public Gallery</span>
                                </Link>
                                <Link to="/enquiry" className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800 transition">
                                    <MessageSquare size={18} className="text-emerald-400" />
                                    <span className="text-sm font-medium">New Enquiry</span>
                                </Link>
                                <Link to="/about" className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl hover:bg-slate-800 transition">
                                    <Star size={18} className="text-yellow-400" />
                                    <span className="text-sm font-medium">About Cameraman Pro</span>
                                </Link>
                            </div>
                        </div>

                        <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Need Help?</h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center">
                                        <MessageSquare size={18} className="text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Contact Studio</p>
                                        <p className="text-xs text-slate-500">+91 99999 88888</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Our support team is available Mon-Sat, 10 AM to 7 PM. Feel free to reach out for any queries regarding your photos or bookings.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="max-w-7xl mx-auto px-4 py-8 border-t border-slate-900 text-center text-slate-600 text-xs">
                &copy; {new Date().getFullYear()} Cameraman Pro. All rights reserved. Professional Studio Management.
            </footer>
        </div>
    );
};

// Internal icons helper
const Sparkles = ({ ...props }) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>;
