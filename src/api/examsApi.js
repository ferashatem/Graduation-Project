import apiClient from "./apiClient";

// POST /api/Exams/upload-pdf?subjectOfferingId={offeringId}  — Doctor only
export const uploadExamPdf = async (subjectOfferingId, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/Exams/upload-pdf", form, {
    params: { subjectOfferingId },
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });
  return res.data?.data ?? res.data;
};

// GET /api/Exams/by-offering/{offeringId}  — list exams for an offering
export const fetchExamsByOffering = async (offeringId) => {
  const res = await apiClient.get(`/Exams/by-offering/${offeringId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};
