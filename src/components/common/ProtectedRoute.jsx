import { Navigate } from "react-router-dom";

/**
 * Protects a route by checking the token and role stored in localStorage.
 * `requiredRole` should match the value stored (case-insensitive).
 */
function ProtectedRoute({ children, requiredRole, redirectTo = "/signin" }) {
  const token = localStorage.getItem("token");
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();

  if (!token) return <Navigate to={redirectTo} replace />;

  if (requiredRole && storedRole !== requiredRole.toLowerCase()) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

export default ProtectedRoute;
