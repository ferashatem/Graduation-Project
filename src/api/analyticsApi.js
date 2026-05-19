import apiClient from "./apiClient";

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchAnalyticsSummary = async () => {
  const res = await apiClient.get("/analytics/summary");
  return unwrap(res);
};

export const fetchStudentCountByDepartment = async () => {
  const res = await apiClient.get("/analytics/student-count-by-department");
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchStudentCountByBatch = async () => {
  const res = await apiClient.get("/analytics/student-count-by-batch");
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchDoctorWorkload = async ({ departmentId, collegeId } = {}) => {
  const res = await apiClient.get("/analytics/doctor-workload", {
    params: { departmentId, collegeId },
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchTopEnrolledSubjects = async (top = 10) => {
  const res = await apiClient.get("/analytics/top-enrolled-subjects", { params: { top } });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchOfferingEnrollmentStats = async ({ departmentId, batchId, doctorId, semesterId, page = 1, size = 20 } = {}) => {
  const res = await apiClient.get("/analytics/offering-enrollment-stats", {
    params: { departmentId, batchId, doctorId, semesterId, page, size },
  });
  return unwrap(res);
};
