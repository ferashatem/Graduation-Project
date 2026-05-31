import { useEffect, useRef, useState } from "react";
import { HiOutlinePencilAlt, HiOutlinePlus, HiOutlineTrash, HiOutlineMenuAlt2, HiOutlineSun, HiOutlineMoon, HiCheck, HiX } from "react-icons/hi";
import { FiArrowUp } from "react-icons/fi";
import { useChat } from "../hooks/useChat";

// Simple markdown → React renderer (bold, bullet lists, line breaks)
function MarkdownText({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let key = 0;

  const renderInline = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i}>{p.slice(2, -2)}</strong>;
      }
      return p;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isBullet = /^(\s*[-•*]\s)/.test(line);
    if (isBullet) {
      const content = line.replace(/^\s*[-•*]\s/, "");
      elements.push(
        <div key={key++} className="flex gap-2 my-0.5">
          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current shrink-0 opacity-60" />
          <span>{renderInline(content)}</span>
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

function ConversationItem({ conv, active, onClick, onDelete }) {
  const title = conv?.title || "New chat";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg transition px-2 ${
        active
          ? "bg-[#ececec] dark:bg-[#2f2f2f]"
          : "hover:bg-[#ececec] dark:hover:bg-[#2f2f2f]"
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        onClick={() => onClick(conv.id)}
        className="flex-1 text-left py-2 text-sm text-[#0d0d0d] dark:text-[#ececec] truncate"
      >
        <span className="truncate block">{title}</span>
      </button>
      {hovered && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
          className="shrink-0 p-1 rounded-md text-[#5d5d5d] dark:text-[#9b9b9b] hover:text-red-500 hover:bg-white dark:hover:bg-[#3f3f3f] transition"
          title="Delete conversation"
        >
          <HiOutlineTrash className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <div className="h-7 w-7 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] flex items-center justify-center shrink-0 text-white dark:text-[#0d0d0d] text-[11px] font-semibold">
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

function ChatBubble({ msg, onSuggestionClick, onDelete }) {
  const isUser = isUserMessage(msg);
  const text = msg.content ?? msg.message ?? "";
  const suggestions = !isUser && Array.isArray(msg.suggestions) ? msg.suggestions : [];
  const [hovered, setHovered] = useState(false);

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
              className="p-1 rounded-md text-[#8e8e8e] hover:text-red-500 hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] transition mb-1"
              title="Delete message"
            >
              <HiOutlineTrash className="h-3.5 w-3.5" />
            </button>
          )}
          <div className="rounded-3xl bg-[#f4f4f4] dark:bg-[#323232] text-[#0d0d0d] dark:text-[#ececec] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
            {text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-3 group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AssistantAvatar />
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[15px] leading-relaxed text-[#0d0d0d] dark:text-[#ececec]">
          <MarkdownText text={text} />
          {msg.streaming && (
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse align-middle" />
          )}
        </div>
        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestionClick?.(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#e5e5e5] dark:border-[#4a4a4a] text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] transition"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        {hovered && (
          <button
            type="button"
            onClick={() => onDelete?.(msg.id)}
            className="mt-2 p-1 rounded-md text-[#8e8e8e] hover:text-red-500 hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] transition"
            title="Delete message"
          >
            <HiOutlineTrash className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-3">
      <AssistantAvatar />
      <div className="flex items-center gap-1 pt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatPage() {
  const {
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
  } = useChat();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(THEME_KEY) === "dark";
  });
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    }
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

  const handleSend = async (overrideText) => {
    const text = overrideText ?? input;
    if (!text.trim() || sending) return;
    setInput("");
    await send(text);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = messages.length === 0 && !loadingMsgs;

  return (
    <div className={`h-full ${dark ? "dark" : ""}`}>
      <div className="flex h-full overflow-hidden bg-white dark:bg-[#212121]">
        {/* Sidebar */}
        <aside
          className={`flex flex-col bg-[#f9f9f9] dark:bg-[#171717] border-r border-[#ececec] dark:border-[#2f2f2f] transition-all duration-200 ${
            sidebarOpen ? "w-64 min-w-[240px]" : "w-0 overflow-hidden"
          }`}
        >
          <div className="flex items-center justify-between px-3 py-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-md hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition"
              title="Close sidebar"
            >
              <HiOutlineMenuAlt2 className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={startNewConversation}
              title="New chat"
              className="p-1.5 rounded-md hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition"
            >
              <HiOutlinePencilAlt className="h-5 w-5" />
            </button>
          </div>

          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={startNewConversation}
              className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] transition"
            >
              <HiOutlinePlus className="h-4 w-4" />
              New chat
            </button>
          </div>

          <div className="px-3 pt-2 pb-1">
            <p className="text-xs font-medium text-[#8e8e8e] dark:text-[#9b9b9b] px-2">Chats</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {loadingConvs ? (
              <p className="px-3 py-2 text-xs text-[#8e8e8e] dark:text-[#9b9b9b]">Loading…</p>
            ) : conversations.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[#8e8e8e] dark:text-[#9b9b9b]">No conversations yet.</p>
            ) : (
              conversations.map((conv) => (
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
        </aside>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Chat header */}
          <div className="flex items-center gap-2 px-3 py-2.5 shrink-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-md hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition"
                title="Open sidebar"
              >
                <HiOutlineMenuAlt2 className="h-5 w-5" />
              </button>
            )}
            <p className="text-base font-semibold text-[#0d0d0d] dark:text-[#ececec]">AI Assistant</p>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setDark((v) => !v)}
                className="p-1.5 rounded-md hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] text-[#5d5d5d] dark:text-[#b4b4b4] transition"
                title={dark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {dark ? <HiOutlineSun className="h-5 w-5" /> : <HiOutlineMoon className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-20">
                  <p className="text-[#8e8e8e] dark:text-[#9b9b9b] text-sm">Loading messages…</p>
                </div>
              ) : isEmpty ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center py-24">
                  <p className="text-[#0d0d0d] dark:text-[#ececec] font-semibold text-2xl">How can I help you today?</p>
                  <p className="text-[#8e8e8e] dark:text-[#9b9b9b] text-sm">
                    Ask me anything about your courses, grades, or university info.
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <ChatBubble key={msg.id} msg={msg} onSuggestionClick={handleSend} onDelete={deleteMsg} />
                ))
              )}

              {sending && <TypingDots />}

              {error && (
                <p className="text-center text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="shrink-0 pb-4 px-4">
            <div className="mx-auto max-w-3xl">
              {pendingConfirmation && (
                <div className="flex items-center gap-3 mb-3 px-1">
                  <span className="text-sm text-[#0d0d0d] dark:text-[#ececec] font-medium">تأكيد التنفيذ؟</span>
                  <button
                    type="button"
                    onClick={confirmAction}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    <HiCheck className="h-4 w-4" />
                    نعم، نفّذ
                  </button>
                  <button
                    type="button"
                    onClick={cancelAction}
                    disabled={sending}
                    className="flex items-center gap-1.5 rounded-full border border-[#e5e5e5] dark:border-[#4a4a4a] text-[#0d0d0d] dark:text-[#ececec] hover:bg-[#f4f4f4] dark:hover:bg-[#2f2f2f] px-4 py-1.5 text-sm font-semibold transition disabled:opacity-50"
                  >
                    <HiX className="h-4 w-4" />
                    إلغاء
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2 bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-3xl px-4 py-3 shadow-sm">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything"
                  className="flex-1 resize-none bg-transparent text-[15px] text-[#0d0d0d] dark:text-[#ececec] placeholder-[#8e8e8e] dark:placeholder-[#9b9b9b] outline-none max-h-[200px] overflow-y-auto py-1"
                  style={{ lineHeight: "1.5" }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="shrink-0 h-9 w-9 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] text-white dark:text-[#0d0d0d] flex items-center justify-center transition hover:bg-[#2d2d2d] dark:hover:bg-white disabled:bg-[#d7d7d7] dark:disabled:bg-[#4a4a4a] dark:disabled:text-[#7a7a7a] disabled:cursor-not-allowed"
                >
                  <FiArrowUp className="h-4 w-4" />
                </button>
              </div>
              <p className="text-center text-xs text-[#8e8e8e] dark:text-[#9b9b9b] mt-2">
                AI can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
