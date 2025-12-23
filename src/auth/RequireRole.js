import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function RequireRole({ role, children }) {
  const [loading, setLoading] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setOk(false);
        setLoading(false);
        return;
      }
      const tokenResult = await user.getIdTokenResult(true);
      setOk(tokenResult.claims?.role === role);
      setLoading(false);
    });

    return () => unsub();
  }, [role]);

  if (loading) return <div>Loading...</div>;
  if (!ok) return <Navigate to="/not-allowed" replace />;
  return children;
}
