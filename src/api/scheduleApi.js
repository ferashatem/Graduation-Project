import apiClient from "./apiClient";

const norm = (res) => res.data?.data ?? res.data;

// ── Batch reads (Student / Admin / Doctor) ────────────────────────────────────

export const fetchBatchSchedule = async (batchId) => {
  const res = await apiClient.get(`/schedule/batch/${batchId}`);
  return norm(res);
};

export const fetchBatchToday = async (batchId) => {
  const res = await apiClient.get(`/schedule/batch/${batchId}/today`);
  return norm(res);
};

export const fetchBatchDay = async (batchId, day) => {
  const res = await apiClient.get(`/schedule/batch/${batchId}/day/${day}`);
  return norm(res);
};

export const fetchOfferingSchedule = async (offeringId) => {
  const res = await apiClient.get(`/schedule/offering/${offeringId}`);
  return norm(res);
};

// ── Doctor (JWT-aware — no ID in URL) ─────────────────────────────────────────

export const fetchMySchedule = async () => {
  const res = await apiClient.get("/schedule/my-schedule");
  return norm(res);
};

export const fetchMyToday = async () => {
  const res = await apiClient.get("/schedule/my-today");
  return norm(res);
};

// ── Student helpers (requires batchId from profile) ───────────────────────────

export const fetchStudentBatchId = async () => {
  const res = await apiClient.get("/students/me");
  const data = res.data?.data ?? res.data;
  return data?.batchId ?? data?.BatchId ?? null;
};

// ── Admin CRUD ────────────────────────────────────────────────────────────────

export const createScheduleEntry = async (dto) => {
  const res = await apiClient.post("/schedule", dto);
  return norm(res);
};

export const updateScheduleEntry = async (id, dto) => {
  const res = await apiClient.put(`/schedule/${id}`, dto);
  return norm(res);
};

export const deleteScheduleEntry = async (id) => {
  await apiClient.delete(`/schedule/${id}`);
  return id;
};
