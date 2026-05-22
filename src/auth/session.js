const SESSION_KEYS = [
  "token",
  "refreshToken",
  "role",
  "userName",
  "userEmail",
  "userId",
];

export const normalizeRole = (role = "") => {
  const value = String(role).trim().replace(/[\s-]/g, "_").toLowerCase();

  switch (value) {
    case "superadmin":
    case "super_admin":
      return "super_admin";
    case "admin":
      return "admin";
    case "doctor":
    case "professor":
      return "professor";
    case "teachingassistant":
    case "teaching_assistant":
    case "assistant":
      return "assistant";
    case "student":
      return "student";
    default:
      return value;
  }
};

export const getStoredAccessToken = () => localStorage.getItem("token") || "";

export const getStoredRefreshToken = () => localStorage.getItem("refreshToken") || "";

export const getStoredRole = () => normalizeRole(localStorage.getItem("role") || "");

export const clearStoredSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

const unwrapAuthPayload = (payload) => payload?.data ?? payload ?? {};

export const persistAuthSession = (payload, fallback = {}) => {
  const auth = unwrapAuthPayload(payload);
  const token = auth.token || fallback.token || "";
  const refreshToken =
    auth.refreshToken || fallback.refreshToken || getStoredRefreshToken();
  const role = normalizeRole(auth.role || fallback.role || getStoredRole());
  const fullName =
    auth.fullName || fallback.fullName || localStorage.getItem("userName") || "";
  const email = auth.email || fallback.email || localStorage.getItem("userEmail") || "";
  const userId =
    auth.userId || fallback.userId || localStorage.getItem("userId") || "";

  if (!token) {
    return null;
  }

  localStorage.setItem("token", token);

  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }

  if (role) {
    localStorage.setItem("role", role);
  }

  if (fullName) {
    localStorage.setItem("userName", fullName);
  }

  if (email) {
    localStorage.setItem("userEmail", email);
  }

  if (userId) {
    localStorage.setItem("userId", String(userId));
  }

  return {
    token,
    refreshToken,
    role,
    fullName,
    email,
    userId: userId ? String(userId) : "",
  };
};

export const getRoleHomePath = (role = "") => {
  switch (normalizeRole(role)) {
    case "super_admin":
      return "/super_admin/home";
    case "admin":
      return "/admin/home";
    case "professor":
      return "/prof";
    case "assistant":
      return "/asst";
    case "student":
    default:
      return "/student";
  }
};
