import React from "react";
import BlockIcon from "@mui/icons-material/Block";

export default function BlockersBanner({ blockers = [] }) {
  if (!blockers.length) return null;
  return (
    <div className="w-full rounded-lg bg-red-600 text-white px-4 py-3 mb-4">
      <div className="flex items-center gap-2 font-bold text-base mb-2">
        <BlockIcon fontSize="small" />
        <span>⛔ Delete is BLOCKED — resolve these issues first:</span>
      </div>
      <ul className="list-disc list-inside space-y-1 text-sm">
        {blockers.map((b, i) => (
          <li key={i}>
            {b.reason}
            {b.count != null && (
              <span className="ml-1 font-semibold">({b.count})</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
