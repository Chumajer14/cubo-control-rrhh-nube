import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider.jsx";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
