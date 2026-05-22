import apiClient from "./apiClient";

// ── Shared helpers ────────────────────────────────────────────────────────────
const list = (payload) => (Array.isArray(payload) ? payload : payload?.items ?? payload?.data ?? []);

// ── Doctor endpoints ──────────────────────────────────────────────────────────

// GET /api/exams/my-exams
export const fetchMyExams = async () => {
  const res = await apiClient.get("/exams/my-exams");
  const payload = res.data?.data ?? res.data;
  return list(payload);
};

// GET /api/exams/by-offering/{offeringId}
export const fetchExamsByOffering = async (offeringId) => {
  const res = await apiClient.get(`/exams/by-offering/${offeringId}`);
  const payload = res.data?.data ?? res.data;
  return list(payload);
};

// GET /api/exams/{id}/results  — all submissions for an exam
export const fetchExamResults = async (examId) => {
  const res = await apiClient.get(`/exams/${examId}/results`);
  const payload = res.data?.data ?? res.data;
  return list(payload);
};

// POST /api/exams  — create structured exam manually
export const createExam = async (dto) => {
  const res = await apiClient.post("/exams", dto, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data?.data ?? res.data;
};

// POST /api/exams/generate-ai  — AI-generated exam
export const generateAiExam = async (dto) => {
  const res = await apiClient.post("/exams/generate-ai", dto);
  return res.data?.data ?? res.data;
};

// POST /api/exams/preview-questions-from-pdf  — extract questions preview (no exam created yet)
export const previewQuestionsFromPdf = async ({ file, questionCount = 10, difficulty = "Medium", examType = "Final" }, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  form.append("questionCount", questionCount);
  form.append("difficulty", difficulty);
  form.append("examType", examType);
  const res = await apiClient.post("/exams/preview-questions-from-pdf", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// POST /api/exams/upload-pdf  — PDF exam upload
export const uploadExamPdf = async (subjectOfferingId, file, onProgress) => {
  const form = new FormData();
  form.append("File", file);
  if (subjectOfferingId) form.append("SubjectOfferingId", subjectOfferingId);
  const res = await apiClient.post("/exams/upload-pdf", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data?.data ?? res.data;
};

// POST /api/exams/{id}/auto-grade  — auto-grade MCQ + TrueFalse
export const autoGradeExam = async (examId) => {
  const res = await apiClient.post(`/exams/${examId}/auto-grade`);
  return res.data?.data ?? res.data;
};

// POST /api/exams/grade-submission  — manually grade one submission (Essay)
export const gradeSubmission = async ({ submissionId, score }) => {
  const res = await apiClient.post("/exams/grade-submission", { submissionId, score });
  return res.data?.data ?? res.data;
};

// PUT /api/exams/by-code/{code}  — update exam details / status
export const updateExam = async (code, dto) => {
  const res = await apiClient.put(`/exams/by-code/${code}`, dto);
  return res.data?.data ?? res.data;
};

// DELETE /api/exams/by-code/{code}
export const deleteExam = async (code) => {
  await apiClient.delete(`/exams/by-code/${code}`);
  return code;
};

// ── Student endpoints ─────────────────────────────────────────────────────────

// GET /api/exams/my-enrolled-exams
export const fetchMyEnrolledExams = async () => {
  const res = await apiClient.get("/exams/my-enrolled-exams");
  const payload = res.data?.data ?? res.data;
  return list(payload);
};

// GET /api/exams/{id}
export const fetchExamById = async (examId) => {
  const res = await apiClient.get(`/exams/${examId}`);
  return res.data?.data ?? res.data;
};

// GET /api/exams/{id}/my-variant  — randomized questions for this student
export const fetchMyVariant = async (examId) => {
  const res = await apiClient.get(`/exams/${examId}/my-variant`);
  const payload = res.data?.data ?? res.data;
  return list(payload);
};

// GET /api/exams/{id}/my-submission
export const fetchMySubmission = async (examId) => {
  const res = await apiClient.get(`/exams/${examId}/my-submission`);
  return res.data?.data ?? res.data;
};

// POST /api/exams/{examId}/submit
export const submitExam = async (examId, answers) => {
  const res = await apiClient.post(`/exams/${examId}/submit`, {
    examId,
    answers: answers.map((a) => ({ questionId: a.questionId, answerText: a.answerText ?? a.answer ?? "" })),
  });
  return res.data?.data ?? res.data;
};

// GET /api/exams/by-code/{code}
export const fetchExamByCode = async (code) => {
  const res = await apiClient.get(`/exams/by-code/${code}`);
  return res.data?.data ?? res.data;
};

// GET /api/exams/{id}/analytics  — Doctor views statistics for one exam
export const fetchExamAnalytics = async (examId) => {
  const res = await apiClient.get(`/exams/${examId}/analytics`);
  return res.data?.data ?? res.data;
};
