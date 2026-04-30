import apiClient from "../../../api/apiClient";

const normalize = (payload) =>
  Array.isArray(payload) ? payload : payload?.data ?? payload?.items ?? [];

// ── Profile ──────────────────────────────────────────────────────────────────

export const fetchMyProfile = async () => {
  const res = await apiClient.get("/Auth/me");
  return res.data?.data ?? res.data;
};

// ── Subjects / Courses ────────────────────────────────────────────────────────

export const fetchMySubjects = async (doctorCode) => {
  if (!doctorCode) return [];
  const res = await apiClient.get(`/Doctors/${doctorCode}/subjects`);
  return normalize(res.data?.data ?? res.data);
};

export const fetchOffering = async (offeringId) => {
  const res = await apiClient.get(`/Offerings/${offeringId}`);
  return res.data?.data ?? res.data;
};

export const fetchAllOfferings = async () => {
  const res = await apiClient.get("/Offerings");
  return normalize(res.data?.data ?? res.data);
};

// ── Exams (Quizzes) ───────────────────────────────────────────────────────────

export const fetchMyExams = async () => {
  const res = await apiClient.get("/Exams/my-exams");
  return normalize(res.data?.data ?? res.data);
};

export const fetchExam = async (examId) => {
  const res = await apiClient.get(`/Exams/${examId}`);
  return res.data?.data ?? res.data;
};

export const createExam = async (payload) => {
  const res = await apiClient.post("/Exams", payload);
  return res.data?.data ?? res.data;
};

export const updateExam = async (code, payload) => {
  const res = await apiClient.put(`/Exams/by-code/${code}`, payload);
  return res.data?.data ?? res.data;
};

export const deleteExam = async (code) => {
  await apiClient.delete(`/Exams/by-code/${code}`);
  return code;
};

export const fetchExamResults = async (examId) => {
  const res = await apiClient.get(`/Exams/${examId}/results`);
  return res.data?.data ?? res.data;
};

export const generateExamFromPdf = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await apiClient.post("/Exams/upload-pdf", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data ?? res.data;
};

export const generateExamWithAI = async (params) => {
  const res = await apiClient.post("/Exams/generate-ai", params);
  return res.data?.data ?? res.data;
};
