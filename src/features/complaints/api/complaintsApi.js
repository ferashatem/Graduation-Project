import apiClient from "../../../api/apiClient";

const unwrap = (res) => res.data?.data ?? res.data;

// Student: submit a new complaint
export const createComplaint = async (dto) => {
  const res = await apiClient.post("/Complaints", dto);
  return unwrap(res);
};

// Student: list own complaints
export const fetchMyComplaints = async ({ page = 1, pageSize = 20, status, targetType, from, to } = {}) => {
  const res = await apiClient.get("/Complaints/my-complaints", {
    params: { page, pageSize, status, targetType, from, to },
  });
  return unwrap(res);
};

// Doctor: list complaints filed against them
export const fetchMyReports = async ({ page = 1, pageSize = 20, status } = {}) => {
  const res = await apiClient.get("/Complaints/my-reports", {
    params: { page, pageSize, status },
  });
  return unwrap(res);
};

// Admin: list all complaints
export const fetchAllComplaints = async ({ page = 1, pageSize = 20, status, targetType, targetId, from, to } = {}) => {
  const res = await apiClient.get("/Complaints/all", {
    params: { page, pageSize, status, targetType, targetId, from, to },
  });
  return unwrap(res);
};

// Student: list doctors they can target in a complaint
export const fetchDoctorOptions = async () => {
  const res = await apiClient.get("/complaints/doctor-options");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// Doctor: reply to a complaint
export const replyToComplaint = async (id, reply) => {
  const res = await apiClient.put(`/Complaints/${id}/reply`, { reply });
  return unwrap(res);
};

// Admin/Doctor: get complaint clusters (list)
export const fetchClusters = async ({ targetType, targetId } = {}) => {
  const res = await apiClient.get("/Complaints/clusters", {
    params: { targetType, targetId },
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

// Admin/Doctor: get single cluster detail (NEW)
export const fetchClusterDetail = async (clusterId) => {
  const res = await apiClient.get(`/complaints/clusters/${clusterId}`);
  return unwrap(res);
};

// Admin/Doctor: reply to entire cluster — resolves all complaints in it (NEW)
export const replyToCluster = async (clusterId, message) => {
  const res = await apiClient.put(`/complaints/clusters/${clusterId}/reply`, { message });
  return unwrap(res);
};

// Admin: update cluster status (NEW)
export const updateClusterStatus = async (clusterId, status, reason) => {
  await apiClient.patch(`/complaints/clusters/${clusterId}/status`, { status, reason: reason || undefined });
};

// Admin: complaint intelligence dashboard (NEW)
export const fetchComplaintDashboard = async () => {
  const res = await apiClient.get("/complaints/dashboard");
  return unwrap(res);
};

// Admin/SuperAdmin: requeue all complaints with no analysis
export const reprocessPendingComplaints = async () => {
  const res = await apiClient.post("/complaints/reprocess-pending");
  return unwrap(res);
};
