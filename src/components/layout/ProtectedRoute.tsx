import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
    /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
    allowedRoles?: Array<'owner' | 'admin' | 'photographer' | 'assistant' | 'client'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
    const { user, userProfile, loading } = useAuth();

    // 1. Show spinner while Firebase resolves auth state or profile is fetching
    if (loading || (user && !userProfile)) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-4">
                <div className="relative">
                    <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                </div>
                <p className="text-slate-500 text-sm font-medium animate-pulse">Securing session…</p>
            </div>
        );
    }

    // 2. Not logged in → redirect to login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // 3. Role check — Enforced if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        if (!userProfile) {
            return <Navigate to="/login" replace />;
        }

        const { isOwner } = useAuth();

        // Owner always has access to everything
        const hasAccess = isOwner || allowedRoles.includes(userProfile.role);

        if (!hasAccess) {
            // Logged in but unauthorized for this specific role
            const redirectPath = userProfile.role === 'client' ? '/client/dashboard' : '/dashboard';
            return <Navigate to={redirectPath} replace />;
        }
    }

    return <Outlet />;
};
