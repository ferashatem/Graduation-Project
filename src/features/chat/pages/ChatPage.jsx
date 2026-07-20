import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  HiOutlinePencilAlt, HiOutlineTrash, HiOutlineMenuAlt2,
  HiOutlineMoon, HiOutlineSun, HiCheck, HiX,
} from "react-icons/hi";
import { FiArrowUp } from "react-icons/fi";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useChat } from "../hooks/useChat";

// ── Markdown renderer ──────────────────────────────────────────────────────────
function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} style={{ color: "inherit", fontWeight: "bold" }}>{p.slice(2, -2)}</strong>
        : p
    );
  };
  for (const line of lines) {
    const isBullet = /^(\s*[-•*]\s)/.test(line);
    if (isBullet) {
      elements.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span>{renderInline(line.replace(/^\s*[-•*]\s/, ""))}</span>
        </div>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(<p key={key++} className="my-0.5">{renderInline(line)}</p>);
    }
  }
  return <>{elements}</>;
}

const THEME_KEY = "chat-theme";

// ── Category cards for empty state ────────────────────────────────────────────
const CATEGORIES = [
  {
    label: "Course Help",
    desc: "Ask about your courses, syllabus, or content.",
    color: "#7c3aed",
    bg: "#f5f3ff",
    darkBg: "#2e1065",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    prompt: "Tell me about my courses and syllabus",
  },
  {
    label: "Grades & Exams",
    desc: "Get information about grades or exams.",
    color: "#0ea5e9",
    bg: "#f0f9ff",
    darkBg: "#082f49",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    prompt: "What are my current grades and upcoming exams?",
  },
  {
    label: "Schedule",
    desc: "Check your schedule or upcoming classes.",
    color: "#10b981",
    bg: "#f0fdf4",
    darkBg: "#052e16",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    prompt: "What's my class schedule this week?",
  },
  {
    label: "University Info",
    desc: "Ask about policies, rules or services.",
    color: "#f59e0b",
    bg: "#fffbeb",
    darkBg: "#451a03",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    prompt: "What are the university policies and rules?",
  },
];

const SUGGESTED = [
  { icon: "📋", text: "What are my upcoming assignments?" },
  { icon: "📅", text: "What's my class schedule tomorrow?" },
  { icon: "📝", text: "How can I improve my grade?" },
  { icon: "🏛️", text: "What are the university rules?" },
];

// ── AI Robot Avatar (empty state) ─────────────────────────────────────────────
function AIRobotIcon() {
  return (
    <div className="relative w-20 h-20 mb-2">
      <span className="absolute -top-1 -left-2 text-violet-300 text-lg">✦</span>
      <span className="absolute top-0 right-0 text-violet-400 text-sm">✦</span>
      <span className="absolute bottom-0 -right-2 text-violet-300 text-xs">✦</span>
      <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className="w-12 h-12">
          <rect x="12" y="20" width="40" height="30" rx="8" fill="#7c3aed" />
          <rect x="20" y="28" width="8" height="8" rx="2" fill="white" />
          <rect x="36" y="28" width="8" height="8" rx="2" fill="white" />
          <rect x="24" y="38" width="16" height="4" rx="2" fill="white" opacity="0.7" />
          <rect x="29" y="12" width="6" height="10" rx="3" fill="#7c3aed" />
          <circle cx="32" cy="10" r="4" fill="#a78bfa" />
          <rect x="12" y="32" width="4" height="10" rx="2" fill="#7c3aed" />
          <rect x="48" y="32" width="4" height="10" rx="2" fill="#7c3aed" />
        </svg>
      </div>
    </div>
  );
}

