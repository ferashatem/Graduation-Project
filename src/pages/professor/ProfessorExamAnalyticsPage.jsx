import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiChartBar, HiCheck, HiX } from "react-icons/hi";
import { fetchExamAnalytics } from "../../api/examsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function StatCard({ label, value, sub, color = "text-slate-800" }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value ?? "—"}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function ProfessorExamAnalyticsPage() {
  const { examId } = useParams();
  const navigate   = useNavigate();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    fetchExamAnalytics(examId)
      .then(setData)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading analytics…</div>;
  if (error)   return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!data)   return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)}
          className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
          <HiArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[#0b2c4a]">{data.examTitle}</h1>
          <p className="text-sm text-slate-500">Exam Analytics</p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Enrolled"   value={data.totalEnrolled}   />
        <StatCard label="Submitted"  value={data.totalSubmitted}  />
        <StatCard label="Graded"     value={data.totalGraded}     />
        <StatCard label="Passed"     value={data.totalPassed}     color="text-emerald-600" />
        <StatCard label="Failed"     value={data.totalFailed}     color="text-red-600" />
        <StatCard label="Pass Rate"  value={data.passRate != null ? `${data.passRate.toFixed(1)}%` : "—"} />
        <StatCard label="Avg Score"  value={data.averageScore  != null ? data.averageScore.toFixed(1)  : "—"} />
        <StatCard label="Highest"    value={data.highestScore}    color="text-blue-600" />
        <StatCard label="Lowest"     value={data.lowestScore}     color="text-orange-600" />
      </div>

      {/* Question stats */}
      {data.questionStats?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-slate-700 flex items-center gap-2">
            <HiChartBar className="h-5 w-5 text-slate-400" />
            Question Performance
          </h2>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 text-left">#</th>
                  <th className="px-5 py-3 text-left">Question</th>
                  <th className="px-5 py-3 text-center">Answered</th>
                  <th className="px-5 py-3 text-center">Correct</th>
                  <th className="px-5 py-3 text-center">Correct Rate</th>
                </tr>
              </thead>
              <tbody>
                {data.questionStats.map((qs, i) => {
                  const rate = qs.correctRate ?? 0;
                  return (
                    <tr key={qs.questionId ?? i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">{i + 1}</td>
                      <td className="px-5 py-3.5 text-slate-700 max-w-xs truncate">
                        {qs.questionText ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center text-slate-600">{qs.totalAnswered}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <HiCheck className="h-3.5 w-3.5" />{qs.totalCorrect}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-emerald-400"
                              style={{ width: `${Math.min(rate, 100)}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${rate >= 70 ? "text-emerald-600" : rate >= 40 ? "text-amber-600" : "text-red-600"}`}>
                            {rate.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfessorExamAnalyticsPage;
