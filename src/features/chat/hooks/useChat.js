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

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState(null);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const activeRef = useRef(activeConversationId);
  activeRef.current = activeConversationId;

  const parseTs = (v) => { if (!v) return 0; const t = new Date(v).getTime(); return isNaN(t) ? 0 : t; };

  // ULIDs encode timestamp — lexicographic sort = chronological sort
  const sortByLatest = (list) =>
    [...list].sort((a, b) => {
      const da = parseTs(a.updatedAt ?? a.createdAt);
      const db = parseTs(b.updatedAt ?? b.createdAt);
      if (da !== 0 || db !== 0) return db - da;
      return String(b.id ?? "").localeCompare(String(a.id ?? ""));
    });

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

  const send = useCallback(async (text) => {
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
    setMessages((prev) => [...prev, optimisticUser]);
    setPendingConfirmation(false);
    setSending(true);
    setError(null);

    const aiMsgId = `a-${Date.now()}`;
    const aiPlaceholder = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      suggestions: [],
      createdAt: new Date().toISOString(),
      streaming: true,
    };
    setMessages((prev) => [...prev, aiPlaceholder]);

    let streamWorked = false;

    try {
      await sendMessageStream(convId, trimmed, {
        onToken: (chunk) => {
          streamWorked = true;
          setMessages((prev) =>
            prev.map((m) => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m)
          );
        },
        onMeta: (meta) => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMsgId) return m;
              const updated = { ...m, streaming: false };
              if (meta.suggestions) updated.suggestions = meta.suggestions;
              if (meta.conversation_id && !activeRef.current) {
                setActiveConversationId(meta.conversation_id);
              }
              return updated;
            })
          );
        },
        onDone: () => {
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== aiMsgId) return m;
              const updated = { ...m, streaming: false };
              const txt = (m.content ?? "").toLowerCase();
              if (txt.includes("نعم") && txt.includes("لا") && (txt.includes("تأكيد") || txt.includes("تحب") || txt.includes("ردّ"))) {
                setPendingConfirmation(true);
              }
              return updated;
            })
          );
          setConversations((prev) => {
            const now = new Date().toISOString();
            return prev.map((c) =>
              c.id === activeRef.current ? { ...c, updatedAt: now } : c
            ).sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0));
          });
          setSending(false);
        },
        onError: async () => {
          // stream failed — fall back to regular endpoint
          await fallbackSend(convId, trimmed, aiMsgId);
        },
      });
    } catch {
      await fallbackSend(convId, trimmed, aiMsgId);
    }

    async function fallbackSend(cId, text, msgId) {
      try {
        const result = await sendMessage(cId, text);
        const responseText =
          result?.content ?? result?.response ?? result?.aiResponse ?? result?.message ?? "No response.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId
              ? { ...m, content: responseText, suggestions: result?.suggestions ?? [], streaming: false }
              : m
          )
        );
        const txt = responseText.toLowerCase();
        if (txt.includes("نعم") && txt.includes("لا") && (txt.includes("تأكيد") || txt.includes("تحب") || txt.includes("ردّ"))) {
          setPendingConfirmation(true);
        }
      } catch (e) {
        const errMsg = e?.response?.data?.message ?? e?.message ?? "Failed to send message.";
        setMessages((prev) =>
          prev.map((m) => m.id === msgId ? { ...m, content: errMsg, streaming: false } : m)
        );
        setError(errMsg);
      } finally {
        setSending(false);
      }
    }
  }, [sending, startNewConversation]);

  const confirmAction = useCallback(() => { send("نعم"); }, [send]);
  const cancelAction = useCallback(() => { send("لا"); setPendingConfirmation(false); }, [send]);

  const deleteConv = useCallback(async (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeRef.current === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
      setPendingConfirmation(false);
    }
    try {
      await deleteConversation(conversationId);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to delete conversation.");
    }
  }, []);

  const deleteMsg = useCallback(async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await deleteMessage(messageId);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to delete message.");
    }
  }, []);

  return {
    conversations,
    activeConversationId,
    messages,
    sending,
    loadingConvs,
    loadingMsgs,
    error,
    pendingConfirmation,
    selectConversation,
    startNewConversation,
    send,
    confirmAction,
    cancelAction,
    deleteMsg,
    deleteConv,
  };
}
