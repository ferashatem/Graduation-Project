function ChatMessage({ role, content, status }) {
  const isProfessor = role === "professor";
  const isProcessing = status === "processing";
  const isError = status === "error";

  if (isProfessor) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-3xl bg-[#f4f4f4] dark:bg-[#323232] text-[#0d0d0d] dark:text-[#ececec] px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] flex items-center justify-center shrink-0 text-white dark:text-[#0d0d0d] text-[11px] font-semibold">
        AI
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        {isProcessing && !content ? (
          <div className="flex items-center gap-1 pt-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-2 w-2 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        ) : (
          <p
            className={`whitespace-pre-wrap text-[15px] leading-relaxed ${
              isError ? "text-rose-600 dark:text-rose-400" : "text-[#0d0d0d] dark:text-[#ececec]"
            }`}
          >
            {content}
          </p>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
