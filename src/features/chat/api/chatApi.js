import apiClient from "../../../api/apiClient";
import { getStoredAccessToken } from "../../../auth/session";

const STREAM_BASE = "https://universitymanagementsystem-production-e58e.up.railway.app/api";

/**
 * SSE streaming send.
 * Handles event types: typing | token | completed | error | cancelled
 * Returns a cancel function — call it to abort mid-stream.
 */
export const sendMessageStream = async (
  conversationId,
  message,
  { onTyping, onToken, onCompleted, onCancelled, onError } = {}
) => {
  const token = getStoredAccessToken();
  const controller = new AbortController();

  const doFetch = async () => {
    let resp;
    try {
      resp = await fetch(`${STREAM_BASE}/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ conversationId, message }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err.name === "AbortError") { onCancelled?.(); return; }
      onError?.(err.message ?? "Connection failed");
      return;
    }

    if (!resp.ok) {
      const msg = await resp.text().catch(() => `HTTP ${resp.status}`);
      onError?.(msg);
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          let frame;
          try { frame = JSON.parse(raw); } catch { continue; }

          switch (frame.type) {
            case "typing":
              onTyping?.();
              break;
            case "token":
              onToken?.(frame.content ?? "");
              break;
            // legacy "done" event (kept for backward compat)
            case "done":
              onCompleted?.({});
              return;
            case "completed":
              onCompleted?.(frame);
              return;
            case "error":
              onError?.(frame.message ?? "Stream error");
              return;
            case "cancelled":
              onCancelled?.(frame.message);
              return;
            // legacy "meta" — treat as completion metadata
            case "meta":
              if (frame.suggestions) onCompleted?.({ suggestions: frame.suggestions });
              break;
            default:
              break;
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") { onCancelled?.(); }
      else { onError?.(err.message ?? "Stream interrupted"); }
    }
  };

  doFetch();
  return () => controller.abort();
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
