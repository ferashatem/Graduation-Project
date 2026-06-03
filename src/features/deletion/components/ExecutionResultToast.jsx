import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";

export default function ExecutionResultToast({ result, error, httpStatus, onClose, onViewDetails }) {
  useEffect(() => {
    if (result) {
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [result, onClose]);

  if (result) {
    const verb = result.deleteTypeApplied === "SoftDelete" ? "deactivated" : "deleted";
    const counts = result.affectedCounts
      ? Object.entries(result.affectedCounts)
          .map(([k, v]) => `${v} ${k}`)
          .join(", ")
      : null;

    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-2xl bg-green-600 text-white px-5 py-4 shadow-2xl max-w-sm">
        <CheckCircleIcon className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            ✅ {result.entityName} successfully {verb}
          </p>
          {counts && <p className="text-xs mt-0.5 opacity-80">Affected: {counts}</p>}
        </div>
        <IconButton size="small" onClick={onClose} sx={{ color: "white", p: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    );
  }

  if (httpStatus === 409) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-2xl bg-red-600 text-white px-5 py-4 shadow-2xl max-w-sm">
        <BlockIcon className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">⛔ Delete blocked</p>
          <p className="text-xs mt-0.5 opacity-90">{error}</p>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="mt-2 text-xs underline font-medium hover:opacity-80"
            >
              View Details
            </button>
          )}
        </div>
        <IconButton size="small" onClick={onClose} sx={{ color: "white", p: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-6 right-6 z-[9999] flex items-start gap-3 rounded-2xl bg-orange-500 text-white px-5 py-4 shadow-2xl max-w-sm">
        <WarningAmberIcon className="shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Invalid confirmation — please try again</p>
          {error && <p className="text-xs mt-0.5 opacity-90">{error}</p>}
        </div>
        <IconButton size="small" onClick={onClose} sx={{ color: "white", p: 0 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
    );
  }

  return null;
}
