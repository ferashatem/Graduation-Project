import apiClient from "./apiClient";

const norm = (res) => res.data?.data ?? res.data;
const normList = (res) => {
  const d = res.data?.data ?? res.data;
  return Array.isArray(d) ? d : d?.items ?? [];
};

// Professor: create assignment for an offering
export const createAssignment = async (dto) => {
  const res = await apiClient.post("/assignments", dto);
  return norm(res);
};

// Professor/Student: list assignments for an offering
export const getAssignmentsByOffering = async (offeringId) => {
  const res = await apiClient.get(`/assignments/offering/${offeringId}`);
  return normList(res);
};

// Get single assignment details
export const getAssignment = async (id) => {
  const res = await apiClient.get(`/assignments/${id}`);
  return norm(res);
};

// Student: submit assignment
export const submitAssignment = async (id, formData) => {
  const res = await apiClient.post(`/assignments/${id}/submit`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return norm(res);
};

// Student: get my submission for an assignment
export const getMySubmission = async (id) => {
  const res = await apiClient.get(`/assignments/${id}/my-submission`);
  return norm(res);
};

// Professor: get all submissions for an assignment
export const getSubmissions = async (id) => {
  const res = await apiClient.get(`/assignments/${id}/submissions`);
  return normList(res);
};

// Professor: grade a submission manually
export const gradeSubmission = async (submissionId, dto) => {
  const res = await apiClient.post(`/assignments/submissions/${submissionId}/grade`, dto);
  return norm(res);
};

// Professor: AI-grade a submission
export const aiGradeSubmission = async (submissionId) => {
  const res = await apiClient.post(`/assignments/submissions/${submissionId}/ai-grade`);
  return norm(res);
};

// Professor: delete assignment
export const deleteAssignment = async (id) => {
  await apiClient.delete(`/assignments/${id}`);
};
