import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiAcademicCap, HiChevronDown, HiChevronUp, HiExclamation, HiLightBulb, HiRefresh } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

// ── Status configs ────────────────────────────────────────────────────────────
const SUBJECT_STATUS = {
  passed:   { label: "Passed",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500", bar: "bg-emerald-500" },
  failed:   { label: "Failed",   bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500",     bar: "bg-red-500"     },
  enrolled: { label: "Enrolled", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500",    bar: "bg-blue-400"    },
  upcoming: { label: "Upcoming", bg: "bg-slate-100",   text: "text-slate-500",   dot: "bg-slate-300",   bar: "bg-slate-200"   },
};

const SEM_STATUS = {
  completed:   { label: "Completed",   color: "text-emerald-600", ring: "ring-emerald-200", header: "bg-emerald-50" },
  in_progress: { label: "In Progress", color: "text-blue-600",    ring: "ring-blue-200",    header: "bg-blue-50"    },
  upcoming:    { label: "Upcoming",    color: "text-slate-400",   ring: "ring-slate-100",   header: "bg-slate-50"   },
};

// ── GPA Ring ──────────────────────────────────────────────────────────────────
function GpaRing({ gpa }) {
  const max = 4;
  const pct = gpa != null ? Math.min(gpa / max, 1) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  const color = gpa >= 3.5 ? "#10b981" : gpa >= 2.5 ? "#3b82f6" : gpa >= 1.0 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center h-20 w-20">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 70 70">
        <circle cx="35" cy="35" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="35" cy="35" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.8s ease" }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-lg font-bold text-slate-800 leading-none">{gpa?.toFixed(2) ?? "—"}</p>
        <p className="text-[10px] text-slate-400 mt-0.5">GPA</p>
      </div>
    </div>
  );
}

// ── Subject Row ───────────────────────────────────────────────────────────────
function SubjectRow({ subject }) {
  const cfg = SUBJECT_STATUS[subject.status] ?? SUBJECT_STATUS.upcoming;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-white ring-1 ring-slate-100 hover:ring-slate-200 transition">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{subject.subjectName}</p>
          <p className="text-xs text-slate-400">
            {subject.subjectCode} · {subject.creditHours} cr
            {subject.finalScore != null && (
              <span className="ml-1.5 text-slate-500">· {subject.finalScore}%</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {subject.gradeLetter && (
          <span className="text-sm font-bold text-slate-700 w-5 text-center">{subject.gradeLetter}</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
        {!subject.isRequired && (
          <span className="rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-400">Elective</span>
        )}
      </div>
    </div>
  );
}

// ── Semester Card ─────────────────────────────────────────────────────────────
function SemesterCard({ semester, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = SEM_STATUS[semester.status] ?? SEM_STATUS.upcoming;
  const pct = semester.totalCreditHours > 0
    ? Math.round((semester.earnedCreditHours / semester.totalCreditHours) * 100)
    : 0;

  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 overflow-hidden ${cfg.ring}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between gap-4 px-5 py-4 text-left transition ${cfg.header} hover:opacity-90`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-sm font-bold text-slate-700 shrink-0 shadow-sm">
            {semester.semesterNumber}
          </div>
          <div>
            <p className="font-semibold text-slate-800">Semester {semester.semesterNumber}</p>
            <p className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* mini progress bar */}
          <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
            <div className="h-1.5 w-24 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  semester.status === "completed" ? "bg-emerald-500" :
                  semester.status === "in_progress" ? "bg-blue-500" : "bg-slate-300"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">{semester.earnedCreditHours}/{semester.totalCreditHours} cr</p>
          </div>
          <div className="text-slate-400">
            {open ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-2">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
            {semester.passedSubjects > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {semester.passedSubjects} passed
              </span>
            )}
            {semester.failedSubjects > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {semester.failedSubjects} failed
              </span>
            )}
            {semester.enrolledSubjects > 0 && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {semester.enrolledSubjects} enrolled
              </span>
            )}
            <span className="flex items-center gap-1.5 ml-auto text-slate-400">
              {pct}% earned
            </span>
          </div>
          <div className="space-y-2">
            {semester.subjects.map((s) => (
              <SubjectRow key={s.subjectId} subject={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 text-center">
      <p className="text-2xl font-bold text-[#0b2c4a]">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function StudentRoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    apiClient.get("/regulations/my-roadmap")
      .then((res) => setRoadmap(res.data?.data ?? res.data))
      .catch((err) => setError(getErrorMessage(err, "Failed to load your academic roadmap.")))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return <Loading label="Loading your roadmap…" />;

  if (error) return (
    <div className="space-y-6">
      <PageHeader title="Academic Roadmap" />
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-red-50 p-10 text-center ring-1 ring-red-200">
        <HiExclamation className="h-10 w-10 text-red-400" />
        <p className="text-sm text-red-700 max-w-sm">{error}</p>
        <button onClick={load}
          className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 transition">
          <HiRefresh className="h-3.5 w-3.5" /> Retry
        </button>
      </div>
    </div>
  );

  if (!roadmap) return null;

  const overallPct = roadmap.totalCreditHours > 0
    ? Math.round((roadmap.completedCreditHours / roadmap.totalCreditHours) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Academic Roadmap" />

      {/* ── Hero summary card ── */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HiAcademicCap className="h-5 w-5 text-[#0b2c4a]" />
              <h2 className="font-semibold text-slate-800">{roadmap.regulationTitle}</h2>
            </div>
            <p className="text-sm text-slate-500">
              {roadmap.departmentName} · {roadmap.collegeName}
              {roadmap.batchName && ` · ${roadmap.batchName}`}
            </p>
          </div>
          <GpaRing gpa={roadmap.currentGpa} />
        </div>

        {/* Overall progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Overall Progress</span>
            <span className="font-semibold text-slate-700">{overallPct}%</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0b2c4a] to-blue-500 transition-all duration-700"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>{roadmap.completedCreditHours} cr completed</span>
            <span>{roadmap.remainingCreditHours} cr remaining</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <StatCard label="Semesters" value={roadmap.totalSemesters} />
          <StatCard label="Passed" value={roadmap.passedSubjects} sub={`of ${roadmap.totalSubjects} subjects`} />
          <StatCard label="Enrolled" value={roadmap.currentlyEnrolled} />
          <StatCard label="Failed" value={roadmap.failedSubjects ?? 0} />
        </div>
      </div>

      {/* ── Alerts row ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Must retake */}
        {roadmap.mustRetake?.length > 0 && (
          <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 space-y-3">
            <div className="flex items-center gap-2">
              <HiExclamation className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-700">Must Retake ({roadmap.mustRetake.length})</p>
            </div>
            <div className="space-y-1.5">
              {roadmap.mustRetake.map((s) => (
                <div key={s.subjectId ?? s.subjectCode} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <p className="text-sm text-red-700">
                    {s.subjectName}
                    <span className="text-xs text-red-400 ml-1">({s.subjectCode})</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended next */}
        {roadmap.recommendedNext?.length > 0 && (
          <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200 space-y-3">
            <div className="flex items-center gap-2">
              <HiLightBulb className="h-4 w-4 text-blue-500 shrink-0" />
              <p className="text-sm font-bold text-blue-700">Recommended Next ({roadmap.recommendedNext.length})</p>
            </div>
            <div className="space-y-1.5">
              {roadmap.recommendedNext.map((s) => (
                <div key={s.subjectId ?? s.subjectCode} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                    <p className="text-sm text-blue-700">
                      {s.subjectName}
                      <span className="text-xs text-blue-400 ml-1">({s.subjectCode})</span>
                    </p>
                  </div>
                  <span className="text-xs text-blue-500 shrink-0">{s.creditHours} cr</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Semesters ── */}
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">All Semesters</p>
        {roadmap.semesters?.map((sem) => (
          <SemesterCard
            key={sem.semesterNumber}
            semester={sem}
            defaultOpen={sem.status === "in_progress"}
          />
        ))}
      </div>
    </div>
  );
}

export default StudentRoadmapPage;
