import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiBookOpen, HiClock, HiQuestionMarkCircle } from "react-icons/hi";
import apiClient from "../../api/apiClient";

const parseDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const fmtWhen = (d) => {
  if (!d) return "";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

// Derive the UI state from a single exam object
function examState(exam) {
  const now       = Date.now();
  const startDate = parseDate(exam.startTime);
  const endDate   = parseDate(exam.endTime);
  const notStarted = startDate && now < startDate.getTime();
  const ended      = endDate   && now > endDate.getTime();
  const isPublished = exam.status === 1 || exam.status === "Published";
  const isClosed    = exam.status === 2 || exam.status === "Closed";

  if (exam.hasSubmitted && exam.isGraded)   return "completed";
  if (exam.hasSubmitted && !exam.isGraded)  return "pending";
  if (!exam.hasSubmitted && ended)          return "missed";
  if (!exam.hasSubmitted && notStarted)     return "upcoming";
  if (!exam.hasSubmitted && isPublished && !ended) return "available";
  if (isClosed)                             return "closed";
  return "draft";
}

const STATE_BADGE = {
  completed: <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Completed</span>,
  pending:   <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Pending Grading</span>,
  missed:    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">Missed</span>,
  upcoming:  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">Not Started Yet</span>,
  available: <span className="rounded-full bg-[#0b2c4a]/10 px-3 py-1 text-xs font-semibold text-[#0b2c4a]">Available</span>,
  closed:    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Closed</span>,
  draft:     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">Not Published</span>,
};

function ExamCard({ exam }) {
  const state      = examState(exam);
  const startDate  = parseDate(exam.startTime);
  const endDate    = parseDate(exam.endTime);
  const canTake    = state === "available";
  const showResult = state === "completed" || state === "pending";

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">{exam.title}</h3>
        {STATE_BADGE[state]}
      </div>

      {exam.subjectName && (
        <p className="text-xs text-slate-500">{exam.subjectName}</p>
      )}

      {(startDate || endDate) && (
        <p className="text-xs text-slate-500">
          {state === "upcoming"
            ? `Starts at ${fmtWhen(startDate)}`
            : state === "missed"
              ? `Ended at ${fmtWhen(endDate)}`
              : `${fmtWhen(startDate)} → ${fmtWhen(endDate)}`}
        </p>
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
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{exam.totalMarks} marks</span>
        )}
      </div>

      <div className="pt-1">
        {showResult ? (
          <Link to={`/student/quizzes/${exam.id}/result`}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {state === "pending" ? "View Submission" : "View Result"}
          </Link>
        ) : canTake ? (
          <Link to={`/student/quizzes/${exam.id}`}
            className="inline-block rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#153a63]">
            Enter Exam
          </Link>
        ) : (
          <span className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
            {state === "missed" ? "Exam Missed"
              : state === "upcoming" ? `Opens at ${fmtWhen(startDate)}`
              : state === "closed" ? "Exam Closed"
              : "Not Available"}
          </span>
        )}
      </div>
    </article>
  );
}

function StudentQuizzesPage() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    setLoading(true);
    apiClient.get("/exams/my-enrolled-exams")
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setExams(Array.isArray(payload) ? payload : payload?.items ?? []);
      })
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? "Failed to load exams."))
      .finally(() => setLoading(false));
  }, []);

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
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentQuizzesPage;
