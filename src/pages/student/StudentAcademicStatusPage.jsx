import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

const STANDING_CONFIG = {
  Good:      { color: "text-emerald-700", bg: "bg-emerald-50",  ring: "ring-emerald-200", bar: "bg-emerald-500" },
  Warning:   { color: "text-yellow-700",  bg: "bg-yellow-50",   ring: "ring-yellow-200",  bar: "bg-yellow-500"  },
  Probation: { color: "text-orange-700",  bg: "bg-orange-50",   ring: "ring-orange-200",  bar: "bg-orange-500"  },
  Suspended: { color: "text-red-700",     bg: "bg-red-50",      ring: "ring-red-200",     bar: "bg-red-500"     },
  Graduated: { color: "text-blue-700",    bg: "bg-blue-50",     ring: "ring-blue-200",    bar: "bg-blue-500"    },
};

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-800">{value ?? "—"}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ProgressBar({ value, max, colorClass = "bg-blue-500" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function StudentAcademicStatusPage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/registration/academic-status")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setStatus(data);
      })
      .catch((err) => setError(getErrorMessage(err, "Failed to load academic status.")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading academic status…" />;
  if (error)   return <ErrorState message={error} />;
  if (!status) return null;

  const cfg = STANDING_CONFIG[status.standing] ?? STANDING_CONFIG.Good;

  return (
    <div className="space-y-8">
      <PageHeader title="Academic Status" />

      {/* Standing banner */}
      <div className={`flex items-start gap-4 rounded-2xl p-5 ring-1 ${cfg.bg} ${cfg.ring}`}>
        <div className="flex-1">
          <p className={`text-lg font-bold ${cfg.color}`}>{status.standing}</p>
          <p className="text-sm text-slate-600 mt-0.5">{status.studentName}</p>
          {status.warningMessage && (
            <p className={`mt-2 text-sm font-medium ${cfg.color}`}>{status.warningMessage}</p>
          )}
        </div>
        {status.warningCount > 0 && (
          <div className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.color} ring-1 ${cfg.ring}`}>
            {status.warningCount} warning{status.warningCount > 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* GPA Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="GPA" value={status.gpa?.toFixed(2)} sub="Current semester" />
        <StatCard label="CGPA" value={status.cgpa?.toFixed(2)} sub="Cumulative" />
        <StatCard label="Last Semester GPA" value={status.lastSemesterGPA?.toFixed(2)} />
        <StatCard label="Max Credit Hours" value={status.maxAllowedHours} sub="This semester" />
      </div>

      {/* Credit Hours Progress */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Credit Hours Progress</h2>
        <div className="flex items-end justify-between text-sm">
          <span className="font-medium text-slate-700">Earned Hours</span>
          <span className="font-bold text-slate-800">{status.earnedHours} / {status.totalRequired}</span>
        </div>
        <ProgressBar value={status.earnedHours} max={status.totalRequired} colorClass={cfg.bar} />
        <div className="flex justify-between text-xs text-slate-400">
          <span>{Math.round((status.earnedHours / (status.totalRequired || 1)) * 100)}% completed</span>
          <span>{status.remainingHours} hours remaining</span>
        </div>
      </div>

      {/* Level & Policy Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Academic Level</p>
          <p className="text-2xl font-bold text-slate-800">{status.currentLevel ?? "—"}</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Enrollment Limit</p>
          <p className="text-2xl font-bold text-slate-800">{status.maxAllowedHours} hrs</p>
          <p className="text-xs text-slate-400">Maximum allowed this semester based on GPA</p>
        </div>
      </div>
    </div>
  );
}

export default StudentAcademicStatusPage;
