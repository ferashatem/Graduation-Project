import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "@mui/material";
import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import {
  callCourseAiAssistant,
  createCourseAiMessagePair,
  ensureCourseAiConversation,
  listenCourseAiMessages,
  updateCourseAiMessage,
} from "../../../firebase/courseAiApi";
import { useTranslation } from "react-i18next";
import { fetchMaterialsForCourse } from "../../../firebase/materialsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

const COURSE_AI_THEME_KEY = "course-ai-theme";

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

const normalizeLectureNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US");
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString("en-US");
  }
  return "";
};

const sortMaterials = (items) => {
  const sorted = [...items];
  sorted.sort((a, b) => {
    const aLecture = normalizeLectureNumber(a.lectureNumber);
    const bLecture = normalizeLectureNumber(b.lectureNumber);
    if (aLecture !== null && bLecture !== null) {
      return aLecture - bLecture;
    }
    if (aLecture !== null) return -1;
    if (bLecture !== null) return 1;
    return toTimestampValue(b.createdAt) - toTimestampValue(a.createdAt);
  });
  return sorted;
};

function AIChat({ professorId, courseDocId, courseName }) {
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [conversationError, setConversationError] = useState("");
  const [sendError, setSendError] = useState("");
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");
  const [selectedLectureId, setSelectedLectureId] = useState("");
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(COURSE_AI_THEME_KEY) === "dark";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(COURSE_AI_THEME_KEY, dark ? "dark" : "light");
    }
  }, [dark]);

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
    let isActive = true;

    if (!professorId || !courseDocId) {
      setMaterials([]);
      setMaterialsLoading(false);
      setMaterialsError("");
      return () => {
        isActive = false;
      };
    }

    setMaterialsLoading(true);
    setMaterialsError("");

    fetchMaterialsForCourse(professorId, courseDocId)
      .then((items) => {
        if (!isActive) return;
        const sorted = sortMaterials(items);
        setMaterials(sorted);
      })
      .catch((err) => {
        if (!isActive) return;
        setMaterialsError(
          getErrorMessage(err, "Failed to load lecture materials.")
        );
      })
      .finally(() => {
        if (!isActive) return;
        setMaterialsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [courseDocId, professorId]);

  useEffect(() => {
    if (materials.length === 0) {
      if (selectedLectureId) setSelectedLectureId("");
      return;
    }
    if (!selectedLectureId) {
      setSelectedLectureId(materials[0].id);
      return;
    }
    const exists = materials.some((material) => material.id === selectedLectureId);
    if (!exists) {
      setSelectedLectureId(materials[0].id);
    }
  }, [materials, selectedLectureId]);

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

  const selectedLecture = useMemo(
    () => materials.find((material) => material.id === selectedLectureId) || null,
    [materials, selectedLectureId]
  );

  const lectureOptions = useMemo(
    () =>
      materials.map((material) => {
        const lectureNumber = normalizeLectureNumber(material.lectureNumber);
        const lectureTitle = material.lectureTitle || "Untitled lecture";
        const lectureLabel = lectureNumber
          ? `Lecture ${lectureNumber}: ${lectureTitle}`
          : lectureTitle;
        const createdAtLabel = formatDate(material.createdAt);
        return {
          id: material.id,
          label: createdAtLabel ? `${lectureLabel} • ${createdAtLabel}` : lectureLabel,
        };
      }),
    [materials]
  );

  const isAiProcessing = useMemo(
    () => orderedMessages.some((message) => message.role === "ai" && message.status === "processing"),
    [orderedMessages]
  );

  const handleSend = useCallback(
    async (prompt) => {
      if (!conversationId || !professorId || !courseDocId) return;
      if (!selectedLecture) {
        setSendError("Please select a lecture before asking the assistant.");
        return;
      }
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
          lecture: {
            lectureId: selectedLecture.id,
            lectureTitle: selectedLecture.lectureTitle || "",
            lectureNumber: normalizeLectureNumber(selectedLecture.lectureNumber),
            notes: selectedLecture.notes || "",
            pdfUrl: selectedLecture.pdfUrl || "",
            createdAt: selectedLecture.createdAt || null,
          },
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
    [conversationId, courseDocId, orderedMessages, professorId, selectedLecture]
  );

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [orderedMessages.length]);

  return (
    <div className={dark ? "dark" : ""}>
    <div className="rounded-2xl border border-[#ececec] dark:border-[#2f2f2f] bg-white dark:bg-[#212121] overflow-hidden">
      <div className="border-b border-[#ececec] dark:border-[#2f2f2f] px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0d0d0d] dark:text-[#ececec]">AI Assistant</h3>
            <p className="text-xs text-[#8e8e8e] dark:text-[#9b9b9b]">
              Ask questions about {courseName || "this course"} and generate quizzes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDark((v) => !v)}
            className="p-1.5 rounded-md hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition shrink-0"
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-3">
          <label className="text-xs font-semibold text-[#5d5d5d] dark:text-[#b4b4b4]">
            Select lecture
          </label>
          <select
            className="mt-2 w-full rounded-xl border border-[#ececec] dark:border-[#3f3f3f] bg-white dark:bg-[#2f2f2f] px-3 py-2 text-sm text-[#0d0d0d] dark:text-[#ececec] shadow-sm"
            value={selectedLectureId}
            onChange={(event) => setSelectedLectureId(event.target.value)}
            disabled={materialsLoading || lectureOptions.length === 0}
          >
            {lectureOptions.length === 0 ? (
              <option value="">
                {materialsLoading ? "Loading lectures..." : "No lectures found"}
              </option>
            ) : null}
            {lectureOptions.map((lecture) => (
              <option key={lecture.id} value={lecture.id}>
                {lecture.label}
              </option>
            ))}
          </select>
          {materialsError ? (
            <p className="mt-2 text-xs text-rose-500">{materialsError}</p>
          ) : null}
        </div>
      </div>

      {conversationError ? (
        <div className="px-4 pt-4">
          <Alert severity="error">{conversationError}</Alert>
        </div>
      ) : null}

      <div
        ref={listRef}
        className="max-h-[420px] min-h-[280px] overflow-y-auto px-4 py-6"
      >
        {conversationLoading ? (
          <p className="text-sm text-[#8e8e8e] dark:text-[#9b9b9b]">Loading conversation…</p>
        ) : orderedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-10">
            <p className="text-[#0d0d0d] dark:text-[#ececec] font-semibold text-lg">How can I help with this lecture?</p>
            <p className="text-[#8e8e8e] dark:text-[#9b9b9b] text-sm mt-1">
              Ask anything or generate a quiz.
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
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
          !courseDocId ||
          !selectedLecture
        }
      />
    </div>
    </div>
  );
}

export default AIChat;
