
import apiClient from "../../../api/apiClient";

export const getCollegeById = async (collegeId) => {
  const res = await apiClient.get(`/Colleges/${collegeId}`);
  return res.data?.data ?? res.data;
};

export const fetchColleges = async () => {
  const res = await apiClient.get("/Colleges");
  console.log("fetchColleges raw response:", res.data);
  // Response shape: { success, data: { items: [...], pageNumber, pageSize, ... } }
  const payload = res.data?.data;
  // Paginated: { data: [...], page, pageSize, ... }
  // Flat: [...]
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

export const createCollege = async ({ name, code, universityCode }) => {
  const res = await apiClient.post("/Colleges", { name, code, universityCode });
  return res.data?.data ?? res.data;
};

export const updateCollege = async (collegeCode, { name, code, universityCode }) => {
  const res = await apiClient.put(`/Colleges/${collegeCode}`, { name, code, universityCode });
  return res.data?.data ?? res.data;
};

export const deleteCollege = async (collegeCode) => {
  await apiClient.delete(`/Colleges/${collegeCode}`);
  return collegeCode;
};
