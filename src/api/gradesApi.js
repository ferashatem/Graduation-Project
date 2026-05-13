import apiClient from "./apiClient";

// POST /api/grades/import/{offeringId}  — Doctor imports grades via Excel file
export const importGrades = async (offeringId, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post(`/grades/import/${offeringId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data?.data ?? res.data;
};

// POST /api/grades/calculate/{offeringId}  — Doctor triggers weighted grade calculation
export const calculateGrades = async (offeringId) => {
  const res = await apiClient.post(`/grades/calculate/${offeringId}`);
  return res.data?.data ?? res.data;
};

// PUT /api/grades/{id}  — Admin manual grade override
export const updateGrade = async (gradeId, dto) => {
  const res = await apiClient.put(`/grades/${gradeId}`, dto);
  return res.data?.data ?? res.data;
};

// POST /api/grades/{gradeId}/recalculate  — Admin recalculates single grade
export const recalculateGrade = async (gradeId) => {
  const res = await apiClient.post(`/grades/${gradeId}/recalculate`);
  return res.data?.data ?? res.data;
};

// DELETE /api/grades/{gradeId}  — Admin soft-deletes a grade
export const deleteGrade = async (gradeId) => {
  await apiClient.delete(`/grades/${gradeId}`);
  return gradeId;
};

// ── GPA ──────────────────────────────────────────────────────────────────────

// GET /api/gpa/my-gpa  — Student views own GPA (token-based)
// Returns: { studentId, studentName, gpa, totalCreditHours, totalSubjects }
export const fetchMyGpa = async () => {
  const res = await apiClient.get("/gpa/my-gpa");
  return res.data?.data ?? res.data;
};

// GET /api/gpa/student/{studentId}  — Admin/Doctor views any student's GPA
export const fetchStudentGpa = async (studentId) => {
  const res = await apiClient.get(`/gpa/student/${studentId}`);
  return res.data?.data ?? res.data;
};