// ── Conversation item ─────────────────────────────────────────────────────────
function ConversationItem({ conv, active, onClick, onDelete }) {
  const title = conv?.title || "New chat";
  const [hovered, setHovered] = useState(false);
  const dateStr = conv?.updatedAt ?? conv?.createdAt ?? "";
  const date = dateStr ? new Date(dateStr) : null;
  const now = new Date();
  const isToday = date && date.toDateString() === now.toDateString();
  const timeLabel = date
    ? isToday
      ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : date.toLocaleDateString([], { month: "short", day: "numeric" })
    : "";

  return (
    <div
      className={`group flex items-start gap-2 rounded-xl px-3 py-2.5 cursor-pointer transition ${
        active
          ? "bg-violet-50 dark:bg-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-700"
          : "hover:bg-slate-50 dark:hover:bg-gray-700/50"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onClick(conv.id)}
    >
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center shrink-0 mt-0.5">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${active ? "text-violet-700 dark:text-violet-400" : "text-slate-700 dark:text-gray-200"}`}>{title}</p>
        {timeLabel && (
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
            {isToday ? `Today, ${timeLabel}` : timeLabel}
          </p>
        )}
      </div>
      {hovered && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="shrink-0 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
        >
          <HiOutlineTrash className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Message helpers ───────────────────────────────────────────────────────────
function AssistantAvatar() {
  return (
    <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 text-white text-xs font-bold">
      AI
    </div>
  );
}

function isUserMessage(msg) {
  const raw = msg?.role ?? msg?.sender ?? msg?.senderType ?? msg?.from;
  if (raw === 0 || raw === "0") return true;
  if (typeof raw === "string") {
    const v = raw.toLowerCase();
    return v === "user" || v === "human" || v === "professor" || v === "student" || v === "me";
  }
  return false;
}

function ChatBubble({ msg, onSuggestionClick, onDelete, onRegenerate }) {
  const isUser = isUserMessage(msg);
  const text = msg.content ?? msg.message ?? "";
  const suggestions = !isUser && Array.isArray(msg.suggestions) ? msg.suggestions : [];
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  function copyText() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  if (isUser) {
    return (
      <div
        className="flex justify-end group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex items-end gap-1.5 max-w-[75%]">
          {hovered && (
            <button
              type="button"
              onClick={() => onDelete?.(msg.id)}
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mb-1"
            >
              <HiOutlineTrash className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="rounded-2xl rounded-br-sm bg-[#0b2c4a] dark:bg-violet-600 text-white px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap" dir="auto">
            {text}
          </div>
        </div>
      </div>
    );
  }

  const isCancelled = msg.streamStatus === "cancelled";
  const isError = msg.isError || msg.streamStatus === "error";
  const isCompleted = msg.streamStatus === "completed" || (!msg.streaming && !isCancelled && !isError && text);

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AssistantAvatar />
      <div className="flex-1 min-w-0 pt-1">
        <div
          className={`text-sm leading-relaxed [&_strong]:text-current [&_b]:text-current ${isError ? "text-red-500 dark:text-red-400" : "text-slate-800 dark:text-gray-200"}`}
          dir="auto"
        >
          <MarkdownText text={text} />
          {msg.streaming && msg.streamStatus !== "typing" && (
            <span className="inline-block w-0.5 h-4 bg-slate-600 dark:bg-gray-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>

        {/* Typing indicator before first token */}
        {msg.streamStatus === "typing" && !text && (
          <div className="flex items-center gap-1 mt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestionClick?.(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Action row — shown on hover for completed messages */}
        {(hovered || isError) && (
          <div className="flex items-center gap-1.5 mt-2">
            {isCompleted && (
              <button
                type="button"
                onClick={copyText}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
              >
                {copied ? <HiCheck className="h-3.5 w-3.5 text-emerald-500" /> : "📋"}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
            {(isCompleted || isCancelled) && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-gray-700 transition"
              >
                🔄 Regenerate
              </button>
            )}
            {isError && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                ↩ Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete?.(msg.id)}
              className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <HiOutlineTrash className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1 pt-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-violet-500 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Sparkle icon ──────────────────────────────────────────────────────────────
function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2l2.4 7.2H22l-6.4 4.6 2.4 7.2L12 17l-6 4 2.4-7.2L2 9.2h7.6z" opacity="0.15"/>
      <path d="M12 3.5l1.8 5.5H19l-4.8 3.5 1.8 5.5L12 14.5l-4.8 3 1.8-5.5L4.5 9h5.7z"/>
    </svg>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────
export default function ChatPage() {
  const {
    conversations, activeConversationId, messages, sending, streamStatus,
    loadingConvs, loadingMsgs, error, pendingConfirmation,
    selectConversation, startNewConversation, send, cancelSend, regenerate,
    confirmAction, cancelAction, deleteMsg, deleteConv,
  } = useChat();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showAllChats, setShowAllChats] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(THEME_KEY) === "dark";
  });
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);
  const baseInputRef = useRef("");

  const { state: locationState } = useLocation();

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const speechLang = "ar-EG";

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  useEffect(() => {
    setInput(baseInputRef.current + transcript);
  }, [transcript]);

  // Auto-select conversation passed via navigation state (from My Subjects → explain with AI)
  useEffect(() => {
    if (!loadingConvs && locationState?.conversationId) {
      selectConversation(locationState.conversationId);
    }
    // intentionally omit selectConversation — stable useCallback, deps cause false re-runs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingConvs, locationState?.conversationId]);

  // Auto-send initial message once the conversation is selected and messages are loaded.
  // setTimeout + cleanup prevents StrictMode double-fire in development.
  useEffect(() => {
    if (
      !loadingMsgs &&
      locationState?.autoSend &&
      activeConversationId === locationState?.conversationId &&
      messages.length === 0
    ) {
      const timer = setTimeout(() => send(locationState.autoSend), 0);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingMsgs, activeConversationId, locationState?.conversationId, locationState?.autoSend]);

  const toggleMic = useCallback(() => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      baseInputRef.current = input;
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: speechLang });
    }
  }, [listening, input, resetTranscript, speechLang]);

  const handleSend = async (overrideText) => {
    const text = typeof overrideText === "string" ? overrideText : input;
    if (!text.trim() || sending) return;
    if (listening) SpeechRecognition.stopListening();
    setInput("");
    await send(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const isEmpty = messages.length === 0 && !loadingMsgs;
  const visibleConversations = showAllChats ? conversations : conversations.slice(0, 5);

  return (
    <div className={`h-full ${dark ? "dark" : ""}`}>
      <div className="flex h-full overflow-hidden bg-white dark:bg-gray-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-gray-700">

        {/* ── Chats sidebar ── */}
        <aside
          className={`flex flex-col border-r border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-900 transition-all duration-200 ${
            sidebarOpen ? "w-60 min-w-[220px]" : "w-0 overflow-hidden"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition"
            >
              <HiOutlineMenuAlt2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={startNewConversation}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition"
              title="New chat"
            >
              <HiOutlinePencilAlt className="h-5 w-5" />
            </button>
          </div>

          {/* New chat button */}
          <div className="px-3 py-3">
            <button
              type="button"
              onClick={startNewConversation}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-200 dark:border-gray-600 text-sm text-slate-500 dark:text-gray-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New chat
            </button>
          </div>

          {/* Chats list */}
          <p className="px-4 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-gray-500">Chats</p>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
            {loadingConvs ? (
              <p className="px-3 py-2 text-xs text-slate-400 dark:text-gray-500">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-4 text-xs text-slate-400 dark:text-gray-500 text-center">No conversations yet.</p>
            ) : (
              visibleConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeConversationId}
                  onClick={selectConversation}
                  onDelete={deleteConv}
                />
              ))
            )}
          </div>

          {/* View all chats */}
          {conversations.length > 5 && !showAllChats && (
            <div className="px-3 pb-4 border-t border-slate-100 dark:border-gray-700 pt-3">
              <button
                type="button"
                onClick={() => setShowAllChats(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                View all chats
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </aside>

        {/* ── Main area ── */}
        <div className="flex flex-1 flex-col min-w-0 bg-white dark:bg-gray-900">
          {/* Top bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-gray-700 shrink-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition"
              >
                <HiOutlineMenuAlt2 className="h-5 w-5" />
              </button>
            )}
            {!sidebarOpen && (
              <button
                type="button"
                onClick={startNewConversation}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition"
              >
                <HiOutlinePencilAlt className="h-5 w-5" />
              </button>
            )}
            <p className="text-base font-bold text-slate-800 dark:text-gray-100">AI Assistant</p>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-500 dark:text-gray-400 transition"
              >
                {dark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-5 py-6 space-y-6">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-slate-400 dark:text-gray-500 text-sm">Loading messages…</p>
                </div>
              ) : isEmpty ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center text-center pt-10">
                  <AIRobotIcon />
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-gray-100 mt-2">How can I help you today?</h2>
                  <p className="text-slate-400 dark:text-gray-500 text-sm mt-1.5 max-w-sm">
                    Ask me anything about your courses, grades, or university info.
                  </p>

                  {/* Category cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8 w-full">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => handleSend(cat.prompt)}
                        className="flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition hover:shadow-md hover:-translate-y-0.5"
                        style={{ background: dark ? cat.darkBg : cat.bg, border: `1px solid ${cat.color}20` }}
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${cat.color}18`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <p className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 leading-snug">{cat.desc}</p>
                        <div style={{ color: cat.color }}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Suggested questions */}
                  <div className="w-full mt-6 text-left">
                    <p className="text-sm font-bold text-amber-600 mb-3">Suggested questions</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SUGGESTED.map((q) => (
                        <button
                          key={q.text}
                          type="button"
                          onClick={() => handleSend(q.text)}
                          className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 text-sm text-slate-600 dark:text-gray-300 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 transition text-left"
                        >
                          <span className="text-base">{q.icon}</span>
                          {q.text}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isLastAi = !isUserMessage(msg) && idx === messages.length - 1;
                  return (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      onSuggestionClick={handleSend}
                      onDelete={deleteMsg}
                      onRegenerate={isLastAi ? regenerate : undefined}
                    />
                  );
                })
              )}

              {/* Global typing dots only when no streaming bubble yet */}
              {sending && streamStatus === "typing" && messages.every((m) => isUserMessage(m)) && (
                <TypingDots />
              )}

              {error && (
                <p className="text-center text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-3 py-2 ring-1 ring-red-100 dark:ring-red-800">
                  {error}
                </p>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 px-4 pb-4">
            <div className="mx-auto max-w-3xl">
              {pendingConfirmation && (
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm text-slate-700 dark:text-gray-200 font-medium">تأكيد التنفيذ؟</span>
                  <button
                    type="button"
                    onClick={confirmAction}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    <HiCheck className="h-4 w-4" /> نعم، نفّذ
                  </button>
                  <button
                    type="button"
                    onClick={cancelAction}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    <HiX className="h-4 w-4" /> إلغاء
                  </button>
                </div>
              )}

              {/* Stop Generating button */}
              {sending && (
                <div className="flex justify-center mb-2">
                  <button
                    type="button"
                    onClick={cancelSend}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-300 dark:border-gray-600 text-sm text-slate-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition shadow-sm"
                  >
                    <span className="h-3 w-3 rounded-sm bg-slate-600 dark:bg-gray-300 inline-block" />
                    Stop Generating
                  </button>
                </div>
              )}

              <div className="flex items-end gap-2 bg-slate-50 dark:bg-gray-800 rounded-2xl px-4 py-3 ring-1 ring-slate-200 dark:ring-gray-600 focus-within:ring-violet-300 transition">
                {/* Sparkle icon */}
                <div className="text-violet-400 pb-1 shrink-0">
                  <SparkleIcon />
                </div>
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="flex-1 resize-none bg-transparent text-sm text-slate-800 dark:text-gray-100 placeholder-slate-400 dark:placeholder-gray-500 outline-none max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: "1.6" }}
                />
                {browserSupportsSpeechRecognition && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    title={listening ? "Stop listening" : "Voice input"}
                    className={`shrink-0 h-9 w-9 rounded-xl flex items-center justify-center transition ${
                      listening
                        ? "bg-red-500 text-white hover:bg-red-600"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {listening ? (
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                      </span>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSend()}
                  disabled={sending || !input.trim()}
                  className="shrink-0 h-9 w-9 rounded-xl bg-violet-600 text-white flex items-center justify-center transition hover:bg-violet-700 disabled:bg-slate-200 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                >
                  <FiArrowUp className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 dark:text-gray-500 mt-2">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
