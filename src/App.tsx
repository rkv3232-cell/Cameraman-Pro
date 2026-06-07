import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { UpdateManager } from "./components/common/UpdateManager";
import { Capacitor } from "@capacitor/core";

// Static Load Auth Pages (to prevent dynamic import failures on LAN/Mobile)
import { Login } from "./pages/Login";
import { ClientLogin } from "./pages/public/ClientLogin";

// Lazy Load Pages
const Dashboard = lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
import { Bookings } from "./pages/Bookings";
const BookingDetails = lazy(() => import("./pages/BookingDetails").then(m => ({ default: m.BookingDetails })));
const Calendar = lazy(() => import("./pages/Calendar").then(m => ({ default: m.Calendar })));
const Inventory = lazy(() => import("./pages/Inventory").then(m => ({ default: m.Inventory })));
const EquipmentDetails = lazy(() => import("./pages/EquipmentDetails").then(m => ({ default: m.EquipmentDetails })));
const Settings = lazy(() => import("./pages/Settings").then(m => ({ default: m.Settings })));
const Trash = lazy(() => import("./pages/Trash").then(m => ({ default: m.Trash })));
const Expenses = lazy(() => import("./pages/Expenses").then(m => ({ default: m.Expenses })));
const ExpenseDetail = lazy(() => import("./pages/ExpenseDetail").then(m => ({ default: m.ExpenseDetail })));
const Team = lazy(() => import("./pages/Team").then(m => ({ default: m.Team })));
const Analytics = lazy(() => import("./pages/Analytics").then(m => ({ default: m.Analytics })));
const AITools = lazy(() => import("./pages/AITools").then(m => ({ default: m.AITools })));
const Enquiries = lazy(() => import("./pages/Enquiries").then(m => ({ default: m.Enquiries })));
const GalleryAdmin = lazy(() => import("./pages/GalleryAdmin").then(m => ({ default: m.GalleryAdmin })));
const AdminReviews = lazy(() => import("./pages/admin/Reviews").then(m => ({ default: m.AdminReviews })));
const UpcomingShoots = lazy(() => import("./pages/UpcomingShoots").then(m => ({ default: m.UpcomingShoots })));
const CompletedShoots = lazy(() => import("./pages/CompletedShoots").then(m => ({ default: m.CompletedShoots })));
const PhotoSessions = lazy(() => import("./pages/PhotoSessions").then(m => ({ default: m.PhotoSessions })));
const PhotoSessionManager = lazy(() => import("./pages/PhotoSessionManager").then(m => ({ default: m.PhotoSessionManager })));

// Crew & Operations System
const CrewDashboard = lazy(() => import("./pages/crew/CrewDashboard").then(m => ({ default: m.CrewDashboard })));
const AttendanceManager = lazy(() => import("./pages/crew/AttendanceManager").then(m => ({ default: m.AttendanceManager })));
const EventHistoryManager = lazy(() => import("./pages/crew/EventHistoryManager").then(m => ({ default: m.EventHistoryManager })));

// Public Pages
const Home = lazy(() => import("./pages/public/Home").then(m => ({ default: m.Home })));
const Gallery = lazy(() => import("./pages/public/Gallery").then(m => ({ default: m.Gallery })));
const About = lazy(() => import("./pages/public/About").then(m => ({ default: m.About })));
const Contact = lazy(() => import("./pages/public/Contact").then(m => ({ default: m.Contact })));
const BookNow = lazy(() => import("./pages/public/BookNow"));
const PublicEnquiry = lazy(() => import("./pages/public/PublicEnquiry").then(m => ({ default: m.PublicEnquiry })));
const ClientPortal = lazy(() => import("./pages/public/ClientPortal").then(m => ({ default: m.ClientPortal })));
const TrackOrder = lazy(() => import("./pages/public/TrackOrder").then(m => ({ default: m.TrackOrder })));
const ClientDashboard = lazy(() => import("./pages/public/ClientDashboard").then(m => ({ default: m.ClientDashboard })));
const SelectionPortal = lazy(() => import("./pages/select/SelectionPortal").then(m => ({ default: m.SelectionPortal })));
const StaffPublicProfile = lazy(() => import("./pages/public/StaffPublicProfile").then(m => ({ default: m.StaffPublicProfile })));
const LandingPageTemplate = lazy(() => import("./pages/public/LandingPageTemplate").then(m => ({ default: m.LandingPageTemplate })));
const Pricing = lazy(() => import("./pages/public/Pricing").then(m => ({ default: m.Pricing })));
const FreeTrial = lazy(() => import("./pages/public/FreeTrial").then(m => ({ default: m.FreeTrial })));
const BookDemo = lazy(() => import("./pages/public/BookDemo").then(m => ({ default: m.BookDemo })));
const CaseStudies = lazy(() => import("./pages/public/CaseStudies").then(m => ({ default: m.CaseStudies })));
const Resources = lazy(() => import("./pages/public/Resources").then(m => ({ default: m.Resources })));
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { useLocation } from "react-router-dom";

