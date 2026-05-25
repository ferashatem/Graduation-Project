import apiClient from "./apiClient";

export const recordProctoringEvent = async ({ examId, eventType, details = "" }) => {
  const res = await apiClient.post("/proctoring/event", {
    ExamId:    examId,
    EventType: eventType,
    Details:   details,
  });
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
