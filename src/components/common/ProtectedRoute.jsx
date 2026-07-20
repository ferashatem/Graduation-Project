
import { Navigate } from "react-router-dom";
import {
  getStoredAccessToken,
  getStoredRole,
  normalizeRole,
} from "../../auth/session";

/**
 * Protects a route by checking the token and role stored in localStorage.
 * `requiredRole` should match the value stored (case-insensitive).
 */
function ProtectedRoute({ children, requiredRole, redirectTo = "/signin" }) {
  const token = getStoredAccessToken();
  const storedRole = getStoredRole();

  if (!token) return <Navigate to={redirectTo} replace />;

  if (requiredRole && storedRole !== normalizeRole(requiredRole)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
