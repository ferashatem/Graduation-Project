import apiClient from "./apiClient";

export const recordProctoringEvent = async (dto) => {
  const res = await apiClient.post("/proctoring/event", dto);
  return res.data;
};

export const getProctoringReport = async (submissionId) => {
  const res = await apiClient.get(`/proctoring/report/${submissionId}`);
  return res.data;
};

export const getExamProctoringsummary = async (examId) => {
  const res = await apiClient.get(`/proctoring/exam/${examId}/summary`);
  return res.data;
};

export const flagSubmission = async (submissionId, reason) => {
  const res = await apiClient.post(`/proctoring/flag/${submissionId}`, { reason });
  return res.data;
};
