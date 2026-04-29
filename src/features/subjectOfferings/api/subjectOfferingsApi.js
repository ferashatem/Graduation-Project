import apiClient from "../../../api/apiClient";

// GET /api/subject-offerings/by-semester/{semesterId}
export const fetchOfferingsBySemester = async (semesterId) => {
  const res = await apiClient.get(`/subject-offerings/by-semester/${semesterId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// POST /api/subject-offerings
// { SubjectId, SemesterId, DoctorId, DepartmentId, BatchId, GroupId?, MaxCapacity }
export const createOffering = async (dto) => {
  const res = await apiClient.post("/subject-offerings", dto);
  return res.data?.data ?? res.data;
};
