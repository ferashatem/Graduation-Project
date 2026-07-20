import { useState } from "react";
import { Button, Chip } from "@mui/material";

const STATUS_CFG = {
  Pending:     { color: "#F59E0B", bg: "#FEF3C7", label: "🕐 Pending"      },
  UnderReview: { color: "#3B82F6", bg: "#EFF6FF", label: "🔍 Under Review"  },
  Resolved:    { color: "#10B981", bg: "#D1FAE5", label: "✅ Resolved"      },
  Dismissed:   { color: "#6B7280", bg: "#F3F4F6", label: "❌ Dismissed"     },
};

const PRIORITY_CFG = {
  Normal:   { color: "#6B7280", label: "Normal"       },
  High:     { color: "#F97316", label: "⚠ High"       },
  Critical: { color: "#EF4444", label: "🚨 Critical"  },
};

const SEVERITY_CFG = {
  low:      { color: "#10B981" },
  medium:   { color: "#F59E0B" },
  high:     { color: "#F97316" },
  critical: { color: "#EF4444" },
};

function SentimentBar({ score }) {
  if (score == null) return null;
  const pct   = ((score + 1) / 2) * 100;
  const color = score > 0.3 ? "#10B981" : score > -0.3 ? "#F59E0B" : "#EF4444";
  const label = score > 0.3 ? "😊 Positive" : score > -0.3 ? "😐 Neutral" : "😞 Negative";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span>{score.toFixed(2)}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 w-full rounded-full bg-slate-200 overflow-hidden"
      >
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Timeline({ complaint }) {
  const steps = [
    { key: "submitted", label: "Submitted", date: complaint.createdAt, done: true },
    {
      key: "analyzed",
      label: "AI Analyzed",
      date: complaint.analysis ? complaint.createdAt : null,
      done: Boolean(complaint.analysis),
      pending: !complaint.analysis && complaint.status === "Pending",
    },
    { key: "resolved", label: "Resolved", date: complaint.resolvedAt, done: Boolean(complaint.resolvedAt) },
  ];

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center gap-1 flex-1 min-w-0">
          <div className="flex flex-col items-center shrink-0">
            <div className={`h-2.5 w-2.5 rounded-full border-2 ${
              step.done
                ? "bg-emerald-500 border-emerald-500"
                : step.pending
                  ? "bg-amber-400 border-amber-400 animate-pulse"
                  : "bg-slate-200 border-slate-300"
            }`} />
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-px ${step.done ? "bg-emerald-300" : "bg-slate-200"}`} />
          )}
        </div>
      ))}
      <div className="flex justify-between text-[10px] text-slate-400 w-full mt-1 absolute" style={{ display: "none" }} />
    </div>
  );
}

const ANALYSIS_TIMEOUT_MS = 2 * 60 * 1000;

function ComplaintCard({ complaint, showStudent = false, onReply, onRefresh }) {
  const [expanded, setExpanded] = useState(false);

  const statusCfg   = STATUS_CFG[complaint.status]   ?? STATUS_CFG.Pending;
  const priorityCfg = PRIORITY_CFG[complaint.priority] ?? PRIORITY_CFG.Normal;
  const severityCfg = SEVERITY_CFG[complaint.analysis?.severity];

  const analysisTimedOut = !complaint.analysis &&
    complaint.createdAt &&
    (Date.now() - new Date(complaint.createdAt).getTime()) > ANALYSIS_TIMEOUT_MS;

  const canReply = onReply && complaint.status !== "Resolved" && complaint.status !== "Dismissed";

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 space-y-4 transition hover:ring-slate-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold" style={{ color: priorityCfg.color }}>
              {priorityCfg.label}
            </span>
            {complaint.analysis?.category && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {complaint.analysis.category}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-slate-800 leading-snug">{complaint.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {complaint.targetType}
            {showStudent && complaint.student?.fullName && ` · ${complaint.student.fullName}`}
            {showStudent && !complaint.student && complaint.studentId === "HIDDEN" && " · Anonymous"}
            {" · "}
            {new Date(complaint.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold shrink-0"
          style={{ color: statusCfg.color, background: statusCfg.bg }}
          aria-label={`Status: ${complaint.status}`}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* AI Analysis */}
      {complaint.analysis ? (
        <div className="space-y-2">
          <SentimentBar score={complaint.analysis.sentimentScore} />
          {complaint.analysis.aiSummary && (
            <p className="text-xs text-slate-600 leading-relaxed">{complaint.analysis.aiSummary}</p>
          )}
          {complaint.analysis.suggestedAction && (
            <p className="text-xs text-slate-400 italic">💡 {complaint.analysis.suggestedAction}</p>
          )}
        </div>
      ) : analysisTimedOut ? (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100">
          <p className="text-xs text-amber-700">
            Analysis is taking longer than usual — we'll keep retrying automatically.
          </p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="shrink-0 text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition"
            >
              Refresh
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
          AI is analyzing this complaint…
        </div>
      )}

      {/* Timeline */}
      <div className="py-1">
        <div className="flex items-center gap-0">
          {[
            { label: "Submitted", done: true },
            { label: complaint.analysis ? "Analyzed" : "Analyzing…", done: Boolean(complaint.analysis), pending: !complaint.analysis },
            { label: complaint.resolvedAt ? "Resolved" : "Pending", done: Boolean(complaint.resolvedAt) },
          ].map((step, i, arr) => (
            <div key={i} className="flex items-center" style={{ flex: i < arr.length - 1 ? "1" : "0" }}>
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <div className={`h-2 w-2 rounded-full ${
                  step.done ? "bg-emerald-500" : step.pending ? "bg-amber-400 animate-pulse" : "bg-slate-200"
                }`} />
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`flex-1 h-px mx-1 ${step.done ? "bg-emerald-300" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Expanded: message + resolution */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1">Your Message</p>
            <p className="text-sm text-slate-700 whitespace-pre-line">{complaint.message}</p>
          </div>
          {complaint.status === "Resolved" && complaint.resolutionNote && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-1">
              <p className="text-xs font-bold text-emerald-700">Reply</p>
              <p className="text-sm text-emerald-800">{complaint.resolutionNote}</p>
              {complaint.resolvedAt && (
                <p className="text-[10px] text-emerald-500">
                  {new Date(complaint.resolvedAt).toLocaleString("en-US")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setExpanded((p) => !p)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition"
          aria-expanded={expanded}
        >
          {expanded ? "Hide Details ▲" : "View Details ▼"}
        </button>
        {canReply && (
          <Button size="small" variant="outlined" onClick={() => onReply(complaint)}>
            Reply
          </Button>
        )}
      </div>
    </div>
  );
}

export function ComplaintCardList({ complaints = [], loading, showStudent = false, onReply, onRefresh, emptyText }) {
  if (loading && complaints.length === 0) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 animate-pulse space-y-3">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/4 rounded bg-slate-100" />
            <div className="h-2 w-full rounded-full bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && complaints.length === 0) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm">{emptyText ?? "No complaints found."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {complaints.map((c) => (
        <ComplaintCard
          key={c.id}
          complaint={c}
          showStudent={showStudent}
          onReply={onReply}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

export default ComplaintCard;
