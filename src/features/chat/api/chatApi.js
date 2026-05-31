import apiClient from "../../../api/apiClient";
import { getStoredAccessToken } from "../../../auth/session";

const STREAM_BASE = "https://universitymanagementsystem-production-e58e.up.railway.app/api";

export const sendMessageStream = async (conversationId, content, { onToken, onMeta, onDone, onError } = {}) => {
  const token = getStoredAccessToken();
  const resp = await fetch(`${STREAM_BASE}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ conversationId, content }),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => `HTTP ${resp.status}`);
    onError?.(msg);
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const frame = JSON.parse(line.slice(6));
        if (frame.type === "token") onToken?.(frame.content);
        else if (frame.type === "meta") onMeta?.(frame);
        else if (frame.type === "done") { onDone?.(); return; }
        else if (frame.type === "error") { onError?.(frame.message); return; }
      } catch {}
    }
  }
  onDone?.();
};

export const sendMessage = async (conversationId, content) => {
  const res = await apiClient.post("/Chat/messages", { conversationId, content });
  return res.data?.data ?? res.data;
};

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

export const deleteMessage = async (messageId) => {
  await apiClient.delete(`/Chat/messages/${messageId}`);
};

export const deleteConversation = async (conversationId) => {
  await apiClient.delete(`/Chat/conversations/${conversationId}`);
};
