import { useState } from "react";
import { Box, Chip, Typography } from "@mui/material";
import ClusterDetailModal from "./ClusterDetailModal";

const STATUS_CFG = {
  Open:          { color: "#F59E0B", bg: "#FEF3C7", label: "Open" },
  Investigating: { color: "#3B82F6", bg: "#EFF6FF", label: "🔍 Investigating" },
  Resolved:      { color: "#10B981", bg: "#D1FAE5", label: "✅ Resolved" },
  Archived:      { color: "#6B7280", bg: "#F3F4F6", label: "📦 Archived" },
};

const TREND_CFG = {
  Increasing: { color: "#EF4444", label: "📈 Increasing" },
  Stable:     { color: "#3B82F6", label: "➡ Stable" },
  Decreasing: { color: "#10B981", label: "📉 Decreasing" },
};

function ClusterCard({ cluster, isAdmin, onClick }) {
  const statusCfg = STATUS_CFG[cluster.status] ?? STATUS_CFG.Open;
  const trendCfg  = TREND_CFG[cluster.trendDirection];
  const isCritical = (cluster.criticalCount ?? 0) > 0;

  return (
    <div
      className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 hover:ring-blue-200 transition cursor-pointer space-y-3"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate">{cluster.topic}</p>
          {cluster.targetType && (
            <p className="text-xs text-slate-400 mt-0.5">{cluster.targetType}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ color: statusCfg.color, background: statusCfg.bg }}
          >
            {statusCfg.label}
          </span>
          {trendCfg && (
            <span className="text-xs font-semibold" style={{ color: trendCfg.color }}>
              {trendCfg.label}
            </span>
          )}
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3">
        <Chip
          label={`${cluster.complaintCount} complaints`}
          color={cluster.complaintCount >= 10 ? "error" : cluster.complaintCount >= 5 ? "warning" : "default"}
          size="small"
        />
        {isCritical && (
          <Chip label={`${cluster.criticalCount} critical`} color="error" size="small" variant="outlined" />
        )}
      </div>

      {/* AI Summary */}
      {cluster.aiSummary && (
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
          {cluster.aiSummary.length > 140 ? cluster.aiSummary.slice(0, 140) + "…" : cluster.aiSummary}
        </Typography>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-slate-400">
          Updated {new Date(cluster.lastUpdated).toLocaleDateString("en-US")}
        </span>
        <span className="text-xs font-semibold text-blue-600">View Details →</span>
      </div>
    </div>
  );
}

function ClustersPanel({ clusters = [], isAdmin = false }) {
  const [selectedId, setSelectedId] = useState(null);

  if (clusters.length === 0) {
    return (
      <Box className="py-12 text-center text-slate-500">
        No complaint patterns detected.
      </Box>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clusters.map((c) => (
          <ClusterCard
            key={c.id}
            cluster={c}
            isAdmin={isAdmin}
            onClick={() => setSelectedId(c.id)}
          />
        ))}
      </div>

      {selectedId && (
        <ClusterDetailModal
          clusterId={selectedId}
          open={Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
          isAdmin={isAdmin}
        />
      )}
    </>
  );
}

export default ClustersPanel;
