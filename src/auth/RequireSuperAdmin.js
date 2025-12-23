import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { useAuthUser } from "./useAuthUser";

export default function RequireSuperAdmin({ children }) {
  const { user, authLoading } = useAuthUser();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!authLoading && user) {
        const token = await auth.currentUser.getIdTokenResult(true);
        if (mounted) setRole(token.claims.role || null);
      }
      if (mounted) setLoadingRole(false);
    })();
    return () => {
      mounted = false;
    };
  }, [authLoading, user]);

  if (authLoading || loadingRole) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "super_admin") return <Navigate to="/unauthorized" replace />;

  return children;
}
