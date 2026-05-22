
import React from "react";
import { Navigate } from "react-router-dom";
import { getStoredAccessToken, getStoredRole, normalizeRole } from "./session";

/**
 * Protects a route by checking the role stored in localStorage after API login.
 * `role` prop should match the value stored (e.g. "admin", "super_admin").
 */
export default function RequireRole({ role, children }) {
  const storedRole = getStoredRole();
  const token = getStoredAccessToken();

  if (!token) return <Navigate to="/signin" replace />;

  if (storedRole !== normalizeRole(role)) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
