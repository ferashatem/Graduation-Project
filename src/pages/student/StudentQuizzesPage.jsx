import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiBookOpen, HiClock, HiQuestionMarkCircle } from "react-icons/hi";
import apiClient from "../../api/apiClient";

// Exam status: 0=Draft, 1=Published, 2=Closed
const STATUS_PUBLISHED = 1;
const STATUS_CLOSED    = 2;

function StatusBadge({ exam, submission }) {
  if (submission) {
    const pct = submission.percentage ?? submission.score ?? null;
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Submitted{pct != null ? ` · ${pct}%` : ""}
      </span>
    );
  }
  if (exam.status === STATUS_CLOSED) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Closed</span>;
  }
  if (exam.status === STATUS_PUBLISHED) {
    return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Available</span>;
  }
  return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600">Not published</span>;
}

function ExamCard({ exam, submission }) {
  const canTake = exam.status === STATUS_PUBLISHED && !submission;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">{exam.title}</h3>
        <StatusBadge exam={exam} submission={submission} />
      </div>

      {exam.subjectName && (
        <p className="text-xs text-slate-500">{exam.subjectName}</p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {exam.questions?.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <HiQuestionMarkCircle className="h-3.5 w-3.5" />
            {exam.questions.length} questions
          </span>
        )}
        {exam.durationMinutes && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <HiClock className="h-3.5 w-3.5" />
            {exam.durationMinutes} min
          </span>
        )}
        {exam.totalMarks && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">
            {exam.totalMarks} marks
          </span>
        )}
      </div>

      <div className="pt-1">
        {submission ? (
          <Link
            to={`/student/quizzes/${exam.id}/result`}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            View My Result
          </Link>
        ) : (
          <Link
            to={canTake ? `/student/quizzes/${exam.id}` : "#"}
            aria-disabled={!canTake}
            className={`inline-block rounded-xl px-4 py-2 text-xs font-semibold transition ${
              canTake
                ? "bg-[#0b2c4a] text-white hover:bg-[#153a63]"
                : "border border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"
            }`}
          >
            {exam.status === STATUS_CLOSED ? "Exam Closed" : "Take Exam"}
          </Link>
        )}
      </div>
    </article>
  );
}

function StudentQuizzesPage() {
  const [exams,    setExams]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    setLoading(true);
    apiClient.get("/exams/my-enrolled-exams")
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        const items   = Array.isArray(payload) ? payload : payload?.items ?? [];
        setExams(items);
      })
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? "Failed to load exams."))
      .finally(() => setLoading(false));
  }, []);

  // Group submissions by examId from each exam's mySubmission field if present
  const submissionMap = useMemo(() => {
    const m = {};
    exams.forEach((ex) => {
      if (ex.mySubmission) m[ex.id] = ex.mySubmission;
    });
    return m;
  }, [exams]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0b2c4a]">Available Exams</h1>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading exams…</div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          No exams available right now.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              submission={submissionMap[exam.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentQuizzesPage;
