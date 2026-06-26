import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiArrowLeft, HiChevronDown, HiChevronUp } from "react-icons/hi";
import {
  fetchExam,
  fetchExamResults,
} from "../../features/professor/api/professorBackendApi";

const pct = (score, total) =>
  total > 0 ? Math.round((score / total) * 100) : 0;
const fmtDate = (str) => {
  if (!str) return "—";
  try {
    return new Date(str).toLocaleString("en-US");
  } catch {
    return str;
  }
};

function DetailRow({ question, answer, isWrong }) {
  return (
    <div
      className={`rounded-xl p-3 ${isWrong ? "bg-red-50 ring-1 ring-red-200" : "bg-emerald-50 ring-1 ring-emerald-200"}`}
    >
      <p className="text-sm font-medium text-slate-700">{question.text}</p>
      <div className="mt-1.5 flex flex-wrap gap-4 text-xs">
        <span>
          <span className="font-semibold text-slate-500">Answer: </span>
          <span
            className={
              isWrong
                ? "font-semibold text-red-600"
                : "font-semibold text-emerald-600"
            }
          >
            {answer || "—"}
          </span>
        </span>
        {isWrong && (
          <span>
            <span className="font-semibold text-slate-500">Correct: </span>
            <span className="font-semibold text-emerald-700">
              {question.correctAnswer}
            </span>
          </span>
        )}
        <span
          className={`rounded-full px-2 py-0.5 font-semibold ${isWrong ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"}`}
        >
          {isWrong ? "✗ Wrong" : "✓ Correct"}
        </span>
      </div>
    </div>
  );
}

function SubmissionRow({ submission, questions }) {
  const [open, setOpen] = useState(false);

  const answerMap = useMemo(() => {
    const m = {};
    (submission.answers ?? []).forEach((a) => {
      m[a.questionId ?? a.id] = a.selectedAnswer ?? a.answer;
    });
    return m;
  }, [submission.answers]);

  const totalPoints =
    submission.totalPoints ??
    questions.reduce((s, q) => s + (q.points ?? 1), 0);
  const score = submission.score ?? submission.totalScore ?? 0;

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="px-4 py-3 font-medium text-slate-800">
          {submission.studentName ??
            submission.studentFullName ??
            submission.userName ??
            "—"}
        </td>
        <td className="px-4 py-3 text-slate-600">
          {score} / {totalPoints}
        </td>
        <td className="px-4 py-3">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pct(score, totalPoints) >= 50 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}
          >
            {pct(score, totalPoints)}%
          </span>
        </td>
        <td className="px-4 py-3 text-xs text-slate-500">
          {fmtDate(submission.submittedAt ?? submission.submittedOn)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {open ? (
              <HiChevronUp className="h-3.5 w-3.5" />
            ) : (
              <HiChevronDown className="h-3.5 w-3.5" />
            )}
            {open ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={5} className="px-6 py-4">
            <div className="space-y-2">
              {questions.map((q) => {
                const key = q.id ?? q.questionId;
                const studentAnswer = answerMap[key] ?? "—";
                const isWrong = studentAnswer !== q.correctAnswer;
                return (
                  <DetailRow
                    key={key}
                    question={q}
                    answer={studentAnswer}
                    isWrong={isWrong}
                  />
                );
              })}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function ProfessorQuizResultsPage() {
  const { quizId } = useParams();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quizId) return;
    let active = true;
    setLoading(true);
    setError("");

    Promise.all([fetchExam(quizId), fetchExamResults(quizId)])
      .then(([examData, resultsData]) => {
        if (!active) return;
        setExam(examData);
        setResults(resultsData);
      })
      .catch((e) => {
        if (active)
          setError(
            e?.response?.data?.message ??
              e?.message ??
              "Failed to load results.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [quizId]);

  // Results can be an object with a submissions array, or a direct array
  const submissions = useMemo(() => {
    if (!results) return [];
    if (Array.isArray(results)) return results;
    return results.submissions ?? results.items ?? [];
  }, [results]);

  const questions = useMemo(() => exam?.questions ?? [], [exam?.questions]);

  const stats = useMemo(() => {
    if (!submissions.length) return null;
    const totalPoints = questions.reduce((s, q) => s + (q.points ?? 1), 0);
    const pcts = submissions.map((s) =>
      pct(s.score ?? s.totalScore ?? 0, s.totalPoints ?? totalPoints),
    );
    const avg = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    return {
      total: submissions.length,
      avg,
      high: Math.max(...pcts),
      low: Math.min(...pcts),
    };
  }, [submissions, questions]);

  if (loading)
    return (
      <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
    );
  if (error)
    return (
      <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/prof/quizzes"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          <HiArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-[#0b2c4a]">
            {exam?.title ?? "Quiz"} — Results
          </h1>
          <p className="text-xs text-slate-500">
            {exam?.durationMinutes} min · {questions.length} questions
          </p>
        </div>
      </div>

      {stats ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Submissions", value: stats.total },
            { label: "Average", value: `${stats.avg}%` },
            { label: "Highest", value: `${stats.high}%` },
            { label: "Lowest", value: `${stats.low}%` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200"
            >
              <p className="text-2xl font-bold text-[#0b2c4a]">{s.value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No submissions yet.
        </div>
      )}

      {submissions.length > 0 && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <table className="min-w-full text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Score</th>
                <th className="px-4 py-3 text-left">Percentage</th>
                <th className="px-4 py-3 text-left">Submitted At</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <SubmissionRow
                  key={s.id ?? s.submissionId ?? i}
                  submission={s}
                  questions={questions}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default ProfessorQuizResultsPage;
