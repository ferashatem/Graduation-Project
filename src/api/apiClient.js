
import axios from "axios";
import {
  clearStoredSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  persistAuthSession,
} from "../auth/session";

const apiClient = axios.create({
  baseURL: "https://universitymanagementsystem-production-e58e.up.railway.app/api",
});

const refreshClient = axios.create({
  baseURL: "https://universitymanagementsystem-production-e58e.up.railway.app/api",
});

let refreshRequest = null;

const shouldSkipRefresh = (config) => {
  const url = String(config?.url || "").toLowerCase();

  return (
    config?._skipAuthRefresh ||
    url.includes("/auth/refresh-token") ||
    url.includes("/auth/login")
  );
};

const redirectToSignIn = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/signin") {
    window.location.replace("/signin");
  }
};

const refreshAccessToken = async () => {
  const token = getStoredAccessToken();
  const refreshToken = getStoredRefreshToken();

  if (!token || !refreshToken) {
    throw new Error("Session expired.");
  }

  if (!refreshRequest) {
    refreshRequest = refreshClient
      .post("/auth/refresh-token", { token, refreshToken })
      .then((response) => {
        const nextSession = persistAuthSession(response.data);

        if (!nextSession?.token) {
          throw new Error("Invalid refresh token response.");
        }

        return nextSession;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
};

// Attach token to every request automatically
apiClient.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      !error.response ||
      error.response.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest)
    ) {
      throw error;
    }

    try {
      const nextSession = await refreshAccessToken();

      originalRequest._retry = true;
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextSession.token}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearStoredSession();
      redirectToSignIn();
      throw refreshError;
    }
  },
);

export default apiClient;
