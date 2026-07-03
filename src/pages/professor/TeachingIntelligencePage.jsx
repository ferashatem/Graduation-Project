import { useCallback, useEffect, useState } from "react";
import apiClient from "../../api/apiClient";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

const unwrap = (res) => res.data?.data ?? res.data;

const fetchTeachingDashboard = () =>
  apiClient.get("/teaching-intelligence/dashboard").then(unwrap);

const fetchOfferingAnalytics = (offeringId) =>
  apiClient.get(`/teaching-intelligence/offerings/${offeringId}/analytics`).then(unwrap);

const fetchAtRiskStudents = () =>
  apiClient.get("/teaching-intelligence/students/at-risk").then(unwrap);

const fetchOfferingTopics = (offeringId) =>
  apiClient.get(`/teaching-intelligence/offerings/${offeringId}/topics`).then(unwrap);

const fetchOfferingExport = (offeringId) =>
  apiClient.get(`/teaching-intelligence/offerings/${offeringId}/export`).then(unwrap);

const refreshOffering = (offeringId) =>
  apiClient.post(`/teaching-intelligence/offerings/${offeringId}/refresh`).then(unwrap);

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const normalized = level ? level.charAt(0).toUpperCase() + level.slice(1).toLowerCase() : null;
  const cfg = {
    Critical: "bg-red-200 text-red-800",
    High:     "bg-red-100 text-red-700",
    Medium:   "bg-amber-100 text-amber-700",
    Low:      "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg[normalized] ?? "bg-slate-100 text-slate-500"}`}>
      {normalized ?? "—"}
    </span>
  );
}

