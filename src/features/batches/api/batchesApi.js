import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchAllBatches = async ({ page = 1, pageSize = 100 } = {}) => {
  const res = await apiClient.get("/batches", { params: { page, pageSize } });
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const fetchBatchesByDepartment = async (departmentId) => {
  const res = await apiClient.get(`/batches/by-department/${departmentId}`);
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const getBatchById = async (...args) => {
  const batchId = args[args.length - 1];
  if (!batchId) return null;

  const batches = await fetchAllBatches();
  return batches.find((batch) => String(batch.id) === String(batchId)) || null;
};

export const createBatch = async ({ name, code, departmentId }) => {
  const res = await apiClient.post("/batches", { name, code, departmentId });
  return res.data?.data ?? res.data;
};

export const updateBatch = async (batchId, { name, code, departmentId }) => {
  const res = await apiClient.put(`/batches/${batchId}`, { name, code, departmentId });
  return res.data?.data ?? res.data;
};

export const deleteBatch = async (batchId) => {
  await apiClient.delete(`/batches/${batchId}`);
  return batchId;
};
