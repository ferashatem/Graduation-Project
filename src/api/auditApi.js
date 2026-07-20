import apiClient from "./apiClient";

const norm = (res) => {
  const d = res.data?.data ?? res.data;
  return d;
};

// GET /api/auditlogs  (paginated + filtered)
export const fetchAuditLogs = async (params) => {
  const clean = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v != null && v !== "")
  );
  const res = await apiClient.get("/auditlogs", { params: clean });
  const d = norm(res);
  const items = Array.isArray(d) ? d : (d?.data ?? d?.items ?? []);
  return {
    items,
    total: d?.total ?? d?.totalCount ?? items.length,
    totalPages: d?.totalPages ?? d?.pageCount ?? 1,
    page: d?.page ?? 1,
    hasNextPage: d?.hasNextPage ?? false,
  };
};

// GET /api/auditlogs/dashboard
export const fetchAuditDashboard = async () => {
  const res = await apiClient.get("/auditlogs/dashboard");
  return norm(res);
};

// GET /api/auditlogs/timeline?hours=24
export const fetchAuditTimeline = async (hours = 24) => {
  const res = await apiClient.get("/auditlogs/timeline", { params: { hours } });
  const d = norm(res);
  return Array.isArray(d) ? d : [];
};

// GET /api/auditlogs/top-users?limit=10
export const fetchAuditTopUsers = async (limit = 10) => {
  const res = await apiClient.get("/auditlogs/top-users", { params: { limit } });
  const d = norm(res);
  return Array.isArray(d) ? d : [];
};

// GET /api/auditlogs/top-modules?limit=10
export const fetchAuditTopModules = async (limit = 10) => {
  const res = await apiClient.get("/auditlogs/top-modules", { params: { limit } });
  const d = norm(res);
  return Array.isArray(d) ? d : [];
};

// GET /api/auditlogs/heatmap?days=30
export const fetchAuditHeatmap = async (days = 30) => {
  const res = await apiClient.get("/auditlogs/heatmap", { params: { days } });
  const d = norm(res);
  return Array.isArray(d) ? d : [];
};

// GET /api/auditlogs/insights
export const fetchAuditInsights = async () => {
  const res = await apiClient.get("/auditlogs/insights");
  const d = norm(res);
  return Array.isArray(d) ? d : [];
};

// Export — returns Blob for client-side download
export const exportAuditLogs = async (type, filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v != null && v !== "")
  );
  const res = await apiClient.get(`/auditlogs/export/${type}`, {
    params,
    responseType: "blob",
  });
  return res.data;
};
