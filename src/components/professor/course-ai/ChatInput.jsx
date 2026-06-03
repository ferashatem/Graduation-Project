import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowUp } from "react-icons/fi";

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);

  const canSend = useMemo(
    () => !disabled && !sending && value.trim().length > 0,
    [disabled, sending, value]
  );

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || !onSend || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
    } finally {
      setSending(false);
    }
  }, [disabled, onSend, sending, value]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-[#ececec] dark:border-[#2f2f2f] bg-white dark:bg-[#212121] px-3 py-3">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 bg-[#f4f4f4] dark:bg-[#2f2f2f] rounded-3xl px-4 py-3">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this lecture"
            disabled={disabled || sending}
            className="flex-1 resize-none bg-transparent text-[15px] text-[#0d0d0d] dark:text-[#ececec] placeholder-[#8e8e8e] dark:placeholder-[#9b9b9b] outline-none max-h-[200px] overflow-y-auto py-1 disabled:opacity-60"
            style={{ lineHeight: "1.5" }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            className="shrink-0 h-9 w-9 rounded-full bg-[#0d0d0d] dark:bg-[#ececec] text-white dark:text-[#0d0d0d] flex items-center justify-center transition hover:bg-[#2d2d2d] dark:hover:bg-white disabled:bg-[#d7d7d7] dark:disabled:bg-[#4a4a4a] dark:disabled:text-[#7a7a7a] disabled:cursor-not-allowed"
          >
            <FiArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;
