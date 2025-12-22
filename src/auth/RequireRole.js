// src/auth/RequireRole.jsx
import React, { useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuthUser } from "./useAuthUser";

export default function RequireRole({ allowedRoles, children }) {
  const { user, role, loading } = useAuthUser();

  const canAccess = useMemo(() => {
    if (!user) return false;
    if (!role) return false;
    return allowedRoles.includes(role);
  }, [user, role, allowedRoles]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (!canAccess) return <Navigate to="/not-authorized" replace />;

  return children;
}
