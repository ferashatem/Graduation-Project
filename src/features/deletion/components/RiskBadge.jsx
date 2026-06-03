import React from "react";
import { useTranslation } from "react-i18next";

const RISK_CONFIG = {
  Low:          { bg: "#22c55e", pulse: false },
  Medium:       { bg: "#f59e0b", pulse: false },
  High:         { bg: "#f97316", pulse: false },
  Critical:     { bg: "#ef4444", pulse: false },
  Catastrophic: { bg: "#7c3aed", pulse: true  },
};

export default function RiskBadge({ riskLevel, className = "" }) {
  const config = RISK_CONFIG[riskLevel] ?? { bg: "#6b7280", pulse: false };

  return (
    <>
      {config.pulse && (
        <style>{`
          @keyframes riskPulse {
            0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.6); }
            50%       { box-shadow: 0 0 0 6px rgba(124,58,237,0); }
          }
          .risk-pulse { animation: riskPulse 1.4s ease-in-out infinite; }
        `}</style>
      )}
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold text-white tracking-wide ${config.pulse ? "risk-pulse" : ""} ${className}`}
        style={{ backgroundColor: config.bg }}
      >
        {riskLevel?.toUpperCase()}
      </span>
    </>
  );
}
