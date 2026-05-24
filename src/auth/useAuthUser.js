import { useEffect, useState } from "react";
import apiClient from "../api/apiClient";
import { getStoredAccessToken, normalizeRole } from "./session";

const EMPTY_STATE = {
  user: null,
  profile: null,
  role: null,
  raw: null,
  authLoading: true,
};

let cache = { ...EMPTY_STATE };
let inflight = null;
let started = false;
const listeners = new Set();

const notify = () => {
  for (const l of listeners) l(cache);
};

const buildFromMe = (data) => {
  const role = normalizeRole(data?.role || "");
  const userId = data?.userId || "";
  const fullName = data?.fullName || "";
  const email = data?.email || "";
  const profile = data?.profile ?? null;
  return {
    user: {
      uid: userId,
      id: userId,
      email,
      displayName: fullName,
      role,
      isActive: data?.isActive ?? true,
      mustChangePassword: data?.mustChangePassword ?? false,
    },
    profile,
    role,
    raw: data ?? null,
    authLoading: false,
  };
};

const fromLocalStorage = () => {
  const token = getStoredAccessToken();
  if (!token) return { ...EMPTY_STATE, authLoading: false };
  return {
    user: {
      uid: localStorage.getItem("userId") || "",
      id: localStorage.getItem("userId") || "",
      email: localStorage.getItem("userEmail") || "",
      displayName: localStorage.getItem("userName") || "",
      role: normalizeRole(localStorage.getItem("role") || ""),
    },
    profile: null,
    role: normalizeRole(localStorage.getItem("role") || ""),
    raw: null,
    authLoading: true,
  };
};

export async function refreshAuthUser() {
  const token = getStoredAccessToken();
  if (!token) {
    cache = { ...EMPTY_STATE, authLoading: false };
    inflight = null;
    notify();
    return cache;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await apiClient.get("/Auth/me");
      const data = res.data?.data ?? res.data;
      cache = buildFromMe(data);
    } catch {
      // Token may be invalid or backend down — keep what we have from storage
      cache = { ...fromLocalStorage(), authLoading: false };
    } finally {
      inflight = null;
      notify();
    }
    return cache;
  })();

  return inflight;
}

export function resetAuthUser() {
  cache = { ...EMPTY_STATE, authLoading: false };
  inflight = null;
  started = false;
  notify();
}

export function getAuthUserSnapshot() {
  return cache;
}

export function useAuthUser() {
  const [state, setState] = useState(() => {
    if (!cache.user && !started) return fromLocalStorage();
    return cache;
  });

  useEffect(() => {
    const listener = (next) => setState(next);
    listeners.add(listener);

    if (!started) {
      started = true;
      refreshAuthUser();
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    user: state.user,
    profile: state.profile,
    role: state.role,
    raw: state.raw,
    authLoading: state.authLoading,
    refresh: refreshAuthUser,
  };
}
