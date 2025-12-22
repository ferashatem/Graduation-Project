// src/auth/authHelpers.js
import { auth } from "../firebase/firebaseConfig";
import { getIdTokenResult } from "firebase/auth";

/**
 * Reads role from custom claims inside the ID token.
 */
export async function getCurrentUserRole() {
  const user = auth.currentUser;
  if (!user) return null;

  const tokenResult = await getIdTokenResult(user);
  return tokenResult?.claims?.role || null;
}

/**
 * Force refresh token (important after changing claims).
 */
export async function forceRefreshToken() {
  const user = auth.currentUser;
  if (!user) return null;

  const tokenResult = await getIdTokenResult(user, true);
  return tokenResult?.claims?.role || null;
}
