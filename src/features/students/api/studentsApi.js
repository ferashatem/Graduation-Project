import apiClient from "../../../api/apiClient";

// GET /api/students?page=1&size=25
export const fetchAllStudents = async ({ page = 1, size = 50 } = {}) => {
  const res = await apiClient.get("/students", { params: { page, size } });
  const payload = res.data?.data ?? res.data;
  // backend returns { Page, PageSize, Total, Data: [...] } or plain array
  if (Array.isArray(payload)) return { items: payload, total: payload.length };
  if (Array.isArray(payload?.data)) return { items: payload.data, total: payload.total ?? payload.data.length };
  return { items: [], total: 0 };
};

// GET /api/students/search?q=...
export const searchStudents = async (q) => {
  const res = await apiClient.get("/students/search", { params: { q } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/students/{code}
export const getStudentByCode = async (code) => {
  const res = await apiClient.get(`/students/${code}`);
  return res.data?.data ?? res.data;
};
