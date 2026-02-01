import { useCallback, useMemo, useState } from "react";
import { Button } from "@mui/material";

function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const canSend = useMemo(() => {
    return !disabled && !sending && value.trim().length > 0;
  }, [disabled, sending, value]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmed = value.trim();
      if (!trimmed || !onSend || sending || disabled) return;

      setSending(true);
      try {
        await onSend(trimmed);
        setValue("");
      } finally {
        setSending(false);
      }
    },
    [disabled, onSend, sending, value]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3 sm:flex-row sm:items-end"
    >
      <textarea
        className="min-h-[56px] flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
        placeholder="Ask the course assistant…"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={disabled || sending}
        rows={2}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!canSend}
        className="self-stretch sm:self-auto"
      >
        {sending ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}

export default ChatInput;
