import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import { fetchDoctorDashboard } from "../../api/analyticsApi";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

function StatCard({ label, value, color = "#1a5fa3" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 flex items-center justify-between">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-800">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${color}18` }}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke={color}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      </div>
    </div>
  );
}

function ProfessorHome() {
  const { user, profile, profileLoading } = useOutletContext() || {};
  const { t } = useTranslation();

  const [subjects, setSubjects] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const doctorCode = profile?.code ?? profile?.doctorCode ?? profile?.Code ?? user?.code ?? "";

  useEffect(() => {
    if (profileLoading) return;
    let active = true;
    setLoading(true);
    setError("");
    Promise.all([
      fetchMySubjects(doctorCode),
      fetchDoctorDashboard().catch(() => null),
    ])
      .then(([subjectsData, analyticsData]) => {
        if (!active) return;
        setSubjects(subjectsData);
        setAnalytics(analyticsData);
      })
      .catch((e) => { if (active) setError(e?.response?.data?.message ?? e?.message ?? t("profHome.failed")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [doctorCode, profileLoading, refreshKey]);

  const profileSummary = useMemo(() => ({
    name: profile?.fullName ?? profile?.Full_Name ?? profile?.name ?? profile?.displayName ?? "Professor",
    email: profile?.email ?? profile?.Email ?? "—",
    college: profile?.collegeName ?? profile?.college ?? profile?.collegeCode ?? "—",
  }), [profile]);

  const termOptions = useMemo(() => {
    const terms = subjects.map((s) => s.term ?? s.termName ?? s.semesterName).filter(Boolean);
    return Array.from(new Set(terms)).sort();
  }, [subjects]);

  useEffect(() => {
    if (selectedTerm && !termOptions.includes(selectedTerm)) setSelectedTerm("");
  }, [selectedTerm, termOptions]);

  const recentSubjects = useMemo(() => subjects.slice(0, 5), [subjects]);
  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (profileLoading || loading) return <Loading label="Loading professor dashboard..." />;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Professor Home</h1>
        <p className="text-sm text-slate-400 mt-0.5">Welcome back, {profileSummary.name}</p>
      </div>

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {/* Profile + Term row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile card */}
        <div className="lg:col-span-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-slate-800">{profileSummary.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  College: {profileSummary.college}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{profileSummary.email}</p>
              <p className="text-xs text-slate-400 mt-0.5">Professor</p>
            </div>
          </div>
        </div>

        {/* Term selector */}
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-semibold text-slate-700">Current term</p>
          </div>
          <div className="relative">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 pr-8 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All terms</option>
              {termOptions.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Courses"
          value={analytics?.offeringCount ?? subjects.length}
          color="#1a5fa3"
        />
        <StatCard
          label="Total Students"
          value={analytics?.totalStudents ?? "—"}
          color="#059669"
        />
        <StatCard
          label="Pending Reviews"
          value={analytics?.submissionsToGrade ?? "—"}
          color="#d97706"
        />
        <StatCard
          label="Avg Grade"
          value={analytics?.averageGrade != null ? `${analytics.averageGrade.toFixed(1)}%` : "—"}
          color="#7c3aed"
        />
      </div>

      {/* Recent subjects */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Recent Assigned Subjects
          </h3>
          <button type="button" className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {recentSubjects.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No subjects assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {recentSubjects.map((s, i) => (
              <div
                key={s.id ?? s.code ?? i}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {s.subjectName ?? s.name ?? s.courseName ?? "Untitled"}
                    </p>
                    <p className="text-xs text-slate-400">Code: {s.subjectCode ?? s.code ?? "-"}</p>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfessorHome;
