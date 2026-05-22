import React from "react";

function warningStyle(text) {
  if (text.startsWith("☠️"))
    return "bg-purple-100 border border-purple-400 text-purple-900 text-base font-semibold risk-pulse-warning";
  if (text.startsWith("🚫"))
    return "bg-red-100 border border-red-400 text-red-900 font-bold";
  if (text.startsWith("⚠️"))
    return "bg-yellow-50 border border-yellow-300 text-yellow-900";
  return "bg-slate-50 border border-slate-200 text-slate-700";
}

export default function WarningsList({ warnings = [] }) {
  if (!warnings.length) return null;
  return (
    <>
      <style>{`
        @keyframes warnPulse {
          0%,100% { opacity:1; } 50% { opacity:0.7; }
        }
        .risk-pulse-warning { animation: warnPulse 1.6s ease-in-out infinite; }
      `}</style>
      <ul className="space-y-1.5">
        {warnings.map((w, i) => (
          <li key={i} className={`rounded-lg px-3 py-2 text-sm ${warningStyle(w)}`}>
            {w}
          </li>
        ))}
      </ul>
    </>
  );
}
