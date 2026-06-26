import { useCallback, useEffect, useRef, useState } from "react";
import {
  createConversation,
  deleteConversation,
  deleteMessage,
  fetchConversations,
  fetchMessages,
  sendMessage,
  sendMessageStream,
} from "../api/chatApi";

// streamStatus values: 'idle' | 'typing' | 'streaming' | 'error' | 'cancelled'

const parseTs = (v) => { if (!v) return 0; const t = new Date(v).getTime(); return isNaN(t) ? 0 : t; };

const sortByLatest = (list) =>
  [...list].sort((a, b) => {
    const da = parseTs(a.updatedAt ?? a.createdAt);
    const db = parseTs(b.updatedAt ?? b.createdAt);
    if (da !== 0 || db !== 0) return db - da;
    return String(b.id ?? "").localeCompare(String(a.id ?? ""));
  });

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [streamStatus, setStreamStatus] = useState("idle");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);

  const activeRef = useRef(activeConversationId);
  activeRef.current = activeConversationId;
  const cancelRef = useRef(null);

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const data = await fetchConversations();
      setConversations(sortByLatest(data));
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load conversations.");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const selectConversation = useCallback(async (id) => {
    if (id === activeRef.current) return;
    setActiveConversationId(id);
    setMessages([]);
    setPendingConfirmation(false);
    try {
      setLoadingMsgs(true);
      const data = await fetchMessages(id);
      setMessages(data);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load messages.");
    } finally {
      setLoadingMsgs(false);
    }
  }, []);

  const startNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation("New Chat");
      const newConv = conv ?? { id: Date.now(), title: "New Chat" };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setMessages([]);
      setPendingConfirmation(false);
      return newConv;
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to create conversation.");
      return null;
    }
  }, []);

  const cancelSend = useCallback(() => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
  }, []);

  const send = useCallback(async (text, { isRetry = false, retryAiMsgId = null } = {}) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    let convId = activeRef.current;
    if (!convId) {
      const conv = await startNewConversation();
      if (!conv) return;
      convId = conv.id;
    }

    const optimisticUser = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };

    // On retry we reuse the existing AI bubble; otherwise create fresh ones
    const aiMsgId = retryAiMsgId ?? `a-${Date.now()}`;

    if (!isRetry) {
      setMessages((prev) => [
        ...prev,
        optimisticUser,
        {
          id: aiMsgId,
          role: "assistant",
          content: "",
          suggestions: [],
          createdAt: new Date().toISOString(),
          streaming: true,
          streamStatus: "typing",
        },
      ]);
    } else {
      // Reset the existing AI bubble for retry
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId
            ? { ...m, content: "", streaming: true, streamStatus: "typing", isError: false }
            : m
        )
      );
    }

    setPendingConfirmation(false);
    setSending(true);
    setStreamStatus("typing");
    setError(null);

    const updateAiBubble = (updater) =>
      setMessages((prev) => prev.map((m) => (m.id === aiMsgId ? updater(m) : m)));

    let streamErrored = false;

    try {
      const cancel = await sendMessageStream(convId, trimmed, {
        onTyping: () => {
          setStreamStatus("typing");
          updateAiBubble((m) => ({ ...m, streamStatus: "typing" }));
        },

        onToken: (chunk) => {
          setStreamStatus("streaming");
          updateAiBubble((m) => ({
            ...m,
            content: m.content + chunk,
            streaming: true,
            streamStatus: "streaming",
          }));
        },

        onCompleted: (frame) => {
          setStreamStatus("idle");
          updateAiBubble((m) => {
            const updated = {
              ...m,
              streaming: false,
              streamStatus: "completed",
              suggestions: frame.suggestions ?? m.suggestions,
            };
            // Replace temp id with real messageId if provided
            if (frame.messageId) updated.id = frame.messageId;
            // Check if AI is asking for confirmation
            const txt = (m.content ?? "").toLowerCase();
            if (
              txt.includes("نعم") && txt.includes("لا") &&
              (txt.includes("تأكيد") || txt.includes("تحب") || txt.includes("ردّ"))
            ) {
              setPendingConfirmation(true);
            }
            return updated;
          });
          bumpConvTimestamp(convId);
          setSending(false);
          cancelRef.current = null;
        },

        onCancelled: (msg) => {
          setStreamStatus("cancelled");
          updateAiBubble((m) => ({
            ...m,
            streaming: false,
            streamStatus: "cancelled",
            content: m.content + (m.content ? "\n\n*(توقف التوليد)*" : "*(توقف التوليد)*"),
          }));
          setSending(false);
          cancelRef.current = null;
        },

        onError: async () => {
          streamErrored = true;
          await fallbackSend(convId, trimmed, aiMsgId);
        },
      });

      cancelRef.current = cancel ?? null;
    } catch {
      if (!streamErrored) await fallbackSend(convId, trimmed, aiMsgId);
    }

    async function fallbackSend(cId, msgText, msgId) {
      try {
        const result = await sendMessage(cId, msgText);
        const responseText =
          result?.content ?? result?.response ?? result?.aiResponse ?? result?.message ?? "No response.";
        updateAiBubble((m) => ({
          ...m,
          content: responseText,
          suggestions: result?.suggestions ?? [],
          streaming: false,
          streamStatus: "completed",
        }));
        const txt = responseText.toLowerCase();
        if (
          txt.includes("نعم") && txt.includes("لا") &&
          (txt.includes("تأكيد") || txt.includes("تحب") || txt.includes("ردّ"))
        ) {
          setPendingConfirmation(true);
        }
        bumpConvTimestamp(cId);
      } catch (e) {
        const errMsg = e?.response?.data?.message ?? e?.message ?? "Failed to send message.";
        updateAiBubble((m) => ({ ...m, content: errMsg, streaming: false, streamStatus: "error", isError: true }));
        setError(errMsg);
        setStreamStatus("error");
      } finally {
        setSending(false);
        cancelRef.current = null;
      }
    }

    function bumpConvTimestamp(cId) {
      const now = new Date().toISOString();
      setConversations((prev) =>
        prev
          .map((c) => (c.id === cId ? { ...c, updatedAt: now } : c))
          .sort(
            (a, b) =>
              new Date(b.updatedAt ?? b.createdAt ?? 0) -
              new Date(a.updatedAt ?? a.createdAt ?? 0)
          )
      );
    }
  }, [sending, startNewConversation]);

  const confirmAction = useCallback(() => { send("نعم"); }, [send]);
  const cancelAction  = useCallback(() => { send("لا"); setPendingConfirmation(false); }, [send]);

  const deleteConv = useCallback(async (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeRef.current === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setPendingConfirmation(false);
    }
    try { await deleteConversation(conversationId); } catch {}
  }, []);

  const deleteMsg = useCallback(async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try { await deleteMessage(messageId); } catch {}
  }, []);

  // Regenerate: re-send the last user message, reusing the last AI bubble
  const regenerate = useCallback(() => {
    const msgs = messages;
    const lastAi = [...msgs].reverse().find((m) => !isUserMsg(m));
    const lastUser = [...msgs].reverse().find((m) => isUserMsg(m));
    if (!lastAi || !lastUser) return;
    send(lastUser.content ?? lastUser.message ?? "", { isRetry: true, retryAiMsgId: lastAi.id });
  }, [messages, send]);

  return {
    conversations,
    activeConversationId,
    messages,
    sending,
    streamStatus,
    loadingConvs,
    loadingMsgs,
    error,
    pendingConfirmation,
    selectConversation,
    startNewConversation,
    send,
    cancelSend,
    regenerate,
    confirmAction,
    cancelAction,
    deleteMsg,
    deleteConv,
  };
}

function isUserMsg(msg) {
  const raw = msg?.role ?? msg?.sender ?? msg?.senderType ?? msg?.from;
  if (raw === 0 || raw === "0") return true;
  if (typeof raw === "string") {
    const v = raw.toLowerCase();
    return v === "user" || v === "human" || v === "professor" || v === "student" || v === "me";
  }
  return false;
}
