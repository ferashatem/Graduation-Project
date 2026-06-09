import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiArrowUp } from "react-icons/fi";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import i18n from "../../../i18n/config";

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
    </svg>
  );
}

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const baseTextRef = useRef("");

  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();

  const speechLang = "ar-EG";

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

  useEffect(() => {
    setValue(baseTextRef.current + transcript);
  }, [transcript]);

  const toggleMic = useCallback(() => {
    if (listening) {
      SpeechRecognition.stopListening();
    } else {
      baseTextRef.current = value;
      resetTranscript();
      SpeechRecognition.startListening({ continuous: true, language: speechLang });
    }
  }, [listening, value, resetTranscript, speechLang]);

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || !onSend || sending || disabled) return;
    if (listening) SpeechRecognition.stopListening();
    setSending(true);
    try {
      await onSend(trimmed);
      setValue("");
    } finally {
      setSending(false);
    }
  }, [disabled, listening, onSend, sending, value]);

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
          {browserSupportsSpeechRecognition && (
            <button
              type="button"
              onClick={toggleMic}
              title={listening ? "Stop listening" : "Voice input"}
              className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center transition ${
                listening
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-[#ececec]"
              }`}
            >
              {listening ? (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
                </span>
              ) : (
                <MicIcon />
              )}
            </button>
          )}
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
