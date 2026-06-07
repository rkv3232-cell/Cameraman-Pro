import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { LoadingSpinner } from "../common/LoadingSpinner";

interface ProtectedRouteProps {
    /** Roles allowed to access this route. If empty, any authenticated user is allowed. */
    allowedRoles?: Array<'owner' | 'admin' | 'manager' | 'member' | 'accountant' | 'coordinator' | 'client'>;
}

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps = {}) => {
    const { user, userProfile, loading, isOwner } = useAuth();

    console.log('[ProtectedRoute] Evaluation -', {
        loading,
        userId: user?.uid || null,
        role: userProfile?.role || null,
        isOwner,
        allowedRoles
    });

    // 1. Show spinner while auth state or profile is fetching
    if (loading) {
        console.log('[ProtectedRoute] Auth/Role is loading. Showing splash screen.');
        return <LoadingSpinner />;
    }

    // 2. Not logged in → redirect to login
    if (!user) {
        console.log('[ProtectedRoute] No user found. Redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // 3. No user profile but authenticated (database sync/permission issue) -> redirect to login
    if (!userProfile) {
        console.warn('[ProtectedRoute] User is authenticated but userProfile is missing. Redirecting to /login');
        return <Navigate to="/login" replace />;
    }

    // 4. Role check — Enforced if allowedRoles is specified
    if (allowedRoles && allowedRoles.length > 0) {
        // Owner always has access to everything
        const hasAccess = isOwner || allowedRoles.includes(userProfile.role);

        if (!hasAccess) {
            // Logged in but unauthorized for this specific role
            const redirectPath = userProfile.role === 'client' ? '/client/dashboard' : '/dashboard';
            console.log(`[ProtectedRoute] Access Denied for role "${userProfile.role}". Allowed: ${allowedRoles.join(', ')}. Redirecting to ${redirectPath}`);
            return <Navigate to={redirectPath} replace />;
        }
    }

    console.log('[ProtectedRoute] Access Granted.');
    return <Outlet />;
};
