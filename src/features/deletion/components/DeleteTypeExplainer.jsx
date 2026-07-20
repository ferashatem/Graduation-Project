import React from "react";
import { useTranslation } from "react-i18next";

const EXPLAINERS = {
  "Soft Delete":  { icon: "🔅", text: "This record will be deactivated. Data is preserved but hidden.", color: "bg-blue-50 border-blue-200 text-blue-800" },
  "Hard Delete":  { icon: "⚠️", text: "This record will be PERMANENTLY deleted and cannot be recovered.", color: "bg-red-50 border-red-300 text-red-800" },
  "Restricted":   { icon: "🔒", text: "This record cannot be deleted while it has dependent data.", color: "bg-orange-50 border-orange-200 text-orange-800" },
  "Archive Only": { icon: "📦", text: "This record can only be archived.", color: "bg-slate-50 border-slate-200 text-slate-700" },
  "Immutable":    { icon: "🔐", text: "This record is permanent and can never be deleted.", color: "bg-gray-100 border-gray-300 text-gray-700" },
};

export default function DeleteTypeExplainer({ deleteTypeLabel }) {
  const entry = EXPLAINERS[deleteTypeLabel];
  if (!entry) return null;
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${entry.color}`}>
      <span className="text-base">{entry.icon}</span>
      <span>{entry.text}</span>
    </div>
  );
}
