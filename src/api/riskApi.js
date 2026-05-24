import apiClient from "./apiClient";

export const getAtRiskStudents = async (offeringId) => {
  const res = await apiClient.get("/risk/at-risk-students", { params: { offeringId } });
  return res.data;
};

export const getStudentRisk = async (studentId) => {
  const res = await apiClient.get(`/risk/student/${studentId}`);
  return res.data;
};

export const triggerRiskAnalysis = async () => {
  const res = await apiClient.post("/risk/analyze/trigger");
  return res.data;
};

export const getRiskDashboard = async () => {
  const res = await apiClient.get("/risk/dashboard");
  return res.data;
};
