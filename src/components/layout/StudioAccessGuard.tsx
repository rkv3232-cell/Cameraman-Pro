import { Outlet } from "react-router-dom";

// Studio password gate removed — Firebase Auth handles all access control
export const StudioAccessGuard = () => {
    return <Outlet />;
};
