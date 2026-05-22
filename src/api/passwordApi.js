import apiClient from "./apiClient";

export const changePassword = (currentPassword, newPassword) =>
  apiClient.post("/auth/change-password", { currentPassword, newPassword });

export const adminResetPassword = (userId) =>
  apiClient.post(`/auth/admin/reset-password/${userId}`);
