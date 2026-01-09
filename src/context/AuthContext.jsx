import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { onAuthStateChanged, getIdTokenResult } from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes and get custom claims
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const tokenResult = await getIdTokenResult(firebaseUser, true);
        setUser(firebaseUser);
        setRole(tokenResult.claims.role || null);
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Optionally, a function to refresh the token/role
  const refreshUser = async () => {
    if (auth.currentUser) {
      const tokenResult = await getIdTokenResult(auth.currentUser, true);
      setRole(tokenResult.claims.role || null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
