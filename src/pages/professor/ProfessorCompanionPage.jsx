import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import apiClient from "../../api/apiClient";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

const unwrap = (res) => res.data?.data ?? res.data;

const fetchClassAnalytics = (offeringId) =>
  apiClient.get(`/companion/class-analytics/${offeringId}`).then(unwrap);

const fetchWeakTopics = (offeringId) =>
  apiClient.get(`/companion/class-analytics/${offeringId}/weak-topics`).then(unwrap);

// ── Risk badge ────────────────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const cfg = {
    High:   "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low:    "bg-emerald-100 text-emerald-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg[level] ?? "bg-slate-100 text-slate-500"}`}>
      {level ?? "—"}
    </span>
  );
}

// ── Analytics Panel ───────────────────────────────────────────────────────────
function AnalyticsPanel({ offeringId }) {
  const [data,    setData]    = useState(null);
  const [topics,  setTopics]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState(0);

  useEffect(() => {
    if (!offeringId) return;
    setLoading(true);
    setData(null); setTopics(null);
    Promise.all([
      fetchClassAnalytics(offeringId).catch(() => null),
      fetchWeakTopics(offeringId).catch(() => null),
    ])
      .then(([analytics, weak]) => {
        setData(analytics);
        setTopics(weak);
      })
      .finally(() => setLoading(false));
  }, [offeringId]);

  if (loading) return <Loading label="Loading class analytics…" />;
  if (!data && !topics) return (
    <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
      <p className="text-sm text-slate-400">No analytics available for this offering yet.</p>
    </div>
  );

  const atRisk  = data?.atRiskStudents ?? data?.atRiskCount ?? 0;
  const passRate = data?.passRate ?? data?.passRatePercentage;
  const avgGrade = data?.averageGrade ?? data?.avgGrade;
  const aiSummary = data?.aiSummary ?? data?.summary ?? "";

  return (
    <div className="space-y-5">
      {/* Stats row */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Avg Grade",    value: avgGrade  != null ? `${Number(avgGrade).toFixed(1)}%`  : "—", color: "#1a5fa3" },
            { label: "Pass Rate",    value: passRate  != null ? `${Number(passRate).toFixed(0)}%`  : "—", color: "#059669" },
            { label: "At-Risk",      value: atRisk,                                                        color: "#dc2626" },
            { label: "Total Students", value: data.totalStudents ?? data.enrolledCount ?? "—",             color: "#7c3aed" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{s.label}</p>
              <p className="mt-2 text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary */}
      {aiSummary && (
        <div className="rounded-2xl bg-violet-50 px-5 py-4 ring-1 ring-violet-200">
          <p className="text-[11px] font-bold uppercase tracking-widest text-violet-500 mb-2">AI Summary</p>
          <p className="text-sm text-violet-800">{aiSummary}</p>
        </div>
      )}

      {/* Tabs: Weak Topics / At-Risk Students */}
      <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
        {["Weak Topics", "At-Risk Students"].map((t, i) => (
          <button
            key={t} type="button" onClick={() => setTab(i)}
            className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
              tab === i ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Weak Topics tab */}
      {tab === 0 && (
        <div className="space-y-2">
          {(() => {
            const list = topics?.weakTopics ?? topics?.topics ?? (Array.isArray(topics) ? topics : []);
            if (list.length === 0) return (
              <div className="rounded-2xl bg-white p-6 text-center ring-1 ring-slate-200">
                <p className="text-sm text-slate-400">No weak topics detected yet.</p>
              </div>
            );
            return list.map((t, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-100">
                <div>
                  <p className="text-sm font-semibold text-red-800">{t.topicName ?? t.topic ?? t.name ?? "—"}</p>
                  {t.questionCount && <p className="text-xs text-red-500 mt-0.5">{t.questionCount} questions</p>}
                </div>
                {t.averageScore != null && (
                  <span className="text-sm font-bold text-red-600">{Number(t.averageScore).toFixed(0)}%</span>
                )}
              </div>
            ));
          })()}
        </div>
      )}

      {/* At-Risk Students tab */}
      {tab === 1 && (
        <div className="space-y-2">
          {(() => {
            const list = data?.atRiskStudentsList ?? data?.atRiskStudents ?? [];
            if (!Array.isArray(list) || list.length === 0) return (
              <div className="rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
                <p className="text-sm text-emerald-700">No at-risk students detected.</p>
              </div>
            );
            return list.map((s, i) => (
              <div key={s.studentId ?? i} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 ring-1 ring-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.studentName ?? "Student"}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {s.universityStudentId ?? ""}
                    {s.attendanceRate != null ? ` · ${s.attendanceRate}% attendance` : ""}
                  </p>
                </div>
                <RiskBadge level={s.riskLevel} />
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function ProfessorCompanionPage() {
  const { user, profile, profileLoading } = useOutletContext() || {};
  const doctorCode = profile?.code ?? profile?.doctorCode ?? user?.code ?? "";

  const [offerings,     setOfferings]     = useState([]);
  const [offeringsLoading, setOfferingsLoading] = useState(true);
  const [selectedId,    setSelectedId]    = useState("");

  const load = useCallback(() => {
    if (profileLoading) return;
    fetchMySubjects(doctorCode)
      .then((d) => setOfferings(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setOfferingsLoading(false));
  }, [doctorCode, profileLoading]);

  useEffect(() => { load(); }, [load]);

  if (profileLoading || offeringsLoading) return <Loading label="Loading companion…" />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Class Companion</h1>
        <p className="text-sm text-slate-400 mt-0.5">AI-powered analytics for your classes</p>
      </div>

      {/* Offering selector */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
        <label className="block text-xs font-semibold text-slate-500 mb-2">Select Offering</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">— Choose an offering —</option>
          {offerings.map((o) => {
            const id   = o.id ?? o.subjectOfferingId;
            const name = o.subjectName ?? o.name ?? "Offering";
            const code = o.subjectCode ?? o.code ?? "";
            return <option key={id} value={id}>{name}{code ? ` (${code})` : ""}</option>;
          })}
        </select>
      </div>

      {/* Analytics panel */}
      {selectedId ? (
        <AnalyticsPanel key={selectedId} offeringId={selectedId} />
      ) : (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">Select an offering to view AI class analytics</p>
        </div>
      )}
    </div>
  );
}

export default ProfessorCompanionPage;
