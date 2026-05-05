import { useCallback, useEffect, useRef, useState } from "react";
import {
  createConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
} from "../api/chatApi";

export function useChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState(null);
  const activeRef = useRef(activeConversationId);
  activeRef.current = activeConversationId;

  const loadConversations = useCallback(async () => {
    try {
      setLoadingConvs(true);
      const data = await fetchConversations();
      setConversations(data);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to load conversations.");
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const selectConversation = useCallback(async (id) => {
    if (id === activeRef.current) return;
    setActiveConversationId(id);
    setMessages([]);
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

    const optimisticUser = { id: `u-${Date.now()}`, role: "user", content: trimmed, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);
    setError(null);

    try {
      const result = await sendMessage(convId, trimmed);
      const aiMessage = {
        id: result?.id ?? `a-${Date.now()}`,
        role: result?.sender ?? "assistant",
        content: result?.content ?? "No response.",
        createdAt: result?.sentAt ?? new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }, [sending, startNewConversation]);

  return {
    conversations,
    activeConversationId,
    messages,
    sending,
    loadingConvs,
    loadingMsgs,
    error,
    selectConversation,
    startNewConversation,
    send,
  };
}
