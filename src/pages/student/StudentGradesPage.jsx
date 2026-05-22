import { useEffect, useState } from "react";
import { HiAcademicCap, HiBookOpen } from "react-icons/hi";
import { fetchMyGrades } from "../../api/gradesApi";
import { fetchMyGpa } from "../../api/gradesApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const GRADE_COLORS = {
  A: "bg-emerald-100 text-emerald-700",
  B: "bg-blue-100 text-blue-700",
  C: "bg-amber-100 text-amber-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
};

function GradeBadge({ letter }) {
  const first = (letter ?? "")[0]?.toUpperCase() ?? "";
  const cls   = GRADE_COLORS[first] ?? "bg-slate-100 text-slate-600";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${cls}`}>
      {letter ?? "—"}
    </span>
  );
}

function StudentGradesPage() {
  const [grades,  setGrades]  = useState([]);
  const [gpa,     setGpa]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchMyGrades(), fetchMyGpa()])
      .then(([g, gpaData]) => {
        setGrades(g);
        setGpa(gpaData);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading grades…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0b2c4a]">My Grades</h1>

      {error && <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* GPA card */}
      {gpa && (
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px] rounded-2xl bg-[#0b2c4a] p-5 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <HiAcademicCap className="h-5 w-5 opacity-70" />
              <span className="text-xs font-semibold uppercase tracking-wide opacity-70">Cumulative GPA</span>
            </div>
            <p className="text-4xl font-bold">{(gpa.gpa ?? gpa.cumulativeGpa ?? 0).toFixed(2)}</p>
            {gpa.totalCreditHours != null && (
              <p className="mt-1 text-xs opacity-60">{gpa.totalCreditHours} credit hours · {gpa.totalSubjects ?? grades.length} subjects</p>
            )}
          </div>
        </div>
      )}

      {/* Grades table */}
      {grades.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          No finalized grades yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-5 py-3 text-left">Subject</th>
                <th className="px-5 py-3 text-center">Score</th>
                <th className="px-5 py-3 text-center">Grade</th>
                <th className="px-5 py-3 text-center">Points</th>
                <th className="px-5 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, i) => (
                <tr key={g.id ?? i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{g.subjectName ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center text-slate-700">
                    {g.finalScore != null ? g.finalScore.toFixed(1) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <GradeBadge letter={g.gradeLetter} />
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-700">
                    {g.gradePoints != null ? g.gradePoints.toFixed(1) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {g.isFinalized ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">Finalized</span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-600">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default StudentGradesPage;
