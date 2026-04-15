import React from "react";
import { Navigate } from "react-router-dom";

/**
 * Protects a route by checking the role stored in localStorage after API login.
 * `role` prop should match the value stored (e.g. "admin", "super_admin").
 */
export default function RequireRole({ role, children }) {
  const storedRole = (localStorage.getItem("role") || "").toLowerCase();
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/signin" replace />;

  // Normalise "superadmin" / "super_admin" differences
  const normalise = (r) => r.replace(/[\s_]/g, "").toLowerCase();

  if (normalise(storedRole) !== normalise(role)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
