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

// Admin/Doctor: get complaint clusters
export const fetchClusters = async ({ targetType, targetId } = {}) => {
  const res = await apiClient.get("/Complaints/clusters", {
    params: { targetType, targetId },
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};
