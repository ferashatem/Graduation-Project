import { useMemo } from "react";
import { getStoredAccessToken, getStoredRole } from "./session";

export function useAuthUser() {
  const user = useMemo(() => {
    const token = getStoredAccessToken();
    if (!token) return null;
    return {
      uid:         localStorage.getItem("userId")    || "",
      id:          localStorage.getItem("userId")    || "",
      email:       localStorage.getItem("userEmail") || "",
      displayName: localStorage.getItem("userName")  || "",
      role:        getStoredRole(),
    };
  }, []);

  return { user, authLoading: false };
}
