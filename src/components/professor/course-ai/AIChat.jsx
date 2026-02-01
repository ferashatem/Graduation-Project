import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@mui/material";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import {
  callCourseAiAssistant,
  createCourseAiMessagePair,
  ensureCourseAiConversation,
  listenCourseAiMessages,
  updateCourseAiMessage,
} from "../../../firebase/courseAiApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

const toTimestampValue = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  const numeric = Number(timestamp);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const normalizeRecentMessages = (items) =>
  items
    .filter((message) => message?.content)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

function AIChat({ professorId, courseDocId, courseName }) {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [sendError, setSendError] = useState("");

  const listRef = useRef(null);

  useEffect(() => {
    let isActive = true;

    if (!professorId || !courseDocId) {
      setConversationId("");
      setMessages([]);
      setConversationLoading(false);
      return () => {
        isActive = false;
      };
    }

    // Ensure a conversation exists for this professor/course pair.
    setConversationLoading(true);
    setConversationError("");
    setMessages([]);

    ensureCourseAiConversation({ professorId, courseDocId })
      .then((conversation) => {
        if (!isActive) return;
        setConversationId(conversation.id);
      })
      .catch((err) => {
        if (!isActive) return;
        setConversationError(getErrorMessage(err, "Failed to start AI chat."));
      })
      .finally(() => {
        if (!isActive) return;
        setConversationLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [courseDocId, professorId]);

  useEffect(() => {
    if (!conversationId) return () => {};

    // Listen in real time to message updates inside this conversation.
    const unsubscribe = listenCourseAiMessages(
      conversationId,
      (items) => {
        setMessages(items);
      },
      (error) => {
        setConversationError(getErrorMessage(error, "Failed to load messages."));
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  const orderedMessages = useMemo(() => {
    const sorted = [...messages];
    sorted.sort((a, b) => toTimestampValue(a.createdAt) - toTimestampValue(b.createdAt));
    return sorted;
  }, [messages]);

  const isAiProcessing = useMemo(
    () => orderedMessages.some((message) => message.role === "ai" && message.status === "processing"),
    [orderedMessages]
  );

  const handleSend = useCallback(
    async (prompt) => {
      if (!conversationId || !professorId || !courseDocId) return;
      setSendError("");

      // 1) Save professor message + placeholder AI message.
      const { aiMessageId } = await createCourseAiMessagePair({
        conversationId,
        professorId,
        courseDocId,
        content: prompt,
      });

      // 2) Send recent context to the Cloud Function AI proxy.
      const recentMessages = normalizeRecentMessages([
        ...orderedMessages,
        { role: "professor", content: prompt },
      ]).slice(-10);

      try {
        await callCourseAiAssistant({
          conversationId,
          courseDocId,
          responseMessageId: aiMessageId,
          recentMessages,
        });
      } catch (err) {
        await updateCourseAiMessage({
          conversationId,
          messageId: aiMessageId,
          payload: {
            content: "Failed to generate response. Please try again.",
            status: "error",
          },
        });
        setSendError(getErrorMessage(err, "Failed to reach AI assistant."));
      }
    },
    [conversationId, courseDocId, orderedMessages, professorId]
  );

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [orderedMessages.length]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">AI Assistant</h3>
        <p className="text-xs text-slate-500">
          Ask questions about {courseName || "this course"} and generate quizzes.
        </p>
      </div>

      {conversationError ? (
        <div className="px-4 pt-4">
          <Alert severity="error">{conversationError}</Alert>
        </div>
      ) : null}

      <div
        ref={listRef}
        className="max-h-[360px] min-h-[240px] overflow-y-auto px-4 py-4"
      >
        {conversationLoading ? (
          <p className="text-sm text-slate-500">Loading conversation…</p>
        ) : orderedMessages.length === 0 ? (
          <p className="text-sm text-slate-500">
            No messages yet. Ask the assistant to get started.
          </p>
        ) : (
          <div className="space-y-3">
            {orderedMessages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
                status={message.status}
                createdAt={message.createdAt}
              />
            ))}
          </div>
        )}
      </div>

      {sendError ? (
        <div className="px-4 pb-2">
          <Alert severity="warning">{sendError}</Alert>
        </div>
      ) : null}

      <ChatInput
        onSend={handleSend}
        disabled={
          conversationLoading ||
          isAiProcessing ||
          !conversationId ||
          !professorId ||
          !courseDocId
        }
      />
    </div>
  );
}

export default AIChat;
