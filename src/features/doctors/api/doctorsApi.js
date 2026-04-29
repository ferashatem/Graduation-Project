import apiClient from "../../../api/apiClient";

// GET /api/doctors?page=1&size=25
export const fetchAllDoctors = async ({ page = 1, size = 50 } = {}) => {
  const res = await apiClient.get("/doctors", { params: { page, size } });
  const payload = res.data?.data ?? res.data;
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload?.data)) return { items: payload.data, total: payload.total ?? payload.data.length };
  return { items: [], total: 0 };
};

// GET /api/doctors/search?q=...
export const searchDoctors = async (q) => {
  const res = await apiClient.get("/doctors/search", { params: { q } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/doctors/{code}
export const getDoctorByCode = async (code) => {
  const res = await apiClient.get(`/doctors/${code}`);
  return res.data?.data ?? res.data;
};
