import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as signalR from "@microsoft/signalr";
import ReactApexChart from "react-apexcharts";
import {
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  HiChevronDown,
  HiChevronRight,
  HiRefresh,
  HiX,
  HiDownload,
  HiFilter,
  HiLightningBolt,
  HiChartBar,
  HiTable,
} from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import { getErrorMessage } from "../../utils/errorHelpers";
import { getStoredAccessToken } from "../../auth/session";
import {
  fetchAuditLogs,
  fetchAuditDashboard,
  fetchAuditTimeline,
  fetchAuditTopUsers,
  fetchAuditTopModules,
  fetchAuditHeatmap,
  fetchAuditInsights,
  exportAuditLogs,
} from "../../api/auditApi";

// ── Constants ────────────────────────────────────────────────────────────────

const AUDIT_HUB_URL =
  "https://universitymanagementsystem-production-e58e.up.railway.app/hubs/audit";

const ACTION_OPTIONS = [
  "Login","Logout","FailedLogin","ChangePassword",
  "ImportGrades","UpdateGrade","FinalizeGrades","ExportGrades",
  "CreateStudent","UpdateStudent","DeleteStudent",
  "GenerateExam","PublishExam","DeleteExam",
  "EnrollStudent","DropEnrollment",
  "CreateNotification","SendNotification","DeleteNotification",
  "UnauthorizedAccess","ForbiddenAction","SuspiciousActivity",
  "Create","Update","Delete","SoftDelete","Restore",
];

const SEVERITY_OPTIONS = ["Info","Warning","Error","Critical","Security"];
const STATUS_OPTIONS   = ["Success","Failed","Alert"];
const ROLE_OPTIONS     = ["Student","Doctor","Admin","SuperAdmin"];

const SEVERITY_STYLES = {
  Info:     { bg: "#28a74520", text: "#1a7a3c", badge: "#28a745", textOnBadge: "#fff" },
  Warning:  { bg: "#ffc10720", text: "#856404", badge: "#ffc107", textOnBadge: "#333" },
  Error:    { bg: "#dc354520", text: "#9a1f2e", badge: "#dc3545", textOnBadge: "#fff" },
  Critical: { bg: "#7b000020", text: "#7b0000", badge: "#7b0000", textOnBadge: "#fff" },
  Security: { bg: "#6f42c120", text: "#4a1a9e", badge: "#6f42c1", textOnBadge: "#fff" },
};

const STATUS_STYLES = {
  Success: { badge: "#10b981", text: "#fff" },
  Failed:  { badge: "#ef4444", text: "#fff" },
  Alert:   { badge: "#f59e0b", text: "#333" },
};

const ACTION_COLOR = {
  Login:"#2563eb",Logout:"#64748b",FailedLogin:"#ef4444",ChangePassword:"#f59e0b",
  ImportGrades:"#8b5cf6",UpdateGrade:"#8b5cf6",FinalizeGrades:"#8b5cf6",ExportGrades:"#8b5cf6",
  CreateStudent:"#10b981",UpdateStudent:"#f59e0b",DeleteStudent:"#ef4444",
  GenerateExam:"#06b6d4",PublishExam:"#06b6d4",DeleteExam:"#ef4444",
  EnrollStudent:"#10b981",DropEnrollment:"#f59e0b",
  CreateNotification:"#06b6d4",SendNotification:"#06b6d4",DeleteNotification:"#ef4444",
  UnauthorizedAccess:"#dc2626",ForbiddenAction:"#dc2626",SuspiciousActivity:"#9333ea",
  Create:"#10b981",Update:"#f59e0b",Delete:"#ef4444",SoftDelete:"#ef4444",Restore:"#2563eb",
};

const CHART_COLORS = [
  "#2d5be3","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899","#84cc16","#14b8a6",
];

const DAY_ABBR = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ── Utilities ────────────────────────────────────────────────────────────────

const fmtDate = (s) => {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-GB", {
      day:"2-digit", month:"2-digit", year:"numeric",
      hour:"2-digit", minute:"2-digit", second:"2-digit",
    }).replace(",", "");
  } catch { return s; }
};

const fmtHour = (s) => {
  if (!s) return "";
  try { return new Date(s).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }); }
  catch { return s; }
};

const fmtTime = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" }); }
  catch { return s; }
};

const truncate = (str, len = 14) =>
  str ? (str.length > len ? str.slice(0, len) + "…" : str) : "—";

