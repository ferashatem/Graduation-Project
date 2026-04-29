import apiClient from "../../../api/apiClient";

export const fetchBatchesByDepartment = async (departmentId) => {
  const res = await apiClient.get(`/batches/by-department/${departmentId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

export const getBatchById = async (batchId) => {
  const res = await apiClient.get(`/batches/${batchId}`);
  return res.data?.data ?? res.data;
};

export const createBatch = async ({ name, code, departmentCode }) => {
  const res = await apiClient.post("/batches", { name, code, departmentCode });
  return res.data?.data ?? res.data;
};

// PUT /api/batches/{code} — backend resolves by public code
export const updateBatch = async (batchCode, { name, code, departmentCode }) => {
  const res = await apiClient.put(`/batches/${batchCode}`, { name, code, departmentCode });
  return res.data?.data ?? res.data;
};

// DELETE /api/batches/{code}
export const deleteBatch = async (batchCode) => {
  await apiClient.delete(`/batches/${batchCode}`);
  return batchCode;
};
