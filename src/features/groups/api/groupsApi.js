import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchAllGroups = async ({ page = 1, pageSize = 100 } = {}) => {
  const res = await apiClient.get("/groups", { params: { page, pageSize } });
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const fetchGroupsByBatch = async (batchId) => {
  const res = await apiClient.get(`/groups/by-batch/${batchId}`);
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const getGroupById = async (...args) => {
  const groupId = args[args.length - 1];
  if (!groupId) return null;

  const groups = await fetchAllGroups();
  return groups.find((group) => String(group.id) === String(groupId)) || null;
};

export const createGroup = async ({ name, code, batchId }) => {
  const res = await apiClient.post("/groups", { name, code, batchId });
  return res.data?.data ?? res.data;
};

export const updateGroup = async (groupId, { name, code, batchId }) => {
  const res = await apiClient.put(`/groups/${groupId}`, { name, code, batchId });
  return res.data?.data ?? res.data;
};

export const deleteGroup = async (groupId) => {
  await apiClient.delete(`/groups/${groupId}`);
  return groupId;
};
