import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function ConfirmationStep({ requiredPhrase, value, onChange }) {
  const matches = value.trim().toUpperCase() === requiredPhrase.trim().toUpperCase();

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        Type exactly to confirm:
      </p>
      <code className="block w-full rounded-lg bg-slate-900 text-green-400 font-mono text-sm px-4 py-3 break-all select-all">
        {requiredPhrase}
      </code>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type the phrase above..."
        className={`w-full rounded-xl border px-3 py-2.5 text-sm font-mono outline-none transition-all ${
          value.length === 0
            ? "border-slate-200 bg-white text-slate-800"
            : matches
            ? "border-green-400 bg-green-50 text-green-800 shadow-[0_0_0_3px_rgba(74,222,128,0.3)]"
            : "border-red-300 bg-red-50 text-red-800"
        }`}
        autoComplete="off"
        spellCheck={false}
      />
      {value.length > 0 && !matches && (
        <p className="text-xs text-red-500">Phrase does not match — check capitalization and spacing.</p>
      )}
      {matches && (
        <p className="text-xs text-green-600 font-medium">✓ Phrase matches</p>
      )}
    </div>
  );
}
