import { useMemo } from "react";

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return "";
};

function ChatMessage({ role, content, status, createdAt }) {
  const isProfessor = role === "professor";
  const isProcessing = status === "processing";
  const isError = status === "error";

  const timestampLabel = useMemo(() => formatDate(createdAt), [createdAt]);

  const bubbleClasses = useMemo(() => {
    if (isProfessor) {
      return "bg-slate-900 text-white";
    }
    if (isError) {
      return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
    }
    return "bg-white text-slate-700 ring-1 ring-slate-200";
  }, [isError, isProfessor]);

  return (
    <div className={`flex ${isProfessor ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%] space-y-1">
        <div className={`rounded-2xl px-4 py-3 text-sm ${bubbleClasses}`}>
          {isProcessing && !content ? (
            <span className="italic text-slate-400">AI is thinking…</span>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
        {timestampLabel ? (
          <p
            className={`text-[11px] ${
              isProfessor ? "text-right text-slate-400" : "text-slate-400"
            }`}
          >
            {timestampLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default ChatMessage;
