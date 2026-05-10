import apiClient from "../../../api/apiClient";

const normalize = (payload) =>
  Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? [];

// GET /api/subject-offerings/by-semester/{semesterId}
export const fetchOfferingsBySemester = async (semesterId) => {
  const res = await apiClient.get(`/subject-offerings/by-semester/${semesterId}`);
  return normalize(res.data?.data ?? res.data);
};

// GET /api/subject-offerings/my-offerings  (Doctor role — token-based)
export const fetchMyOfferings = async () => {
  const res = await apiClient.get("/subject-offerings/my-offerings");
  return normalize(res.data?.data ?? res.data);
};

// GET /api/subject-offerings/my-enrollments  (Student role — token-based)
export const fetchMyEnrollments = async () => {
  const res = await apiClient.get("/subject-offerings/my-enrollments");
  return normalize(res.data?.data ?? res.data);
};

// POST /api/subject-offerings
// { SubjectId, SemesterId, DoctorId, DepartmentId, BatchId, GroupId?, MaxCapacity }
export const createOffering = async (dto) => {
  const res = await apiClient.post("/subject-offerings", dto);
  return res.data?.data ?? res.data;
};
