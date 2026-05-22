import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiArrowLeft, HiCheckCircle, HiXCircle } from "react-icons/hi";
import apiClient from "../../api/apiClient";

function StudentQuizResultPage() {
  const { quizId } = useParams();

  const [exam,       setExam]       = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/exams/${quizId}`),
      apiClient.get(`/exams/${quizId}/my-submission`),
    ])
      .then(([examRes, subRes]) => {
        setExam(subRes.data?.data ?? subRes.data ? (examRes.data?.data ?? examRes.data) : null);
        setSubmission(subRes.data?.data ?? subRes.data ?? null);
      })
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? "Failed to load result."))
      .finally(() => setLoading(false));
  }, [quizId]);

  const answerMap = useMemo(() => {
    if (!submission) return {};
    const m = {};
    (submission.answers ?? []).forEach((a) => {
      m[a.questionId] = a.answer ?? a.selectedAnswer ?? "";
    });
    return m;
  }, [submission]);

  const score      = submission?.score         ?? submission?.totalGrade   ?? null;
  const totalMarks = submission?.totalMarks    ?? submission?.totalPoints  ?? null;
  const percentage = submission?.percentage    ?? (score != null && totalMarks ? Math.round((score / totalMarks) * 100) : null);
  const passed     = percentage != null ? percentage >= 50 : null;

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading result…</div>;
  if (error)   return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!submission) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-700 ring-1 ring-amber-200">
        No submission found for this exam.{" "}
        <Link to={`/student/quizzes/${quizId}`} className="font-semibold underline">Take the exam</Link>
      </div>
    );
  }

  const questions = exam?.questions ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/student/quizzes"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        <HiArrowLeft className="h-4 w-4" /> Back to Exams
      </Link>

      {/* Score card */}
      <div className={`rounded-2xl p-6 text-center shadow-sm ring-1 ${passed === false ? "bg-red-50 ring-red-200" : "bg-emerald-50 ring-emerald-200"}`}>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{exam?.title}</p>
        <div className="mt-3 text-6xl font-bold text-[#0b2c4a]">
          {score ?? "—"}
          {totalMarks != null && <span className="text-3xl text-slate-400">/{totalMarks}</span>}
        </div>
        {percentage != null && (
          <div className={`mt-2 text-2xl font-semibold ${passed === false ? "text-red-600" : "text-emerald-600"}`}>
            {percentage}%
          </div>
        )}
        {passed != null && (
          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {passed ? <HiCheckCircle className="h-5 w-5" /> : <HiXCircle className="h-5 w-5" />}
            {passed ? "Passed" : "Failed"}
          </div>
        )}
      </div>

      {/* Question breakdown */}
      {questions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Question Breakdown</h2>
          {questions.map((q, idx) => {
            const selected  = answerMap[q.id] || "—";
            const wrongList = submission?.wrongQuestions ?? [];
            const isWrong   = wrongList.includes(q.id);
            return (
              <div key={q.id}
                className={`rounded-2xl p-4 space-y-2 ring-1 ${isWrong ? "bg-red-50 ring-red-200" : "bg-emerald-50 ring-emerald-200"}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                    {q.text}
                  </p>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isWrong ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}>
                    {isWrong ? "✗ Wrong" : "✓ Correct"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <span>
                    <span className="font-semibold text-slate-500">Your answer: </span>
                    <span className={`font-semibold ${isWrong ? "text-red-600" : "text-emerald-700"}`}>{selected}</span>
                  </span>
                  {isWrong && q.correctAnswer && (
                    <span>
                      <span className="font-semibold text-slate-500">Correct: </span>
                      <span className="font-semibold text-emerald-700">{q.correctAnswer}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default StudentQuizResultPage;
