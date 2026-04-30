import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchColleges = async ({ page = 1, pageSize = 100 } = {}) => {
  const res = await apiClient.get("/Colleges", { params: { page, pageSize } });
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

export const createCollege = async ({ name, code, universityCode }) => {
  const res = await apiClient.post("/Colleges", { name, code, universityCode });
  return res.data?.data ?? res.data;
};

export const updateCollege = async (
  collegeCode,
  { name, code, universityCode }
) => {
  const res = await apiClient.put(`/Colleges/${collegeCode}`, {
    name,
    code,
    universityCode,
  });
  return res.data?.data ?? res.data;
};

export const deleteCollege = async (collegeCode) => {
  await apiClient.delete(`/Colleges/${collegeCode}`);
  return collegeCode;
};
