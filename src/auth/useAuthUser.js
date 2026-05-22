import { useEffect, useState } from "react";
import { getStoredAccessToken, getStoredRole } from "./session";

function buildUser() {
  const token = getStoredAccessToken();
  if (!token) return null;
  return {
    uid:         localStorage.getItem("userId")    || "",
    id:          localStorage.getItem("userId")    || "",
    email:       localStorage.getItem("userEmail") || "",
    displayName: localStorage.getItem("userName")  || "",
    role:        getStoredRole(),
  };
}

export function useAuthUser() {
  const [user, setUser] = useState(buildUser);

  useEffect(() => {
    const handleStorage = () => setUser(buildUser());
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return { user, authLoading: false };
}
