import apiClient from "../../../api/apiClient";

export const fetchSemestersByYear = async (academicYearId) => {
  const res = await apiClient.get(`/semesters/by-academic-year/${academicYearId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

// POST /api/semesters  { Name, AcademicYearId (ULID), StartDate, EndDate }
export const createSemester = async ({ name, academicYearId, startDate, endDate }) => {
  const res = await apiClient.post("/semesters", {
    name,
    academicYearId,
    startDate,
    endDate,
  });
  return res.data?.data ?? res.data;
};

// PUT /api/semesters/{id}  { Name, StartDate, EndDate }
export const updateSemester = async (semesterId, { name, startDate, endDate }) => {
  const res = await apiClient.put(`/semesters/${semesterId}`, { name, startDate, endDate });
  return res.data?.data ?? res.data;
};

// DELETE /api/semesters/{id}
export const deleteSemester = async (semesterId) => {
  await apiClient.delete(`/semesters/${semesterId}`);
  return semesterId;
};
