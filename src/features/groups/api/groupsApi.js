import apiClient from "../../../api/apiClient";

export const fetchGroupsByBatch = async (batchId) => {
  const res = await apiClient.get(`/groups/by-batch/${batchId}`);
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

export const getGroupById = async (groupId) => {
  const res = await apiClient.get(`/groups/${groupId}`);
  return res.data?.data ?? res.data;
};

export const createGroup = async ({ name, code, batchCode }) => {
  const res = await apiClient.post("/groups", { name, code, batchCode });
  return res.data?.data ?? res.data;
};

// PUT /api/groups/{code} — backend resolves by public code
export const updateGroup = async (groupCode, { name, code, batchCode }) => {
  const res = await apiClient.put(`/groups/${groupCode}`, { name, code, batchCode });
  return res.data?.data ?? res.data;
};

// DELETE /api/groups/{code}
export const deleteGroup = async (groupCode) => {
  await apiClient.delete(`/groups/${groupCode}`);
  return groupCode;
};
