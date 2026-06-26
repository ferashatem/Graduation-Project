import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

// STATE_BADGE built inside ExamCard using t()

function ExamCard({ exam }) {
  const { t } = useTranslation();
  const state      = examState(exam);
  const startDate  = parseDate(exam.startTime);
  const endDate    = parseDate(exam.endTime);
  const canTake    = state === "available";
  const showResult = state === "completed" || state === "pending";

  const STATE_BADGE = {
    completed: <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">{t("studentQuizzes.completed")}</span>,
    pending:   <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{t("studentQuizzes.pendingGrading")}</span>,
    missed:    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">{t("studentQuizzes.missed")}</span>,
    upcoming:  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{t("studentQuizzes.upcoming")}</span>,
    available: <span className="rounded-full bg-[#0b2c4a]/10 px-3 py-1 text-xs font-semibold text-[#0b2c4a]">{t("studentQuizzes.available")}</span>,
    closed:    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">{t("studentQuizzes.closed")}</span>,
    draft:     <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-400">{t("studentQuizzes.draft")}</span>,
  };

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
            ? t("studentQuizzes.startsAt", { time: fmtWhen(startDate) })
            : state === "missed"
              ? t("studentQuizzes.endedAt", { time: fmtWhen(endDate) })
              : `${fmtWhen(startDate)} → ${fmtWhen(endDate)}`}
        </p>
      )}

      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        {(exam.questionCount > 0 || exam.questions?.length > 0) && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <HiQuestionMarkCircle className="h-3.5 w-3.5" />
            {t("studentQuizzes.questions", { count: exam.questionCount || exam.questions.length })}
          </span>
        )}
        {exam.durationMinutes && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
            <HiClock className="h-3.5 w-3.5" />
            {t("studentQuizzes.min", { n: exam.durationMinutes })}
          </span>
        )}
        {exam.totalMarks && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{t("studentQuizzes.marks", { n: exam.totalMarks })}</span>
        )}
      </div>

      <div className="pt-1">
        {showResult ? (
          <Link to={`/student/quizzes/${exam.id}/result`}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {state === "pending" ? t("studentQuizzes.viewSubmission") : t("studentQuizzes.viewResult")}
          </Link>
        ) : canTake ? (
          <Link to={`/student/quizzes/${exam.id}`}
            className="inline-block rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#153a63]">
            {t("studentQuizzes.enterExam")}
          </Link>
        ) : (
          <span className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400 cursor-not-allowed">
            {state === "missed" ? t("studentQuizzes.examMissed")
              : state === "upcoming" ? t("studentQuizzes.opensAt", { time: fmtWhen(startDate) })
              : state === "closed" ? t("studentQuizzes.examClosed")
              : t("studentQuizzes.notAvailable")}
          </span>
        )}
      </div>
    </article>
  );
}

function StudentQuizzesPage() {
  const { t } = useTranslation();
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
      .catch((e) => setError(e?.response?.data?.message ?? e?.message ?? t("studentQuizzes.failed")))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0b2c4a]">{t("studentQuizzes.title")}</h1>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">{t("studentQuizzes.loading")}</div>
      ) : exams.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          {t("studentQuizzes.noExams")}
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
