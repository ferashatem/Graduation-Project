import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import apiClient from "../../api/apiClient";
import { getErrorMessage } from "../../utils/errorHelpers";

const STATUS_CONFIG = {
  passed:   { label: "Passed",   bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  failed:   { label: "Failed",   bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500"     },
  enrolled: { label: "Enrolled", bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500"    },
  upcoming: { label: "Upcoming", bg: "bg-slate-100",   text: "text-slate-600",   dot: "bg-slate-400"   },
};

const SEM_STATUS = {
  completed:   { label: "Completed",   color: "text-emerald-600", ring: "ring-emerald-200" },
  in_progress: { label: "In Progress", color: "text-blue-600",    ring: "ring-blue-200"    },
  upcoming:    { label: "Upcoming",    color: "text-slate-400",   ring: "ring-slate-200"   },
};

function SubjectRow({ subject }) {
  const cfg = STATUS_CONFIG[subject.status] ?? STATUS_CONFIG.upcoming;
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-white ring-1 ring-slate-100">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{subject.subjectName}</p>
          <p className="text-xs text-slate-400">{subject.subjectCode} · {subject.creditHours} cr</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {subject.gradeLetter && (
          <span className="text-xs font-bold text-slate-600">{subject.gradeLetter}</span>
        )}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
        {!subject.isRequired && (
          <span className="rounded-full px-2 py-0.5 text-xs bg-slate-100 text-slate-400">Elective</span>
        )}
      </div>
    </div>
  );
}

function SemesterCard({ semester }) {
  const [open, setOpen] = useState(semester.status === "in_progress");
  const semCfg = SEM_STATUS[semester.status] ?? SEM_STATUS.upcoming;
  const pct = semester.totalCreditHours > 0
    ? Math.round((semester.earnedCreditHours / semester.totalCreditHours) * 100)
    : 0;

  return (
    <div className={`rounded-2xl bg-white shadow-sm ring-1 overflow-hidden ${semCfg.ring}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 shrink-0">
            {semester.semesterNumber}
          </div>
          <div>
            <p className="font-semibold text-slate-800">Semester {semester.semesterNumber}</p>
            <p className={`text-xs font-medium ${semCfg.color}`}>{semCfg.label}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-700">{semester.earnedCreditHours}/{semester.totalCreditHours} cr</p>
          <p className="text-xs text-slate-400">{pct}% earned</p>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-2">
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />{semester.passedSubjects} passed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />{semester.failedSubjects} failed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-500" />{semester.enrolledSubjects} enrolled</span>
          </div>
          {semester.subjects.map((s) => (
            <SubjectRow key={s.subjectId} subject={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function StudentRoadmapPage() {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiClient.get("/regulations/my-roadmap")
      .then((res) => setRoadmap(res.data?.data ?? res.data))
      .catch((err) => setError(getErrorMessage(err, "Failed to load your academic roadmap.")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading label="Loading your roadmap…" />;
  if (error)   return <ErrorState message={error} />;
  if (!roadmap) return null;

  const overallPct = roadmap.totalCreditHours > 0
    ? Math.round((roadmap.completedCreditHours / roadmap.totalCreditHours) * 100)
    : 0;

  return (
    <div className="space-y-8">
      <PageHeader title="Academic Roadmap" />

      {/* Summary header */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div>
          <h2 className="font-semibold text-slate-800">{roadmap.regulationTitle}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {roadmap.departmentName} · {roadmap.collegeName}
            {roadmap.batchName && ` · Batch ${roadmap.batchName}`}
          </p>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{overallPct}% complete</span>
          <span>{roadmap.completedCreditHours} / {roadmap.totalCreditHours} credit hours</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {[
            { label: "Total Semesters",    value: roadmap.totalSemesters },
            { label: "Subjects Passed",    value: roadmap.passedSubjects },
            { label: "Currently Enrolled", value: roadmap.currentlyEnrolled },
            { label: "GPA",                value: roadmap.currentGpa?.toFixed(2) ?? "—" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-bold text-slate-800">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Must retake alert */}
      {roadmap.mustRetake?.length > 0 && (
        <div className="rounded-2xl bg-red-50 p-5 ring-1 ring-red-200 space-y-3">
          <p className="text-sm font-bold text-red-700">Must Retake ({roadmap.mustRetake.length} required subjects)</p>
          <div className="space-y-2">
            {roadmap.mustRetake.map((s) => (
              <div key={s.subjectId} className="flex items-center gap-2 text-sm text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                {s.subjectName} ({s.subjectCode})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended next */}
      {roadmap.recommendedNext?.length > 0 && (
        <div className="rounded-2xl bg-blue-50 p-5 ring-1 ring-blue-200 space-y-3">
          <p className="text-sm font-bold text-blue-700">Recommended Next Semester ({roadmap.recommendedNext.length} subjects)</p>
          <div className="space-y-2">
            {roadmap.recommendedNext.map((s) => (
              <div key={s.subjectId} className="flex items-center gap-2 text-sm text-blue-700">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                {s.subjectName} ({s.subjectCode}) · {s.creditHours} cr
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Semesters */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">All Semesters</h2>
        {roadmap.semesters.map((sem) => (
          <SemesterCard key={sem.semesterNumber} semester={sem} />
        ))}
      </div>
    </div>
  );
}

export default StudentRoadmapPage;
