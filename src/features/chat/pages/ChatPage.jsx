import { useEffect, useRef, useState } from "react";
import { HiChat, HiPaperAirplane, HiPencilAlt, HiPlus } from "react-icons/hi";
import { useChat } from "../hooks/useChat";

function ConversationItem({ conv, active, onClick }) {
  const title = conv?.title || "Conversation";
  return (
    <button
      type="button"
      onClick={() => onClick(conv.id)}
      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition truncate ${
        active
          ? "bg-white/90 text-slate-900 shadow-sm ring-1 ring-white/70"
          : "text-slate-700 hover:bg-white/60"
      }`}
    >
      <span className="flex items-center gap-2">
        <HiChat className="h-4 w-4 shrink-0 opacity-60" />
        <span className="truncate">{title}</span>
      </span>
    </button>
  );
}

function ChatBubble({ msg }) {
  const isUser = msg.role === "user";
  const text = msg.content ?? msg.message ?? "";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-[#1d5fa3] text-white rounded-br-sm"
            : "bg-white/90 text-slate-800 rounded-bl-sm ring-1 ring-slate-200/60"
        }`}
      >
        {text}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-white/90 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm ring-1 ring-slate-200/60 flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-slate-400 animate-bounce"
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
    selectConversation,
    startNewConversation,
    send,
  } = useChat();

  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const text = input;
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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-[#e6f7f1] via-[#edfff4] to-[#c7e8d7]">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-white/40 backdrop-blur-sm border-r border-white/60 transition-all duration-300 ${
          sidebarOpen ? "w-64 min-w-[220px]" : "w-0 overflow-hidden"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/60">
          <span className="text-sm font-semibold text-slate-700 truncate">Conversations</span>
          <button
            type="button"
            onClick={startNewConversation}
            title="New conversation"
            className="p-1.5 rounded-lg hover:bg-white/70 text-slate-600 transition"
          >
            <HiPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            <p className="px-4 py-3 text-xs text-slate-500">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="px-4 py-3 text-xs text-slate-500">No conversations yet.</p>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                active={conv.id === activeConversationId}
                onClick={selectConversation}
              />
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-white/60 bg-white/40 backdrop-blur-sm px-4 py-3 shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-white/70 text-slate-600 transition"
            title="Toggle sidebar"
          >
            <HiPencilAlt className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0b2c4a] to-[#1d5fa3] flex items-center justify-center shadow">
              <HiChat className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">AI Assistant</p>
              <p className="text-xs text-slate-500">University Management System</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          {loadingMsgs ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-slate-500 text-sm">Loading messages…</p>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#0b2c4a] to-[#1d5fa3] flex items-center justify-center shadow-lg">
                <HiChat className="h-8 w-8 text-white" />
              </div>
              <div>
                <p className="text-slate-700 font-semibold text-lg">How can I help you today?</p>
                <p className="text-slate-500 text-sm mt-1">
                  Ask me anything about your courses, grades, or university info.
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => <ChatBubble key={msg.id} msg={msg} />)
          )}

          {sending && <TypingDots />}

          {error && (
            <p className="text-center text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-white/60 bg-white/40 backdrop-blur-sm px-4 py-3">
          <div className="flex items-end gap-2 bg-white/80 rounded-2xl ring-1 ring-white/70 shadow-sm px-4 py-2">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              className="flex-1 resize-none bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none max-h-32 overflow-y-auto py-1"
              style={{ lineHeight: "1.5" }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="shrink-0 p-2 rounded-xl bg-gradient-to-br from-[#0b2c4a] to-[#1d5fa3] text-white shadow transition hover:opacity-90 disabled:opacity-40"
            >
              <HiPaperAirplane className="h-4 w-4 rotate-90" />
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-2">
            Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
