import apiClient from "../../../api/apiClient";
import { getStoredRole } from "../../../auth/session";

export const createConversation = async (title = "New Chat") => {
  const res = await apiClient.post("/Chat/conversations", { title });
  return res.data?.data ?? res.data;
};

export const fetchConversations = async () => {
  const res = await apiClient.get("/Chat/conversations");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const fetchMessages = async (conversationId, page = 1, pageSize = 50) => {
  const res = await apiClient.get(`/Chat/conversations/${conversationId}/messages`, {
    params: { page, pageSize },
  });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};

export const sendMessage = async (conversationId, content) => {
  const role = getStoredRole();
  const res = await apiClient.post("/Chat/messages", { conversationId, content, role });
  return res.data?.data ?? res.data;
};
