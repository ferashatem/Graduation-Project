import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const BEHAVIOR_STYLE = {
  Restrict:   "bg-red-100 text-red-700 border border-red-200",
  Cascade:    "bg-orange-100 text-orange-700 border border-orange-200",
  SoftDelete: "bg-blue-100 text-blue-700 border border-blue-200",
};

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = node.children?.length > 0;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-50 cursor-pointer ${depth > 0 ? "ml-" + depth * 4 : ""}`}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={() => hasChildren && setOpen((o) => !o)}
      >
        <span className="text-slate-400 w-4 shrink-0">
          {hasChildren ? (
            open ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />
          ) : (
            <span className="w-4 inline-block" />
          )}
        </span>

        <span className="font-medium text-sm text-slate-800">{node.friendlyName}</span>

        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600 text-xs font-semibold">
          {node.count}
        </span>

        {node.isBlocking && <span title="Blocking">⛔</span>}
        {node.isHistorical && <span title="Historical">📚</span>}

        {node.deleteBehavior && (
          <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${BEHAVIOR_STYLE[node.deleteBehavior] ?? "bg-gray-100 text-gray-600"}`}>
            {node.deleteBehavior}
          </span>
        )}
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DependencyTreeView({ dependencyTree = [] }) {
  if (!dependencyTree.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wide">
        Dependency Tree
      </div>
      <div className="py-1">
        {dependencyTree.map((node, i) => (
          <TreeNode key={i} node={node} depth={0} />
        ))}
      </div>
    </div>
  );
}
