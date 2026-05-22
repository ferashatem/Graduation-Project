import { useCallback, useEffect, useRef, useState } from "react";
import {
  createConversation,
  deleteConversation,
  deleteMessage,
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
      // FastAPI returns `response`, .NET may wrap it as `content` or `aiResponse`
      const responseText =
        result?.content ??
        result?.response ??
        result?.aiResponse ??
        result?.message ??
        "No response.";
      const aiMessage = {
        id: result?.id ?? `a-${Date.now()}`,
        role: result?.sender ?? "assistant",
        content: responseText,
        suggestions: result?.suggestions ?? [],
        createdAt: result?.sentAt ?? result?.createdAt ?? new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? "Failed to send message.");
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  }, [sending, startNewConversation]);

  const deleteConv = useCallback(async (conversationId) => {
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    if (activeRef.current === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
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
    selectConversation,
    startNewConversation,
    send,
    deleteMsg,
    deleteConv,
  };
}
