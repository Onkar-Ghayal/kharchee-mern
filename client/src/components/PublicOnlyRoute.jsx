import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Blocks logged-in users from viewing login/register pages
export default function PublicOnlyRoute({ children }) {
    const { isLoggedIn } = useAuth();
    if (isLoggedIn) {
        return <Navigate to="/dashboard" replace />;
    }
    return children;
}
