import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Bookings } from "./pages/Bookings";
import { BookingDetails } from "./pages/BookingDetails";
import { Calendar } from "./pages/Calendar";
import { Inventory } from "./pages/Inventory";
import { EquipmentDetails } from "./pages/EquipmentDetails";
import { Settings } from "./pages/Settings";
import { Trash } from "./pages/Trash";
import { Expenses } from "./pages/Expenses";
import { ExpenseDetail } from "./pages/ExpenseDetail";
import { Team } from "./pages/Team";
import { Analytics } from "./pages/Analytics";
import { AITools } from "./pages/AITools";
import { Enquiries } from "./pages/Enquiries";
import { GalleryAdmin } from "./pages/GalleryAdmin";
import { AdminReviews } from "./pages/admin/Reviews";
import { Home } from "./pages/public/Home";
import { Gallery } from "./pages/public/Gallery";
import { About } from "./pages/public/About";
import { Contact } from "./pages/public/Contact";
import BookNow from "./pages/public/BookNow";
import { PublicEnquiry } from "./pages/public/PublicEnquiry";
import { ClientPortal } from "./pages/public/ClientPortal";
import { TrackOrder } from "./pages/public/TrackOrder";
import { ClientDashboard } from "./pages/public/ClientDashboard";

function App() {
    return (
        <LanguageProvider>
            <ThemeProvider>
                <BrowserRouter>
                    <AuthProvider>
                        <Routes>
                            {/* Unified Auth */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/client/login" element={<Navigate to="/login" replace />} />

                            {/* Client Only Routes */}
                            <Route element={<ProtectedRoute allowedRoles={['client', 'owner']} />}>
                                <Route path="/client/dashboard" element={<ClientDashboard />} />
                            </Route>

                            {/* Studio Dashboard Routes (Staff & Owner) */}
                            <Route element={<ProtectedRoute allowedRoles={['owner', 'admin', 'photographer', 'assistant']} />}>
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
                            </Route>

                            {/* Shared Portal Access */}
                            <Route path="/client/:bookingId" element={<ClientPortal />} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </AuthProvider>
                </BrowserRouter>
            </ThemeProvider>
        </LanguageProvider>
    );
}

export default App;