function AnalyticsTracker() {
    const location = useLocation();

    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('config', 'G-KH2WE53E3L', {
                page_path: location.pathname + location.search,
                page_title: document.title,
            });
        }
    }, [location]);

    return null;
}

function App() {
    useEffect(() => {
        const setupStatusBar = async () => {
            if (Capacitor.isNativePlatform()) {
                try {
                    const { StatusBar } = await import('@capacitor/status-bar');
                    await StatusBar.setOverlaysWebView({ overlay: false });
                } catch (e) {
                    console.error("Capacitor StatusBar error:", e);
                }
            }
        };
        setupStatusBar();
    }, []);

    return (
        <LanguageProvider>
            <UpdateManager />
            <ThemeProvider>
                <BrowserRouter>
                    <AnalyticsTracker />
                    <AuthProvider>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                                {/* Unified Auth */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/client/login" element={<ClientLogin />} />

                                {/* Client Only Routes */}
                                <Route element={<ProtectedRoute allowedRoles={['client', 'owner']} />}>
                                    <Route path="/client/dashboard" element={<ClientDashboard />} />
                                </Route>

                                {/* Studio Dashboard Routes (Staff & Owner) */}
                                <Route element={<ProtectedRoute allowedRoles={['owner', 'admin', 'manager', 'member', 'accountant', 'coordinator']} />}>
                                    <Route element={<Layout />}>
                                        <Route path="/dashboard" element={<Dashboard />} />
                                        <Route path="/bookings" element={<Bookings />} />
                                        <Route path="/bookings/:bookingId" element={<BookingDetails />} />
                                        <Route path="/calendar" element={<Calendar />} />
                                        <Route path="/inventory" element={<Inventory />} />
                                        <Route path="/inventory/:equipmentId" element={<EquipmentDetails />} />
                                        <Route path="/trash" element={<Trash />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="/expenses" element={<Expenses />} />
                                        <Route path="/expenses/:expenseId" element={<ExpenseDetail />} />
                                        <Route path="/team" element={<Team />} />
                                        <Route path="/analytics" element={<Analytics />} />
                                        <Route path="/ai-tools" element={<AITools />} />
                                        <Route path="/upcoming-shoots" element={<UpcomingShoots />} />
                                        <Route path="/completed-shoots" element={<CompletedShoots />} />

                                        {/* ── Phase 1: Workflow Routes ── */}
                                        <Route path="/studio/photo-sessions" element={<PhotoSessions />} />
                                        <Route path="/studio/photo-sessions/:sessionId" element={<PhotoSessionManager />} />

                                        {/* ── Crew & Operations System ── */}
                                        <Route path="/crew" element={<CrewDashboard />} />
                                        <Route path="/crew/attendance" element={<AttendanceManager />} />
                                        <Route path="/crew/events" element={<EventHistoryManager />} />
                                        <Route path="/identity" element={<Navigate to="/crew" replace />} />

                                        {/* OWNER ONLY ROUTES */}
                                        <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                                            <Route path="/enquiries" element={<Enquiries />} />
                                            <Route path="/reviews" element={<AdminReviews />} />
                                            <Route path="/studio-gallery" element={<GalleryAdmin />} />
                                        </Route>

                                        <Route path="/studio" element={<Navigate to="/dashboard" replace />} />
                                    </Route>
                                </Route>

                                {/* Public Website Routes */}
                                <Route element={<PublicLayout />}>
                                    <Route index element={<Home />} />
                                    <Route path="/book-now" element={<BookNow />} />
                                    <Route path="/gallery" element={<Gallery />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/contact" element={<Contact />} />
                                    <Route path="/enquiry" element={<PublicEnquiry />} />
                                    <Route path="/track" element={<TrackOrder />} />
                                    <Route path="/pricing" element={<Pricing />} />
                                    <Route path="/free-trial" element={<FreeTrial />} />
                                    <Route path="/book-demo" element={<BookDemo />} />
                                    <Route path="/case-studies" element={<CaseStudies />} />
                                    <Route path="/resources" element={<Resources />} />
                                    <Route path="/software/:slug" element={<LandingPageTemplate />} />
                                </Route>

                                {/* Shared Portal Access */}
                                <Route path="/client/:bookingId" element={<ClientPortal />} />

                                {/* ── Phase 1: Public Selection Portal (no auth needed) ── */}
                                <Route path="/select/:accessCode" element={<SelectionPortal />} />
                                <Route path="/s/:accessCode" element={<SelectionPortal />} />

                                {/* ── Identity System: Public Staff Verification (no auth needed) ── */}
                                <Route path="/staff/:employeeId" element={<StaffPublicProfile />} />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" replace />} />
                            </Routes>
                        </Suspense>
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        </LanguageProvider>
    );
}

export default App;
