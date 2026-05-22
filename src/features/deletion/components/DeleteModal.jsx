import React, { useState, useCallback } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import RiskBadge from "./RiskBadge";
import WarningsList from "./WarningsList";
import BlockersBanner from "./BlockersBanner";
import DeleteTypeExplainer from "./DeleteTypeExplainer";
import ImpactSummaryCard from "./ImpactSummaryCard";
import DependencyTreeView from "./DependencyTreeView";
import ConfirmationStep from "./ConfirmationStep";

// ── helpers ────────────────────────────────────────────────────────────────

const RISK_HEADER_COLOR = {
  Low:          "text-green-600",
  Medium:       "text-amber-500",
  High:         "text-orange-500",
  Critical:     "text-red-600",
  Catastrophic: "text-purple-700",
};

const RISK_HEADER_ICON = {
  Low:          "🗑️",
  Medium:       "⚠️",
  High:         "🔴",
  Critical:     "🔴",
  Catastrophic: "☠️",
};

function deleteButtonLabel(deleteTypeLabel) {
  if (deleteTypeLabel === "Soft Delete")  return "Deactivate";
  if (deleteTypeLabel === "Hard Delete")  return "Permanently Delete";
  if (deleteTypeLabel === "Archive Only") return "Archive";
  return "Delete";
}

function ExecutionPlan({ deletionOrder = [] }) {
  const [open, setOpen] = useState(false);
  if (!deletionOrder.length) return null;
  return (
    <div className="mt-3 rounded-xl border border-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wide hover:bg-slate-100 transition-colors"
      >
        <span>Execution Plan</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ol className="list-decimal list-inside px-3 py-2 text-sm text-slate-600 space-y-0.5">
          {deletionOrder.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      )}
    </div>
  );
}

// ── slide animation wrapper ────────────────────────────────────────────────

