import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAdminDashboard, fetchAnalyticsSummary } from "../api/analyticsApi";

function StatCard({ label, value, color = "#1a5fa3" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-800">{value ?? "—"}</p>
      </div>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-slate-800" title={value}>{value}</p>
    </div>
  );
}

export default function AdminHome() {
  const fullName  = localStorage.getItem("userName")  || "—";
  const email     = localStorage.getItem("userEmail") || "—";
  const rawRole   = localStorage.getItem("role") || "Admin";
  const roleLabel = rawRole.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const [dash, setDash]       = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchAdminDashboard().then(setDash).catch(() => {});
    fetchAnalyticsSummary().then(setSummary).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">{roleLabel} Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back, {fullName}</p>
      </div>

      {/* Profile row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Full Name" value={fullName} />
        <InfoCard label="Email"     value={email}    />
        <InfoCard label="Role"      value={roleLabel} />
      </div>

      {/* Analytics stats from /analytics/dashboard/admin */}
      {dash && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Students"  value={dash.totalStudents}  color="#1a5fa3" />
          <StatCard label="Total Doctors"   value={dash.totalDoctors}   color="#7c3aed" />
          <StatCard label="Active Courses"  value={dash.activeCourses ?? dash.totalOfferings} color="#059669" />
          <StatCard label="At-Risk Students" value={dash.atRiskCount}   color="#dc2626" />
        </div>
      )}

      {/* Summary stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Colleges"      value={summary.totalColleges}     color="#0891b2" />
          <StatCard label="Departments"   value={summary.totalDepartments}  color="#d97706" />
          <StatCard label="Batches"       value={summary.totalBatches}      color="#0f766e" />
          <StatCard label="Enrollments"   value={summary.totalEnrollments}  color="#6d28d9" />
        </div>
      )}

      {/* Additional admin metrics */}
      {dash && (dash.avgGpa != null || dash.passRate != null) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dash.avgGpa    != null && <StatCard label="Average GPA"  value={dash.avgGpa}             color="#10b981" />}
          {dash.passRate  != null && <StatCard label="Pass Rate"    value={`${dash.passRate}%`}      color="#0ea5e9" />}
          {dash.activeExams != null && <StatCard label="Active Exams" value={dash.activeExams}       color="#f59e0b" />}
        </div>
      )}
    </div>
  );
}