const parseJson = (v) => {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return { raw: v }; }
};

// ── Small components ─────────────────────────────────────────────────────────

function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLES[severity];
  if (!s) return <span className="text-xs text-slate-400">{severity ?? "—"}</span>;
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold leading-5"
      style={{ background: s.badge, color: s.textOnBadge }}
    >
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status];
  if (!s) return <span className="text-xs text-slate-400">{status ?? "—"}</span>;
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-bold leading-5"
      style={{ background: s.badge, color: s.text }}
    >
      {status}
    </span>
  );
}

function ActionBadge({ action }) {
  const color = ACTION_COLOR[action] ?? "#64748b";
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5"
      style={{ background: `${color}22`, color }}
    >
      {action ?? "—"}
    </span>
  );
}

// ── Before/After diff table ───────────────────────────────────────────────────

function ChangeDiffTable({ oldValues, newValues }) {
  const oldObj = parseJson(oldValues) ?? {};
  const newObj = parseJson(newValues) ?? {};
  const allKeys = [...new Set([...Object.keys(oldObj), ...Object.keys(newObj)])];
  if (allKeys.length === 0) return null;
  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="bg-slate-50">
          <th className="text-left py-1.5 px-3 text-slate-500 font-semibold border-b border-slate-200">Field</th>
          <th className="text-left py-1.5 px-3 text-red-500 font-semibold border-b border-slate-200">Before</th>
          <th className="text-left py-1.5 px-3 text-emerald-500 font-semibold border-b border-slate-200">After</th>
        </tr>
      </thead>
      <tbody>
        {allKeys.map((key) => {
          const oldVal = oldObj[key];
          const newVal = newObj[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);
          return (
            <tr key={key} className={`border-b border-slate-100 ${changed ? "bg-amber-50/40" : ""}`}>
              <td className="py-1.5 px-3 font-mono text-slate-700">{key}</td>
              <td className="py-1.5 px-3 font-mono text-red-600">
                {oldVal != null ? String(oldVal) : <span className="text-slate-300">—</span>}
              </td>
              <td className="py-1.5 px-3 font-mono text-emerald-600">
                {newVal != null ? String(newVal) : <span className="text-slate-300">—</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// ── Detail dialog ─────────────────────────────────────────────────────────────

function DetailDialog({ log, onClose }) {
  if (!log) return null;
  return (
    <Dialog open={!!log} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display:"flex", justifyContent:"space-between", alignItems:"center", pb:1 }}>
        <span className="flex items-center gap-2 font-bold text-slate-800">
          Log Details
          {log.severity && <SeverityBadge severity={log.severity} />}
          {log.status && <StatusBadge status={log.status} />}
        </span>
        <IconButton onClick={onClose} size="small"><HiX /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 text-sm">
          {[
            ["Timestamp", fmtDate(log.timestamp ?? log.performedAt)],
            ["Action", null, <ActionBadge key="a" action={log.action ?? log.actionType} />],
            ["Entity", log.entity ?? log.entityName],
            ["Entity ID", log.entityId],
            ["User", log.userName ?? "—"],
            ["Role", log.role ?? "—"],
            ["Email", log.email ?? "—"],
            ["IP Address", log.ipAddress ?? "—"],
            ["Browser", log.browser ?? "—"],
            ["Device", log.device ?? "—"],
            ["Duration", log.durationMs != null ? `${log.durationMs}ms` : "—"],
            ["Correlation ID", log.correlationId ?? "—"],
          ].map(([label, value, node]) => (
            <div key={label}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
              {node ?? <p className="font-medium text-slate-800 font-mono text-xs">{value || "—"}</p>}
            </div>
          ))}
        </div>

        {log.description && (
          <div className="mb-4 rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Description</p>
            <p className="text-sm text-slate-700">{log.description}</p>
          </div>
        )}

        {(log.oldValues || log.newValues) && (
          <div className="rounded-xl overflow-hidden ring-1 ring-slate-200">
            <ChangeDiffTable oldValues={log.oldValues} newValues={log.newValues} />
          </div>
        )}

        {log.metadata && (
          <div className="mt-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Metadata</p>
            <pre className="text-xs font-mono bg-slate-50 rounded-xl p-3 ring-1 ring-slate-200 whitespace-pre-wrap break-all max-h-40 overflow-auto">
              {typeof log.metadata === "string"
                ? log.metadata
                : JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Skeleton rows ─────────────────────────────────────────────────────────────

function SkeletonRows({ count = 8 }) {
  return Array.from({ length: count }).map((_, i) => (
    <TableRow key={i}>
      {Array.from({ length: 8 }).map((__, j) => (
        <TableCell key={j}>
          <div className="h-4 rounded bg-slate-100 animate-pulse" style={{ width: `${50 + Math.random() * 40}%` }} />
        </TableCell>
      ))}
    </TableRow>
  ));
}

// ── Table row ─────────────────────────────────────────────────────────────────

function AuditTableRow({ log, onSelect, isNew }) {
  const [expanded, setExpanded] = useState(false);
  const hasChanges = !!(log.oldValues || log.newValues);
  const sevStyle = SEVERITY_STYLES[log.severity];

  return (
    <>
      <TableRow
        hover
        sx={{
          cursor: "pointer",
          borderLeft: isNew ? "3px solid #2d5be3" : "3px solid transparent",
          bgcolor: isNew ? "#2d5be308" : undefined,
          "& td": { borderBottom: expanded ? 0 : undefined },
        }}
        onClick={() => onSelect(log)}
      >
        <TableCell sx={{ width: 32, pr: 0 }}>
          {hasChanges && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
            >
              {expanded ? <HiChevronDown size={13} /> : <HiChevronRight size={13} />}
            </IconButton>
          )}
        </TableCell>

        <TableCell>
          <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
            {fmtDate(log.timestamp ?? log.performedAt)}
          </Typography>
        </TableCell>

        <TableCell>
          <p className="text-xs font-semibold text-slate-800 leading-tight">{log.userName ?? "—"}</p>
          {log.role && <p className="text-[10px] text-slate-400">{log.role}</p>}
        </TableCell>

        <TableCell><ActionBadge action={log.action ?? log.actionType} /></TableCell>

        <TableCell>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {log.entity ?? log.entityName ?? "—"}
          </Typography>
        </TableCell>

        <TableCell><SeverityBadge severity={log.severity} /></TableCell>
        <TableCell><StatusBadge status={log.status} /></TableCell>

        <TableCell>
          <Typography variant="caption" sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}>
            {log.ipAddress ?? "—"}
          </Typography>
        </TableCell>

        <TableCell>
          <Typography variant="caption" color="text.secondary">
            {[log.browser, log.device].filter(Boolean).join(" / ") || "—"}
          </Typography>
        </TableCell>
      </TableRow>

      {hasChanges && (
        <TableRow>
          <TableCell colSpan={9} sx={{ py: 0, px: 2 }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <div className="py-3 rounded-xl overflow-hidden ring-1 ring-slate-200 my-2">
                <ChangeDiffTable oldValues={log.oldValues} newValues={log.newValues} />
              </div>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ── Dashboard Cards ───────────────────────────────────────────────────────────

function DashboardCards({ data, loading }) {
  const cards = [
    { key: "totalLogs",      label: "Total Logs",       value: data?.totalLogs,      icon: "📋", color: "#2d5be3" },
    { key: "todayLogs",      label: "Today",            value: data?.todayLogs,      icon: "📅", color: "#0891b2" },
    { key: "criticalEvents", label: "Critical Events",  value: data?.criticalEvents, icon: "⚠️", color: "#dc2626" },
    { key: "failedActions",  label: "Failed Actions",   value: data?.failedActions,  icon: "❌", color: "#ea580c" },
    { key: "activeUsers",    label: "Active Users",     value: data?.activeUsers,    icon: "👥", color: "#16a34a" },
    { key: "securityAlerts", label: "Security Alerts",  value: data?.securityAlerts, icon: "🔒", color: "#7c3aed" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ key, label, value, icon, color }) => (
        <div key={key} className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-4 flex flex-col gap-1">
          <span className="text-xl">{icon}</span>
          {loading ? (
            <div className="h-7 w-12 rounded bg-slate-100 animate-pulse" />
          ) : (
            <p className="text-2xl font-bold" style={{ color }}>{value ?? "—"}</p>
          )}
          <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── AI Insights ───────────────────────────────────────────────────────────────

function InsightBanners({ insights, loading }) {
  if (loading) return (
    <div className="space-y-2">
      {[1,2].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)}
    </div>
  );
  if (!insights?.length) return null;

  const colorMap = {
    info:     { bg: "#eff6ff", text: "#1e40af", icon: "💡" },
    warning:  { bg: "#fffbeb", text: "#92400e", icon: "⚠️" },
    critical: { bg: "#fef2f2", text: "#991b1b", icon: "🔴" },
  };

  return (
    <div className="space-y-2">
      {insights.map((ins, i) => {
        const c = colorMap[ins.type?.toLowerCase()] ?? colorMap.info;
        return (
          <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-2.5 text-sm font-medium"
            style={{ background: c.bg, color: c.text }}>
            <span>{c.icon}</span>
            <span>{ins.message}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Timeline Chart ────────────────────────────────────────────────────────────

function TimelineChart({ data, hours, onHoursChange }) {
  const HOUR_OPTIONS = [
    { value: 6,   label: "6h" },
    { value: 24,  label: "24h" },
    { value: 48,  label: "48h" },
    { value: 168, label: "7d" },
  ];

  const series = [
    { name: "Total", data: data.map((d) => d.count ?? 0) },
    { name: "Critical", data: data.map((d) => d.criticalCount ?? 0) },
  ];

  const options = {
    chart: { toolbar: { show: false }, background: "transparent", fontFamily: "inherit" },
    colors: ["#2d5be3", "#ef4444"],
    stroke: { curve: "smooth", width: 2 },
    fill: { type: "gradient", gradient: { opacityFrom: 0.25, opacityTo: 0 } },
    xaxis: {
      categories: data.map((d) => fmtHour(d.hour)),
      labels: { style: { fontSize: "10px" }, rotate: -30 },
      tickAmount: Math.min(data.length, 12),
    },
    yaxis: { min: 0, labels: { style: { fontSize: "11px" } } },
    legend: { position: "top", fontSize: "12px" },
    tooltip: { x: { show: true } },
    grid: { borderColor: "#f1f5f9" },
    dataLabels: { enabled: false },
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-slate-800">Activity Timeline</p>
        <div className="flex rounded-xl overflow-hidden ring-1 ring-slate-200 text-xs">
          {HOUR_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button"
              onClick={() => onHoursChange(value)}
              className={`px-3 py-1.5 font-medium transition ${
                hours === value
                  ? "bg-[#0b2c4a] text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {data.length > 0 ? (
        <ReactApexChart type="area" series={series} options={options} height={220} />
      ) : (
        <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">No data</div>
      )}
    </div>
  );
}

// ── Top Users ─────────────────────────────────────────────────────────────────

function TopUsersPanel({ data, loading }) {
  if (loading) return <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />;
  const max = data[0]?.actionCount ?? 1;
  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
      <p className="font-semibold text-slate-800 mb-3">Top Active Users</p>
      {data.length === 0
        ? <p className="text-sm text-slate-400">No data</p>
        : (
          <div className="space-y-2">
            {data.map((u, i) => (
              <div key={u.userId ?? i} className="flex items-center gap-3">
                <span className="w-5 text-[11px] text-slate-400 shrink-0 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs font-medium text-slate-800 truncate">{u.userName ?? "—"}</span>
                    <span className="text-xs text-slate-500 ml-2 shrink-0">{u.actionCount}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all"
                      style={{ width: `${(u.actionCount / max) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {u.role ?? ""}{u.lastActive ? ` · ${fmtTime(u.lastActive)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ── Top Modules Donut ─────────────────────────────────────────────────────────

function TopModulesChart({ data, loading }) {
  if (loading) return <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />;
  if (!data.length) return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
      <p className="font-semibold text-slate-800 mb-3">Top Modules</p>
      <p className="text-sm text-slate-400">No data</p>
    </div>
  );

  const series = data.map((d) => d.actionCount);
  const options = {
    chart: { toolbar: { show: false }, fontFamily: "inherit" },
    labels: data.map((d) => d.entity ?? "Unknown"),
    colors: CHART_COLORS,
    legend: { position: "bottom", fontSize: "11px" },
    dataLabels: { enabled: false },
    plotOptions: { pie: { donut: { size: "60%" } } },
    tooltip: { y: { formatter: (v) => `${v} actions` } },
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
      <p className="font-semibold text-slate-800 mb-1">Top Modules</p>
      <ReactApexChart type="donut" series={series} options={options} height={250} />
    </div>
  );
}

// ── Activity Heatmap ──────────────────────────────────────────────────────────

function HeatmapGrid({ data, loading }) {
  if (loading) return <div className="h-44 rounded-2xl bg-slate-100 animate-pulse" />;

  // Build 7×24 grid
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  let maxCount = 1;
  data.forEach(({ dayOfWeek, hour, count }) => {
    if (dayOfWeek >= 0 && dayOfWeek < 7 && hour >= 0 && hour < 24) {
      grid[dayOfWeek][hour] = count;
      if (count > maxCount) maxCount = count;
    }
  });

  const cellColor = (count) => {
    if (count === 0) return "#f1f5f9";
    const intensity = count / maxCount;
    if (intensity > 0.75) return "#1d4ed8";
    if (intensity > 0.5)  return "#3b82f6";
    if (intensity > 0.25) return "#93c5fd";
    return "#dbeafe";
  };

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5">
      <p className="font-semibold text-slate-800 mb-3">Activity Heatmap</p>
      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Day labels */}
          <div className="flex flex-col gap-1 pt-5">
            {DAY_ABBR.map((d) => (
              <div key={d} className="h-4 w-7 text-[9px] text-slate-400 flex items-center">{d}</div>
            ))}
          </div>
          {/* Hour columns */}
          <div>
            {/* Hour headers */}
            <div className="flex gap-1 mb-1">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="w-4 text-[8px] text-slate-400 text-center">
                  {h % 3 === 0 ? `${h}` : ""}
                </div>
              ))}
            </div>
            {/* Rows */}
            {grid.map((row, day) => (
              <div key={day} className="flex gap-1 mb-1">
                {row.map((count, hour) => (
                  <Tooltip key={hour} title={`${DAY_ABBR[day]} ${hour}:00 — ${count} events`} placement="top">
                    <div
                      className="w-4 h-4 rounded-sm cursor-default"
                      style={{ background: cellColor(count) }}
                    />
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1 mt-2">
          <span className="text-[10px] text-slate-400">Less</span>
          {["#f1f5f9","#dbeafe","#93c5fd","#3b82f6","#1d4ed8"].map((c) => (
            <div key={c} className="w-3 h-3 rounded-sm" style={{ background: c }} />
          ))}
          <span className="text-[10px] text-slate-400">More</span>
        </div>
      </div>
    </div>
  );
}

// ── Filters Panel ─────────────────────────────────────────────────────────────

function FiltersPanel({ filters, onChange, onReset, modules }) {
  const EMPTY = {
    entity:"", action:"", severity:"", status:"",
    userName:"", email:"", role:"", search:"",
    dateFrom:"", dateTo:"",
    sortBy:"timestamp", sortDesc:true,
  };

  const set = (key, val) => onChange({ ...filters, [key]: val });
  const isDirty = Object.keys(EMPTY).some(
    (k) => k !== "sortBy" && k !== "sortDesc" && filters[k] !== EMPTY[k]
  );

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap gap-2 items-end">

        {/* Entity */}
        <select
          value={filters.entity}
          onChange={(e) => set("entity", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Entities</option>
          {modules.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>

        {/* Action */}
        <select
          value={filters.action}
          onChange={(e) => set("action", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>

        {/* Severity */}
        <select
          value={filters.severity}
          onChange={(e) => set("severity", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Severities</option>
          {SEVERITY_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => set("status", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Role */}
        <select
          value={filters.role}
          onChange={(e) => set("role", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">All Roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {/* Date From */}
        <input
          type="datetime-local"
          value={filters.dateFrom}
          onChange={(e) => set("dateFrom", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        {/* Date To */}
        <input
          type="datetime-local"
          value={filters.dateTo}
          onChange={(e) => set("dateTo", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />

        {/* Search */}
        <input
          type="text"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 min-w-[180px]"
        />

        {isDirty && (
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-500 hover:bg-slate-50"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

// ── Export Buttons ────────────────────────────────────────────────────────────

function ExportButtons({ filters }) {
  const [exporting, setExporting] = useState(null);

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const blob = await exportAuditLogs(type, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit_logs.${type === "pdf" ? "html" : type}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // fallback silent
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
        <HiDownload className="h-3.5 w-3.5" /> Export:
      </span>
      {[
        { type: "csv",   label: "CSV"   },
        { type: "excel", label: "Excel" },
        { type: "pdf",   label: "PDF"   },
      ].map(({ type, label }) => (
        <button
          key={type}
          type="button"
          disabled={!!exporting}
          onClick={() => handleExport(type)}
          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {exporting === type ? "…" : label}
        </button>
      ))}
    </div>
  );
}

// ── Real-time banner ──────────────────────────────────────────────────────────

function RealtimeBanner({ connected }) {
  if (connected) return (
    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      Live
    </span>
  );
  return (
    <div className="rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-2 text-xs text-amber-700 font-medium">
      ⚠ Real-time updates paused. Reconnecting…
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

const EMPTY_FILTERS = {
  entity:"", action:"", severity:"", status:"",
  userName:"", email:"", role:"", search:"",
  dateFrom:"", dateTo:"",
  sortBy:"timestamp", sortDesc:true,
  page: 1, pageSize: 20,
};

function AuditLogsPage() {
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("auditLogs.title") }];

  // ── Tabs
  const [tab, setTab] = useState("feed"); // "feed" | "analytics" | "charts"

  // ── Table state
  const [logs, setLogs]           = useState([]);
  const [newIds, setNewIds]       = useState(new Set());
  const [total, setTotal]         = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [filters, setFilters]     = useState(EMPTY_FILTERS);
  const [selectedLog, setSelectedLog] = useState(null);

  // ── Analytics state
  const [dashboard, setDashboard] = useState(null);
  const [dashLoad, setDashLoad]   = useState(true);
  const [insights, setInsights]   = useState([]);
  const [insLoad, setInsLoad]     = useState(true);
  const [timeline, setTimeline]   = useState([]);
  const [tlHours, setTlHours]     = useState(24);
  const [tlLoad, setTlLoad]       = useState(true);
  const [topUsers, setTopUsers]   = useState([]);
  const [tuLoad, setTuLoad]       = useState(true);
  const [topModules, setTopModules] = useState([]);
  const [tmLoad, setTmLoad]       = useState(true);
  const [heatmap, setHeatmap]     = useState([]);
  const [hmLoad, setHmLoad]       = useState(true);

  // ── SignalR
  const [connected, setConnected] = useState(false);
  const connRef = useRef(null);
  const filtersRef = useRef(filters);
  useEffect(() => { filtersRef.current = filters; }, [filters]);

  // Load logs
  const loadLogs = useCallback(async (f = filtersRef.current) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page: f.page ?? 1,
        pageSize: f.pageSize ?? 20,
        entity: f.entity || undefined,
        action: f.action || undefined,
        severity: f.severity || undefined,
        status: f.status || undefined,
        userName: f.userName || undefined,
        email: f.email || undefined,
        role: f.role || undefined,
        search: f.search || undefined,
        dateFrom: f.dateFrom ? new Date(f.dateFrom).toISOString() : undefined,
        dateTo: f.dateTo ? new Date(f.dateTo).toISOString() : undefined,
        sortBy: f.sortBy,
        sortDesc: f.sortDesc,
      };
      const res = await fetchAuditLogs(params);
      setLogs(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setNewIds(new Set());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(filters); }, [filters]); // eslint-disable-line

  // Load analytics on tab switch
  useEffect(() => {
    if (tab === "analytics") {
      if (dashLoad) fetchAuditDashboard().then(setDashboard).catch(()=>{}).finally(()=>setDashLoad(false));
      if (insLoad)  fetchAuditInsights().then(setInsights).catch(()=>{}).finally(()=>setInsLoad(false));
    }
    if (tab === "charts") {
      if (tuLoad) fetchAuditTopUsers().then(setTopUsers).catch(()=>{}).finally(()=>setTuLoad(false));
      if (tmLoad) fetchAuditTopModules().then(setTopModules).catch(()=>{}).finally(()=>setTmLoad(false));
      if (hmLoad) fetchAuditHeatmap().then(setHeatmap).catch(()=>{}).finally(()=>setHmLoad(false));
    }
  }, [tab]); // eslint-disable-line

  // Load timeline when hours change
  useEffect(() => {
    if (tab === "charts") {
      setTlLoad(true);
      fetchAuditTimeline(tlHours).then(setTimeline).catch(()=>{}).finally(()=>setTlLoad(false));
    }
  }, [tab, tlHours]);

  // Compute entity list from top modules
  const moduleList = topModules.map((m) => m.entity).filter(Boolean);

  // SignalR
  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) return;

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(AUDIT_HUB_URL, {
        accessTokenFactory: () => getStoredAccessToken(),
        transport: signalR.HttpTransportType.LongPolling,
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    conn.on("AuditCreated", (data) => {
      // Prepend to table only on page 1 with no filters active
      setLogs((prev) => {
        const id = data.id;
        if (prev.find((l) => l.id === id)) return prev;
        const next = [data, ...prev].slice(0, 20);
        setNewIds((ids) => new Set([...ids, id]));
        return next;
      });
      // Update dashboard counters
      setDashboard((d) => {
        if (!d) return d;
        const upd = { ...d, totalLogs: (d.totalLogs ?? 0) + 1 };
        if (data.severity === "Critical" || data.severity === "Security")
          upd.criticalEvents = (d.criticalEvents ?? 0) + 1;
        if (data.status === "Failed")
          upd.failedActions = (d.failedActions ?? 0) + 1;
        if (data.severity === "Security")
          upd.securityAlerts = (d.securityAlerts ?? 0) + 1;
        return upd;
      });
    });

    conn.onreconnected(() => setConnected(true));
    conn.onreconnecting(() => setConnected(false));
    conn.onclose(() => setConnected(false));

    connRef.current = conn;
    conn.start().then(() => setConnected(true)).catch(() => setConnected(false));

    return () => { conn.stop(); };
  }, []); // eslint-disable-line

  const handleFiltersChange = (newF) => {
    setFilters({ ...newF, page: 1 });
  };

  const handleReset = () => setFilters(EMPTY_FILTERS);

  const TABS = [
    { key: "feed",      label: t("auditLogs.tabFeed"),      Icon: HiTable       },
    { key: "analytics", label: t("auditLogs.tabAnalytics"),  Icon: HiLightningBolt },
    { key: "charts",    label: t("auditLogs.tabCharts"),     Icon: HiChartBar    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title={t("auditLogs.title")} breadcrumbs={breadcrumbs} />

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-1 w-fit">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === key
                ? "bg-[#0b2c4a] text-white shadow"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Feed ── */}
      {tab === "feed" && (
        <div className="space-y-4">
          <FiltersPanel
            filters={filters}
            onChange={handleFiltersChange}
            onReset={handleReset}
            modules={moduleList}
          />

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <RealtimeBanner connected={connected} />
              <Typography variant="body2" color="text.secondary">
                {total.toLocaleString()} records
              </Typography>
            </div>
            <div className="flex items-center gap-3">
              <ExportButtons filters={filters} />
              <Tooltip title="Refresh">
                <IconButton size="small" onClick={() => loadLogs(filters)} disabled={loading}>
                  <HiRefresh size={17} className={loading ? "animate-spin" : ""} />
                </IconButton>
              </Tooltip>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
          )}

          <div className="rounded-2xl overflow-hidden ring-1 ring-slate-200 shadow-sm bg-white">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8fafc" }}>
                  <TableCell sx={{ width: 32 }} />
                  <TableCell><strong>Timestamp</strong></TableCell>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                  <TableCell><strong>Entity</strong></TableCell>
                  <TableCell><strong>Severity</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>IP</strong></TableCell>
                  <TableCell><strong>Browser / Device</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <SkeletonRows count={8} />
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <div className="text-sm text-slate-400 space-y-2">
                        <p>{t("auditLogs.noLogs")}</p>
                        <button
                          type="button"
                          onClick={handleReset}
                          className="text-blue-500 hover:underline text-xs"
                        >
                          {t("auditLogs.resetFilters")}
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <AuditTableRow
                      key={log.id}
                      log={log}
                      onSelect={setSelectedLog}
                      isNew={newIds.has(log.id)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center gap-3 justify-center">
              <button
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {filters.page} of {totalPages}
              </span>
              <button
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Analytics ── */}
      {tab === "analytics" && (
        <div className="space-y-5">
          <DashboardCards data={dashboard} loading={dashLoad} />
          {(insLoad || insights.length > 0) && (
            <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-sm p-5 space-y-3">
              <p className="font-semibold text-slate-800">AI Insights</p>
              <InsightBanners insights={insights} loading={insLoad} />
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Charts ── */}
      {tab === "charts" && (
        <div className="space-y-5">
          {tlLoad ? (
            <div className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ) : (
            <TimelineChart data={timeline} hours={tlHours} onHoursChange={setTlHours} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <TopUsersPanel data={topUsers} loading={tuLoad} />
            <TopModulesChart data={topModules} loading={tmLoad} />
          </div>
          <HeatmapGrid data={heatmap} loading={hmLoad} />
        </div>
      )}

      <DetailDialog log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
}

export default AuditLogsPage;
