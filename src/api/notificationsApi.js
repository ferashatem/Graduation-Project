import apiClient from "./apiClient";

const unwrap = (res) => res.data?.data ?? res.data;

export const fetchMyNotifications = async (unreadOnly = false) => {
  const res = await apiClient.get("/notification", { params: { unreadOnly } });
  const payload = unwrap(res);
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const markNotificationRead = async (id) => {
  await apiClient.put(`/notification/${id}/read`);
};

export const sendAdminNotification = async (dto) => {
  const res = await apiClient.post("/notification", dto);
  return unwrap(res);
};

export const deleteNotification = async (id) => {
  await apiClient.delete(`/notification/${id}`);
};

export const sendToMyStudents = async (dto, offeringId) => {
  const res = await apiClient.post("/notification/send-to-my-students", dto, {
    params: offeringId ? { offeringId } : undefined,
  });
  return unwrap(res);
};
