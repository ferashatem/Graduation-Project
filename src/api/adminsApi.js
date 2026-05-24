import apiClient from "./apiClient";

export const fetchAllAdmins = async () => {
  const res = await apiClient.get("/admins");
  return res.data;
};

export const fetchAdminById = async (id) => {
  const res = await apiClient.get(`/admins/${id}`);
  return res.data;
};

export const updateAdmin = async (id, dto) => {
  const res = await apiClient.put(`/admins/${id}`, dto);
  return res.data;
};

export const deleteAdmin = async (id) => {
  const res = await apiClient.delete(`/admins/${id}`);
  return res.data;
};

export const activateAdmin = async (id) => {
  const res = await apiClient.put(`/admins/${id}/activate`);
  return res.data;
};

export const deactivateAdmin = async (id) => {
  const res = await apiClient.put(`/admins/${id}/deactivate`);
  return res.data;
};
