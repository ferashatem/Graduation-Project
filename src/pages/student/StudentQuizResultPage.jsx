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
        const examData = examRes.data?.data ?? examRes.data;
        const subData  = subRes.data?.data  ?? subRes.data ?? null;
        setExam(examData);
        setSubmission(subData);
      })
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? "Failed to load result."))
      .finally(() => setLoading(false));
  }, [quizId]);

  // Build a map: questionId → { answerText, isCorrect, earnedMarks }
  const answerMap = useMemo(() => {
    if (!submission) return {};
    const m = {};
    (submission.answers ?? submission.submissionAnswers ?? []).forEach((a) => {
      m[a.questionId] = {
        text:      a.answerText ?? a.answer ?? a.selectedAnswer ?? "—",
        isCorrect: a.isCorrect  ?? null,
        earned:    a.earnedMarks ?? a.score ?? null,
      };
    });
    return m;
  }, [submission]);

  const isGraded   = submission?.isGraded ?? true;
  const score      = submission?.totalScore    ?? submission?.score        ?? submission?.totalGrade ?? null;
  const totalMarks = exam?.totalMarks          ?? submission?.totalMarks   ?? submission?.totalPoints ?? null;
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

      {!isGraded && (
        <div className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-700 ring-1 ring-blue-200">
          Your exam has been submitted. Results will be available once the doctor finishes grading the essay questions.
        </div>
      )}

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
            const ans       = answerMap[q.id] ?? { text: "—", isCorrect: null, earned: null };
            // isCorrect: true=correct, false=wrong, null=essay/pending
            const isCorrect = ans.isCorrect;
            const isPending = isCorrect === null;
            const bgClass   = isPending
              ? "bg-slate-50 ring-slate-200"
              : isCorrect
                ? "bg-emerald-50 ring-emerald-200"
                : "bg-red-50 ring-red-200";
            return (
              <div key={q.id} className={`rounded-2xl p-4 space-y-2 ring-1 ${bgClass}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                    {q.questionText ?? q.text}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {ans.earned != null && (
                      <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                        {ans.earned}/{q.mark ?? q.marks ?? "?"}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPending
                        ? "bg-slate-100 text-slate-500"
                        : isCorrect
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-red-100 text-red-600"
                    }`}>
                      {isPending ? "Pending" : isCorrect ? "✓ Correct" : "✗ Wrong"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-xs">
                  <span>
                    <span className="font-semibold text-slate-500">Your answer: </span>
                    <span className={`font-semibold ${
                      isPending ? "text-slate-700" : isCorrect ? "text-emerald-700" : "text-red-600"
                    }`}>{ans.text}</span>
                  </span>
                  {isCorrect === false && (q.correctAnswer ?? q.answer) && (
                    <span>
                      <span className="font-semibold text-slate-500">Correct: </span>
                      <span className="font-semibold text-emerald-700">{q.correctAnswer ?? q.answer}</span>
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
