import apiClient from "../../../api/apiClient";

// GET /api/subjects/search?name=...  (top 20)
export const searchSubjects = async (name) => {
  const res = await apiClient.get("/subjects/search", { params: { name } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/subjects/by-department/{departmentId}
export const fetchSubjectsByDepartment = async (departmentId) => {
  const res = await apiClient.get(`/subjects/by-department/${departmentId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/subjects/by-batch/{batchId}
export const fetchSubjectsByBatch = async (batchId) => {
  const res = await apiClient.get(`/subjects/by-batch/${batchId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/subjects/{code}
export const getSubjectByCode = async (code) => {
  const res = await apiClient.get(`/subjects/${code}`);
  return res.data?.data ?? res.data;
};

// POST /api/subjects  { name, code, creditHours, departmentCode, collegeCode?, batchCode? }
export const createSubject = async ({ name, code, creditHours, departmentCode, collegeCode, batchCode }) => {
  const res = await apiClient.post("/subjects", {
    name,
    code,
    creditHours: Number(creditHours) || 3,
    departmentCode,
    ...(collegeCode ? { collegeCode } : {}),
    ...(batchCode ? { batchCode } : {}),
  });
  return res.data?.data ?? res.data;
};

// PUT /api/subjects/{code}  { name, code }
export const updateSubject = async (subjectCode, { name, code }) => {
  const res = await apiClient.put(`/subjects/${subjectCode}`, { name, code });
  return res.data?.data ?? res.data;
};

// DELETE /api/subjects/{code}
export const deleteSubject = async (subjectCode) => {
  await apiClient.delete(`/subjects/${subjectCode}`);
  return subjectCode;
};

// PUT /api/subjects/assign-doctor?subjectCode=&doctorCode=
export const assignDoctorToSubject = async (subjectCode, doctorCode) => {
  const res = await apiClient.put("/subjects/assign-doctor", null, { params: { subjectCode, doctorCode } });
  return res.data?.data ?? res.data;
};