// ── Offering analytics drawer ─────────────────────────────────────────────────
function OfferingDrawer({ offering, onClose }) {
  const [data, setData]         = useState(null);
  const [topics, setTopics]           = useState(null);
  const [students, setStudents]       = useState(null);
  const [loading, setLoading]         = useState(true);
  const [topicsLoading, setTopicsLoading]   = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [error, setError]       = useState("");
  const [drawerTab, setDrawerTab] = useState(0); // 0=Analytics 1=Topics
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!offering?.offeringId) return;
    fetchOfferingAnalytics(offering.offeringId)
      .then(setData)
      .catch(() => setError("Failed to load analytics for this offering."))
      .finally(() => setLoading(false));
  }, [offering?.offeringId]);

  const handleLoadTopics = () => {
    if (topics || topicsLoading) return;
    setTopicsLoading(true);
    fetchOfferingTopics(offering.offeringId)
      .then(setTopics)
      .catch(() => {})
      .finally(() => setTopicsLoading(false));
  };

  const handleLoadStudents = () => {
    if (students || studentsLoading) return;
    setStudentsLoading(true);
    apiClient.get(`/teaching-intelligence/offerings/${offering.offeringId}/students`, {
      params: { page: 1, pageSize: 50, sortBy: "RiskScore", sortDir: "desc" },
    }).then((res) => {
      const d = res.data?.data ?? res.data;
      setStudents(Array.isArray(d) ? d : d?.items ?? d?.data ?? []);
    }).catch(() => setStudents([])).finally(() => setStudentsLoading(false));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const meta = await fetchOfferingExport(offering.offeringId);
      const rows = meta?.rows ?? [];
      if (rows.length === 0) { alert("No data to export."); return; }
      const columns = [
        "University ID","Name","Batch","Group","Department","College","Subject",
        "Final Score","Midterm","Coursework","Final Exam","Grade",
        "Total Assignments","Submitted","Missing","Completion %",
        "Total Exams","Avg Exam Score","Avg Quiz Score",
        "Risk Score","Risk Level","Risk Factors",
        "AI Sessions","Study Minutes","Streak Days",
      ];
      const toRow = (r) => [
        r.universityId, r.studentName, r.batchName, r.groupName, r.departmentName, r.collegeName, r.subjectName,
        r.finalScore ?? "", r.midtermScore ?? "", r.courseworkScore ?? "", r.finalExamScore ?? "", r.gradeCategory,
        r.totalAssignments, r.submittedAssignments, r.missingAssignments, r.assignmentCompletionRate,
        r.totalExams, r.avgExamScore ?? "", r.avgQuizScore ?? "",
        r.riskScore, r.riskLevel, r.riskFactors,
        r.aiSessions, r.studyMinutes, r.streakDays,
      ];
      const csv = [columns.join(","), ...rows.map((r) => toRow(r).map((v) => `"${v ?? ""}"`).join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `${offering.subjectCode ?? "offering"}_analytics.csv`; a.click();
      URL.revokeObjectURL(url);
    } catch { /* silent */ }
    finally { setExporting(false); }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshOffering(offering.offeringId); }
    catch { /* 202 accepted — ignore */ }
    finally { setRefreshing(false); }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-900/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-slate-100 px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {offering?.subjectName ?? offering?.name ?? "Class Analytics"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{offering?.subjectCode ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 transition disabled:opacity-50"
                title="Refresh data"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                {exporting ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Drawer tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-0.5">
            {["Analytics", "Topics", "Students"].map((t, i) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setDrawerTab(i);
                  if (i === 1) handleLoadTopics();
                  if (i === 2) handleLoadStudents();
                }}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
                  drawerTab === i ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Topics tab */}
          {drawerTab === 1 && (
            <>
              {topicsLoading && <Loading label="Loading topics…" />}
              {!topicsLoading && topics && (
                <div className="space-y-5">
                  {topics.weakTopics?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Weak Topics</h3>
                      <div className="space-y-2">
                        {topics.weakTopics.map((t, i) => (
                          <div key={i} className="rounded-xl bg-red-50 px-4 py-3">
                            <p className="text-sm font-medium text-red-800">{typeof t === "string" ? t : (t.topicName ?? t.topic)}</p>
                            {t.avgScore != null && (
                              <span className="text-xs font-bold text-red-600">{t.avgScore.toFixed(0)}%</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topics.strongTopics?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Strong Topics</h3>
                      <div className="space-y-2">
                        {topics.strongTopics.map((t, i) => (
                          <div key={i} className="rounded-xl bg-emerald-50 px-4 py-3">
                            <p className="text-sm font-medium text-emerald-800">{typeof t === "string" ? t : (t.topicName ?? t.topic)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {topics.questionBreakdown?.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Question Performance</h3>
                      <div className="space-y-2">
                        {topics.questionBreakdown.map((q, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                            <p className="text-sm font-medium text-slate-700">{q.topic}</p>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="text-xs text-slate-400">{q.totalAttempts} attempts</span>
                              <span className="text-xs font-bold text-slate-700">{q.averageScore?.toFixed(0)}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!topics.weakTopics?.length && !topics.strongTopics?.length && !topics.questionBreakdown?.length && (
                    <p className="text-sm text-slate-400 py-6 text-center">No topic analytics available yet.</p>
                  )}
                </div>
              )}
              {!topicsLoading && !topics && (
                <p className="text-sm text-slate-400 py-6 text-center">No topics data available.</p>
              )}
            </>
          )}

          {/* Students tab */}
          {drawerTab === 2 && (
            <>
              {studentsLoading && <Loading label="Loading students…" />}
              {!studentsLoading && students !== null && students.length === 0 && (
                <p className="text-sm text-slate-400 py-6 text-center">No students data available.</p>
              )}
              {!studentsLoading && students?.length > 0 && (
                <div className="space-y-2">
                  {students.map((s, i) => (
                    <div key={s.studentId ?? i} className="rounded-xl bg-slate-50 px-4 py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">{s.studentName ?? "Student"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {s.studentUniversityId ?? ""}
                          {s.riskScore != null ? ` · Risk: ${s.riskScore.toFixed(0)}` : ""}
                        </p>
                        {s.riskFactors?.length > 0 && (
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{s.riskFactors[0]}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.finalScore != null && (
                          <span className="text-xs font-bold text-slate-700">{s.finalScore.toFixed(1)}%</span>
                        )}
                        <RiskBadge level={s.riskLevel} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {drawerTab === 0 && loading && <Loading label="Loading analytics…" />}
          {drawerTab === 0 && error && <ErrorState message={error} />}

          {drawerTab === 0 && !loading && data && (
            <>
              {/* Grade distribution */}
              {data.gradeDistribution?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Grade Distribution</h3>
                  <div className="space-y-2">
                    {data.gradeDistribution.map((g, i) => {
                      const total = data.gradeDistribution.reduce((s, x) => s + (x.count ?? 0), 0);
                      const pct = total > 0 ? ((g.count ?? 0) / total) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <span className="w-12 text-xs font-bold text-slate-600 text-right shrink-0">{g.range}</span>
                          <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#0b2c4a] transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{g.count ?? 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weak topics */}
              {data.weakTopics?.length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Weak Topics</h3>
                  <div className="space-y-2">
                    {data.weakTopics.map((t, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3">
                        <p className="text-sm font-medium text-red-800">{t.topicName ?? t.topic ?? "—"}</p>
                        <span className="text-xs text-red-600 font-semibold">
                          {t.averageScore != null ? `${t.averageScore.toFixed(0)}%` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {(data.students?.items ?? data.students ?? []).length > 0 && (
                <div>
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                    Students ({data.students?.totalCount ?? (data.students?.items ?? data.students ?? []).length})
                  </h3>
                  <div className="space-y-2">
                    {(data.students?.items ?? data.students ?? []).slice(0, 20).map((s, i) => (
                      <div key={s.studentId ?? i} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.studentName ?? "Student"}</p>
                          <p className="text-xs text-slate-400">{s.studentUniversityId ?? ""}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {s.finalScore != null && (
                            <span className="text-xs font-bold text-slate-700">{s.finalScore.toFixed(1)}%</span>
                          )}
                          <RiskBadge level={s.riskLevel} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function TeachingIntelligencePage() {
  const [dashboard, setDashboard]       = useState(null);
  const [atRisk,    setAtRisk]          = useState([]);
  const [loading,   setLoading]         = useState(true);
  const [error,     setError]           = useState("");
  const [selected,  setSelected]        = useState(null);
  const [refreshKey, setRefreshKey]     = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchTeachingDashboard().catch(() => null),
      fetchAtRiskStudents().catch(() => []),
    ])
      .then(([dash, risk]) => {
        setDashboard(dash);
        setAtRisk(Array.isArray(risk) ? risk : []);
      })
      .catch((e) => setError(e?.message ?? "Failed to load teaching intelligence."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading) return <Loading label="Loading teaching intelligence…" />;
  if (error)   return <ErrorState message={error} onRetry={() => setRefreshKey((k) => k + 1)} />;

  const stats    = dashboard?.overallStats ?? {};
  const offerings = dashboard?.offerings ?? [];
  const alerts   = dashboard?.recentAlerts ?? [];
  const aiRec    = dashboard?.aiRecommendations ?? [];
  const weakTopics = dashboard?.weakTopics ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Teaching Intelligence</h1>
          <p className="text-sm text-slate-400 mt-0.5">AI-powered insights about your classes</p>
        </div>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Overall stats */}
      {Object.keys(stats).length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Students",  value: stats.totalStudents ?? "—",                                                        color: "#1a5fa3" },
            { label: "Avg Risk Score",  value: stats.avgRiskScore != null ? stats.avgRiskScore.toFixed(1) : "—",                  color: "#d97706" },
            { label: "At-Risk Students",value: stats.atRiskCount ?? atRisk.length,                                                color: "#ef4444" },
            { label: "Offerings",       value: (dashboard?.offerings?.length ?? 0),                                               color: "#059669" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Offerings */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Your Offerings</h2>
          {offerings.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">No offerings data available yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {offerings.map((o, i) => {
                const risk = o.atRiskCount ?? 0;
                const avg  = o.averageScore ?? o.averageGrade;
                const noData = (o.totalStudents === 0) || o.overallHealth === "unknown";
                return (
                  <div
                    key={o.offeringId ?? i}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 cursor-pointer hover:ring-blue-200 transition"
                    onClick={() => setSelected(o)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800">{o.subjectName ?? o.name ?? "Offering"}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {o.subjectCode ?? ""}
                          {o.totalStudents != null ? ` · ${o.totalStudents} students` : ""}
                          {o.semesterName ? ` · ${o.semesterName}` : ""}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {o.groupName ?? ""}{o.batchName ? ` · ${o.batchName}` : ""}
                          {(o.lastRefreshedAt ?? o.snapshotDate ?? o.refreshedAt) && (
                            <span className="ml-1">
                              · Refreshed {new Date(o.lastRefreshedAt ?? o.snapshotDate ?? o.refreshedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                        {noData ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-400">
                            No students enrolled yet
                          </span>
                        ) : (
                          <>
                            {o.overallHealth && (
                              <span className={{
                                excellent:  "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700",
                                good:       "rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700",
                                concerning: "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700",
                                critical:   "rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700",
                              }[o.overallHealth] ?? "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500"}>
                                {o.overallHealth}
                              </span>
                            )}
                            {risk > 0 && (
                              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                {risk} at-risk
                              </span>
                            )}
                          </>
                        )}
                        <span className="text-xs font-semibold text-blue-600 hover:underline">View →</span>
                      </div>
                    </div>
                    {!noData && avg != null && (
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#0b2c4a] transition-all"
                            style={{ width: `${Math.min(avg, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{avg.toFixed(1)}% avg</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: at-risk + alerts */}
        <div className="space-y-4">
          {/* At-Risk Students */}
          <div>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">At-Risk Students</h2>
            {atRisk.length === 0 ? (
              <div className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 text-sm text-emerald-700">
                No at-risk students detected.
              </div>
            ) : (
              <div className="space-y-2">
                {atRisk.slice(0, 8).map((s, i) => (
                  <div key={s.studentId ?? i} className="rounded-xl bg-white p-3 ring-1 ring-slate-100 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{s.studentName ?? "Student"}</p>
                      <p className="text-[10px] text-slate-400 truncate">{s.subjectName ?? s.universityStudentId ?? ""}</p>
                    </div>
                    <RiskBadge level={s.riskLevel} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weak Topics */}
          {weakTopics.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Weak Topics</h2>
              <div className="space-y-2">
                {weakTopics.slice(0, 5).map((t, i) => (
                  <div key={i} className="rounded-xl bg-amber-50 px-3 py-2.5 ring-1 ring-amber-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-amber-800 truncate">{t.topicName ?? t.topic}</p>
                    {t.averageScore != null && (
                      <span className="text-xs font-bold text-amber-600 shrink-0 ml-2">{t.averageScore.toFixed(0)}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations — only shown when there's actual student data */}
          {aiRec.length > 0 && (stats.totalStudents ?? 0) > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">AI Recommendations</h2>
              <div className="space-y-2">
                {aiRec.slice(0, 3).map((r, i) => (
                  <div key={i} className="rounded-xl bg-violet-50 px-3 py-2.5 ring-1 ring-violet-100">
                    <p className="text-xs text-violet-700">{r.message ?? r.recommendation ?? r}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Alerts */}
          {alerts.length > 0 && (
            <div>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Recent Alerts</h2>
              <div className="space-y-2">
                {alerts.slice(0, 5).map((a, i) => (
                  <div key={i} className="rounded-xl bg-white p-3 ring-1 ring-slate-100">
                    <p className="text-xs font-semibold text-slate-700">{a.title ?? a.message ?? "Alert"}</p>
                    {a.description && <p className="text-[11px] text-slate-400 mt-0.5">{a.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <OfferingDrawer offering={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default TeachingIntelligencePage;
