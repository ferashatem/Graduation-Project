import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export default function RequireRole({ role, children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthed(false);
        setOk(false);
        setLoading(false);
        return;
      }
      const tokenResult = await user.getIdTokenResult(true);
      setIsAuthed(true);
      setOk(tokenResult.claims?.role === role);
      setLoading(false);
    });

    return () => unsub();
  }, [role]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthed) return <Navigate to="/" replace />;
  if (!ok) return <Navigate to="/not-allowed" replace />;
  return children;
}
