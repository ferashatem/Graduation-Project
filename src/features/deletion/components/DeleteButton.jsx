import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteIcon from "@mui/icons-material/Delete";
import { analyzeDeletion, executeDeletion } from "../api/deletionApi";
import DeleteModal from "./DeleteModal";
import ExecutionResultToast from "./ExecutionResultToast";
import { getErrorMessage } from "../../../utils/errorHelpers";

const RISK_BUTTON_COLOR = {
  Low:          "bg-green-500 hover:bg-green-600",
  Medium:       "bg-amber-500 hover:bg-amber-600",
  High:         "bg-orange-500 hover:bg-orange-600",
  Critical:     "bg-red-600 hover:bg-red-700",
  Catastrophic: "bg-purple-700 hover:bg-purple-800",
};

export default function DeleteButton({ entityName, entityId, displayName, onDeleted, className = "" }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis,  setAnalysis]  = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [toast,     setToast]     = useState(null); // { result?, error?, httpStatus? }

  const handleClick = useCallback(async () => {
    setAnalyzing(true);
    try {
      const data = await analyzeDeletion(entityName, entityId);
      setAnalysis(data);
      setModalOpen(true);
    } catch (err) {
      setToast({ error: getErrorMessage(err), httpStatus: err.response?.status });
    } finally {
      setAnalyzing(false);
    }
  }, [entityName, entityId]);

  const handleConfirm = useCallback(async ({ typedConfirmationPhrase, adminPassword }) => {
    setExecuting(true);
    try {
      const result = await executeDeletion({
        entityName,
        entityId,
        typedConfirmationPhrase,
        adminPassword,
        secondAdminApprovalToken: null,
      });
      setModalOpen(false);
      setAnalysis(null);
      setToast({ result });
      onDeleted?.();
    } catch (err) {
      const status = err.response?.status;
      const message = getErrorMessage(err);
      if (status === 400) {
        setToast({ error: message, httpStatus: 400 });
      } else {
        setToast({ error: message, httpStatus: status });
      }
    } finally {
      setExecuting(false);
    }
  }, [entityName, entityId, onDeleted]);

  const handleCancel = () => {
    if (!executing) {
      setModalOpen(false);
      setAnalysis(null);
    }
  };

  const riskColor = analysis?.riskLevel
    ? RISK_BUTTON_COLOR[analysis.riskLevel] ?? "bg-red-600 hover:bg-red-700"
    : "bg-slate-400 hover:bg-slate-500";

  return (
    <>
      {/* Analyze loading overlay for the whole page area — subtle inline indicator */}
      {analyzing && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9000]">
          <div className="bg-white rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-3">
            <CircularProgress size={22} />
            <span className="text-sm font-medium text-slate-600">🔍 Analyzing impact...</span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={analyzing || executing}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${riskColor} ${className}`}
      >
        {analyzing
          ? <CircularProgress size={14} sx={{ color: "inherit" }} />
          : <DeleteIcon fontSize="small" />
        }
        Delete
      </button>

      {modalOpen && analysis && (
        <DeleteModal
          analysis={analysis}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          executing={executing}
        />
      )}

      {toast && (
        <ExecutionResultToast
          result={toast.result}
          error={toast.error}
          httpStatus={toast.httpStatus}
          onClose={() => setToast(null)}
          onViewDetails={
            toast.httpStatus === 409 && analysis
              ? () => { setToast(null); setModalOpen(true); }
              : undefined
          }
        />
      )}
    </>
  );
}
