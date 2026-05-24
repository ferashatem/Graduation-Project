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

// ── Dashboard endpoints ────────────────────────────────────────────────────────

export const fetchAdminDashboard = async () => {
  const res = await apiClient.get("/analytics/dashboard/admin");
  return unwrap(res);
};

export const fetchDoctorDashboard = async (doctorId) => {
  const res = await apiClient.get("/analytics/dashboard/doctor", {
    params: doctorId ? { doctorId } : {},
  });
  return unwrap(res);
};

export const fetchStudentDashboard = async () => {
  const res = await apiClient.get("/analytics/dashboard/student");
  return unwrap(res);
};

// ── Advanced analytics ─────────────────────────────────────────────────────────

export const fetchAttendanceTrends = async (offeringId, weeks = 8) => {
  const res = await apiClient.get("/analytics/attendance/trends", {
    params: { offeringId, weeks },
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchGradeDistribution = async (offeringId) => {
  const res = await apiClient.get("/analytics/grades/distribution", {
    params: { offeringId },
  });
  return unwrap(res);
};

export const fetchAtRiskStudents = async (departmentId) => {
  const res = await apiClient.get("/analytics/at-risk-students", {
    params: departmentId ? { departmentId } : {},
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchCoursePerformance = async (semesterId) => {
  const res = await apiClient.get("/analytics/course-performance", {
    params: { semesterId },
  });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchDepartmentComparison = async () => {
  const res = await apiClient.get("/analytics/department/comparison");
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};

export const fetchStudentPerformance = async (studentId) => {
  const res = await apiClient.get(`/analytics/student/${studentId}/performance`);
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : [];
};
