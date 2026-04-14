import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";

export function useAuthUser() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Force-refresh the token so custom claims (role) are always current.
        try { await u.getIdToken(true); } catch (_) {}
      }
      setUser(u || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  return { user, authLoading };
}
