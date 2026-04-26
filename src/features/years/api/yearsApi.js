import apiClient from "../../../api/apiClient";

export const fetchYears = async (collegeId) => {
  const res = await apiClient.get("/academic-years", { params: { collegeId } });
  const payload = res.data?.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

export const getYearById = async (yearId) => {
  const res = await apiClient.get(`/academic-years/${yearId}`);
  return res.data?.data ?? res.data;
};

export const createYear = async ({ name, isActive = true, order, collegeId }) => {
  const res = await apiClient.post("/academic-years", { name, isActive, order: Number(order), collegeId });
  return res.data?.data ?? res.data;
};

export const updateYear = async (yearId, { name, isActive = true, order }) => {
  const res = await apiClient.put(`/academic-years/${yearId}`, { name, isActive, order: Number(order) });
  return res.data?.data ?? res.data;
};

export const deleteYear = async (yearId) => {
  await apiClient.delete(`/academic-years/${yearId}`);
  return yearId;
};
