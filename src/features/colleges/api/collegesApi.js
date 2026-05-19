import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchUniversity = async () => {
  const res = await apiClient.get("/University/structure");
  const payload = res.data?.data ?? res.data;
  const list = Array.isArray(payload) ? payload : [payload];
  return list[0] ?? null;
};

export const fetchUniversities = async () => {
  const res = await apiClient.get("/University/structure");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload ? [payload] : []);
};

export const fetchColleges = async () => {
  const res = await apiClient.get("/Colleges");
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const getCollegeById = async (...args) => {
  const collegeId = args[args.length - 1];
  if (!collegeId) return null;

  const colleges = await fetchColleges();
  return (
    colleges.find(
      (college) =>
        String(college.id) === String(collegeId) ||
        String(college.code) === String(collegeId)
    ) || null
  );
};

export const createCollege = async ({ name, code, universityId }) => {
  const res = await apiClient.post("/Colleges", { name, code, universityId });
  return res.data?.data ?? res.data;
};

export const updateCollege = async (collegeId, { name, code, universityId }) => {
  const res = await apiClient.put(`/Colleges/${collegeId}`, { name, code, universityId });
  return res.data?.data ?? res.data;
};

export const deleteCollege = async (collegeId) => {
  await apiClient.delete(`/Colleges/${collegeId}`);
  return collegeId;
};
