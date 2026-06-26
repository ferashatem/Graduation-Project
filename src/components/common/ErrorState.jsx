import { useCallback } from "react";
import { Button } from "@mui/material";

function ErrorState({ message, onRetry }) {
  const handleRetry = useCallback(() => {
    if (onRetry) onRetry();
  }, [onRetry]);

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <span>{message || "Something went wrong."}</span>
        {onRetry ? (
          <Button variant="outlined" color="error" onClick={handleRetry}>
            Retry
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export default ErrorState;
