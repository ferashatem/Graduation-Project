import apiClient from "../../../api/apiClient";

const normalize = (payload) =>
  Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];

// GET /api/subjectofferings/by-semester/{semesterId}
export const fetchOfferingsBySemester = async (semesterId) => {
  const res = await apiClient.get(`/subjectofferings/by-semester/${semesterId}`);
  return normalize(res.data?.data ?? res.data);
};

// GET /api/subjectofferings/my-offerings  (Doctor role — token-based)
export const fetchMyOfferings = async () => {
  const res = await apiClient.get("/subjectofferings/my-offerings");
  return normalize(res.data?.data ?? res.data);
};

// GET /api/subjectofferings/my-enrollments  (Student role — token-based)
export const fetchMyEnrollments = async () => {
  const res = await apiClient.get("/subjectofferings/my-enrollments");
  return normalize(res.data?.data ?? res.data);
};

// GET /api/subjectofferings/by-code/{code}
export const fetchOfferingByCode = async (code) => {
  const res = await apiClient.get(`/subjectofferings/by-code/${code}`);
  return res.data?.data ?? res.data;
};

// GET /api/enrollments/by-offering/{offeringId}  (Doctor/Admin)
export const fetchEnrollmentsByOffering = async (offeringId) => {
  const res = await apiClient.get(`/enrollments/by-offering/${offeringId}`);
  return normalize(res.data?.data ?? res.data);
};

// POST /api/subjectofferings
// { subjectCode, semesterId, doctorCode, departmentCode, batchCode, groupCode?, maxCapacity }
export const createOffering = async (dto) => {
  const res = await apiClient.post("/subjectofferings", dto);
  return res.data?.data ?? res.data;
};