function SlideStep({ children }) {
  return (
    <div
      className="animate-[slideInRight_200ms_ease-out]"
      style={{ animation: "slideIn 200ms ease-out" }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity:0; transform:translateX(30px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
      {children}
    </div>
  );
}

// ── step screen components ─────────────────────────────────────────────────

function ScreenWarnings({ analysis }) {
  return (
    <SlideStep>
      <div className="space-y-4">
        <DeleteTypeExplainer deleteTypeLabel={analysis.deleteTypeLabel} />
        <ImpactSummaryCard counts={analysis.summary?.counts} />
        <WarningsList warnings={analysis.warnings} />
        <ExecutionPlan deletionOrder={analysis.deletionOrder} />
      </div>
    </SlideStep>
  );
}

function ScreenDependencies({ analysis }) {
  return (
    <SlideStep>
      <div className="space-y-4">
        <WarningsList warnings={analysis.warnings} />
        <DependencyTreeView dependencyTree={analysis.dependencyTree} />
        <ExecutionPlan deletionOrder={analysis.deletionOrder} />
      </div>
    </SlideStep>
  );
}

function ScreenTypedPhrase({ phrase, value, onChange }) {
  return (
    <SlideStep>
      <ConfirmationStep requiredPhrase={phrase} value={value} onChange={onChange} />
    </SlideStep>
  );
}

function ScreenPassword({ value, onChange }) {
  return (
    <SlideStep>
      <div className="space-y-3">
        <p className="font-semibold text-slate-700">🔐 Confirm your password</p>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Admin password..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 transition-all"
          autoComplete="current-password"
        />
      </div>
    </SlideStep>
  );
}

function ScreenFinalWarning({ analysis, password, onPasswordChange, acknowledged, onAcknowledgeChange }) {
  const counts = analysis.summary?.counts ?? {};
  const notable = Object.entries(counts).filter(([, v]) => v > 0);

  return (
    <SlideStep>
      <div className="space-y-4">
        <div className="rounded-xl border-2 border-purple-400 bg-purple-50 px-4 py-3 text-purple-900 space-y-2">
          <p className="text-lg font-bold">☠️ FINAL WARNING</p>
          <p className="text-sm font-medium">This action CANNOT be undone. You are about to destroy:</p>
          <ul className="list-disc list-inside text-sm space-y-0.5">
            {notable.map(([k, v]) => (
              <li key={k}>
                {v} {k}
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Admin Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="Enter your password..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-400 transition-all"
            autoComplete="current-password"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAcknowledgeChange(e.target.checked)}
            className="w-4 h-4 accent-purple-600"
          />
          <span className="text-sm text-slate-700 font-medium">
            I understand this is permanent and irreversible
          </span>
        </label>
      </div>
    </SlideStep>
  );
}

// ── main modal ─────────────────────────────────────────────────────────────

export default function DeleteModal({ analysis, onConfirm, onCancel, executing }) {
  const [step, setStep] = useState(0);
  const [typedPhrase, setTypedPhrase] = useState("");
  const [password, setPassword] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const riskLevel   = analysis.riskLevel;
  const steps       = analysis.confirmation?.confirmationSteps ?? 1;
  const isBlocked   = analysis.isBlocked;
  const phrase      = analysis.confirmation?.typedConfirmationPhrase ?? "";

  const phraseMatches = typedPhrase.trim().toUpperCase() === phrase.trim().toUpperCase();

  // Build ordered screens based on confirmationSteps
  // steps=1 → just submit (screen0 = simple confirm inline)
  // steps=2 → screen0: warnings
  // steps=3 → screen0: warnings, screen1: typed phrase
  // steps=4 → screen0: warnings, screen1: typed phrase, screen2: password
  // steps=5 → screen0: warnings, screen1: deps, screen2: typed phrase, screen3: final warning+password

  const screens = buildScreens(steps);
  const totalScreens = screens.length;
  const isLastScreen = step === totalScreens - 1;

  function buildScreens(n) {
    if (n <= 1) return ["simple"];
    if (n === 2) return ["warnings"];
    if (n === 3) return ["warnings", "phrase"];
    if (n === 4) return ["warnings", "phrase", "password"];
    return ["warnings", "deps", "phrase", "final"];
  }

  const canProceed = useCallback(() => {
    const current = screens[step];
    if (current === "phrase") return phraseMatches;
    if (current === "password") return password.length > 0;
    if (current === "final") return password.length > 0 && acknowledged;
    return true;
  }, [screens, step, phraseMatches, password, acknowledged]);

  const handleNext = () => {
    if (isLastScreen) {
      onConfirm({
        typedConfirmationPhrase: phrase,
        adminPassword: password || null,
      });
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => setStep((s) => s - 1);

  const currentScreen = screens[step];
  const headerIcon  = RISK_HEADER_ICON[riskLevel]  ?? "🗑️";
  const headerColor = RISK_HEADER_COLOR[riskLevel] ?? "text-slate-700";
  const btnLabel    = isLastScreen ? deleteButtonLabel(analysis.deleteTypeLabel) : "Continue →";

  const isCatastrophic = riskLevel === "Catastrophic";
  const finalBtnStyle  = isLastScreen
    ? isCatastrophic
      ? "bg-purple-700 hover:bg-purple-800 text-white shadow-[0_0_12px_rgba(124,58,237,0.5)] animate-pulse"
      : "bg-red-600 hover:bg-red-700 text-white"
    : "bg-slate-800 hover:bg-slate-900 text-white";

  // prevent backdrop close for High+
  const preventClose = ["High", "Critical", "Catastrophic"].includes(riskLevel);

  return (
    <Dialog
      open
      onClose={preventClose ? undefined : onCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "1rem",
          m: { xs: 0, sm: 2 },
          width: { xs: "100%", sm: undefined },
          maxHeight: { xs: "100vh", sm: "90vh" },
          borderTop: isCatastrophic ? "4px solid #7c3aed" : undefined,
          boxShadow: isCatastrophic ? "0 0 30px rgba(124,58,237,0.3)" : undefined,
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ pb: 1 }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl">{headerIcon}</span>
            <span className={`font-bold text-base truncate ${headerColor}`}>
              Delete {analysis.displayName}
            </span>
            <RiskBadge riskLevel={riskLevel} />
          </div>
          <IconButton size="small" onClick={onCancel} disabled={executing}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {/* Progress dots for multi-screen */}
        {totalScreens > 1 && (
          <div className="flex gap-1.5 mt-2">
            {screens.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-slate-700" : i < step ? "w-3 bg-slate-400" : "w-3 bg-slate-200"
                }`}
              />
            ))}
          </div>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ overflowY: "auto" }}>
        {/* Blockers always shown first */}
        <BlockersBanner blockers={analysis.blockers ?? []} />

        {!isBlocked && (
          <>
            {currentScreen === "simple" && (
              <SlideStep>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete <strong>{analysis.displayName}</strong>?
                </p>
                <DeleteTypeExplainer deleteTypeLabel={analysis.deleteTypeLabel} />
              </SlideStep>
            )}
            {currentScreen === "warnings"    && <ScreenWarnings analysis={analysis} />}
            {currentScreen === "deps"        && <ScreenDependencies analysis={analysis} />}
            {currentScreen === "phrase"      && (
              <ScreenTypedPhrase phrase={phrase} value={typedPhrase} onChange={setTypedPhrase} />
            )}
            {currentScreen === "password"    && (
              <ScreenPassword value={password} onChange={setPassword} />
            )}
            {currentScreen === "final"       && (
              <ScreenFinalWarning
                analysis={analysis}
                password={password}
                onPasswordChange={setPassword}
                acknowledged={acknowledged}
                onAcknowledgeChange={setAcknowledged}
              />
            )}
          </>
        )}
      </DialogContent>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100">
        <button
          type="button"
          onClick={step > 0 ? handleBack : onCancel}
          disabled={executing}
          className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
        >
          {step > 0 ? "← Back" : "Cancel"}
        </button>

        {!isBlocked && (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canProceed() || executing}
            className={`px-5 py-2 rounded-xl text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 ${finalBtnStyle}`}
          >
            {executing && <CircularProgress size={14} sx={{ color: "inherit" }} />}
            {isLastScreen && isCatastrophic ? `☠️ ${btnLabel}` : btnLabel}
          </button>
        )}
      </div>

      {/* Overlays */}
      {executing && (
        <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-3 rounded-2xl z-50">
          <CircularProgress size={36} />
          <p className="text-sm font-medium text-slate-600">⚙️ Executing deletion...</p>
        </div>
      )}
    </Dialog>
  );
}
