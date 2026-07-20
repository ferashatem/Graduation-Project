import apiClient from "./apiClient";

const norm = (res) => res.data?.data ?? res.data;

// Student: check in to a session
export const checkIn = async (sessionId) => {
  const res = await apiClient.post("/attendance/check-in", { sessionId });
  return norm(res);
};

// Student: get own attendance report
export const getMyAttendanceReport = async (studentId) => {
  const res = await apiClient.get(`/attendance/student/${studentId}/report`);
  return norm(res);
};

// Professor: create attendance session
export const createSession = async ({ subjectOfferingId, notes }) => {
  const res = await apiClient.post("/attendance/sessions", { subjectOfferingId, notes });
  return norm(res);
};

// Professor/Admin: correct an attendance record
export const correctAttendance = async ({ sessionId, studentId, status, notes }) => {
  const res = await apiClient.post("/attendance/correct", { sessionId, studentId, status, notes });
  return norm(res);
};

// Professor/Admin: get single record
export const getAttendanceRecord = async (sessionId, studentId) => {
  const res = await apiClient.get(`/attendance/record/${sessionId}/${studentId}`);
  return norm(res);
};

// Professor/Admin: update record
export const updateAttendanceRecord = async (sessionId, studentId, dto) => {
  const res = await apiClient.put(`/attendance/record/${sessionId}/${studentId}`, dto);
  return norm(res);
};

// Professor/Admin: delete record
export const deleteAttendanceRecord = async (sessionId, studentId) => {
  await apiClient.delete(`/attendance/record/${sessionId}/${studentId}`);
};
