import apiClient from "../../../api/apiClient";

// "YYYY-MM-DD" → "YYYY-MM-DDT00:00:00.000Z"
const toIso = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr.includes("T")) return dateStr; // already ISO
  return new Date(dateStr + "T00:00:00.000Z").toISOString();
};

export const fetchSemestersByYear = async (academicYearId) => {
  const res = await apiClient.get(`/semesters/by-academic-year/${academicYearId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

// POST /api/semesters  { name, academicYearId (ULID), startDate (ISO), endDate (ISO) }
export const createSemester = async ({ name, academicYearId, startDate, endDate }) => {
  const res = await apiClient.post("/semesters", {
    name,
    academicYearId,
    startDate: toIso(startDate),
    endDate: toIso(endDate),
  });
  return res.data?.data ?? res.data;
};

// PUT /api/semesters/{id}  { name, startDate (ISO), endDate (ISO) }
export const updateSemester = async (semesterId, { name, startDate, endDate }) => {
  const res = await apiClient.put(`/semesters/${semesterId}`, {
    name,
    startDate: toIso(startDate),
    endDate: toIso(endDate),
  });
  return res.data?.data ?? res.data;
};

// DELETE /api/semesters/{id}
export const deleteSemester = async (semesterId) => {
  await apiClient.delete(`/semesters/${semesterId}`);
  return semesterId;
};
