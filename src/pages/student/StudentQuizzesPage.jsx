import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { collection, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { HiBookOpen, HiClock, HiQuestionMarkCircle } from "react-icons/hi";
import { db } from "../../firebase/firebaseConfig";

const fmtDate = (ts) => {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts.seconds * 1000);
  return d.toLocaleString();
};

function StatusBadge({ submitted, score, totalPoints, percentage, now, startTime }) {
  if (submitted) {
    return (
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        Submitted · {score}/{totalPoints} ({percentage}%)
      </span>
    );
  }
  if (startTime && now < startTime) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Not started yet</span>;
  }
  return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Available</span>;
}

function QuizCard({ quiz, submission, now }) {
  const startTime = quiz.startTime?.toDate ? quiz.startTime.toDate() : quiz.startTime ? new Date(quiz.startTime.seconds * 1000) : null;
  const submitted = Boolean(submission);
  const canTake = !submitted && startTime && now >= startTime;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-800">{quiz.title}</h3>
        <StatusBadge
          submitted={submitted}
          score={submission?.score}
          totalPoints={submission?.totalPoints}
          percentage={submission?.percentage}
          now={now}
          startTime={startTime}
        />
      </div>
      {quiz.description ? <p className="text-sm text-slate-500 line-clamp-2">{quiz.description}</p> : null}
      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <HiQuestionMarkCircle className="h-3.5 w-3.5" /> {quiz.questions?.length || 0} questions
        </span>
        <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <HiClock className="h-3.5 w-3.5" /> {quiz.durationMinutes} min
        </span>
        {startTime && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1">{fmtDate(quiz.startTime)}</span>
        )}
      </div>
      <div className="pt-1">
        {submitted ? (
          <Link to={`/student/quizzes/${quiz.id}/result`}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            View My Result
          </Link>
        ) : (
          <Link
            to={canTake ? `/student/quizzes/${quiz.id}` : "#"}
            className={`inline-block rounded-xl px-4 py-2 text-xs font-semibold transition ${canTake
              ? "bg-[#0b2c4a] text-white hover:bg-[#153a63]"
              : "border border-slate-200 text-slate-400 cursor-not-allowed pointer-events-none"}`}
            aria-disabled={!canTake}
          >
            {startTime && now < startTime ? "Not available yet" : "Take Quiz"}
          </Link>
        )}
      </div>
    </article>
  );
}

function StudentQuizzesPage() {
  const { user, profile, profileLoading } = useOutletContext() || {};
  const [quizzes, setQuizzes] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  const collegeId = profile?.collegeId || "";
  const yearId = profile?.yearId || "";
  const departmentId = profile?.departmentId || "";
  const canQuery = Boolean(collegeId) && Boolean(yearId) && Boolean(departmentId) && !profileLoading;

  // Refresh "now" every 30s for live status
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Load quizzes matching student's college/year/dept
  useEffect(() => {
    if (!canQuery) { setQuizzes([]); setLoading(false); return; }
    setLoading(true);
    const q = query(
      collection(db, "quizzes"),
      where("collegeId", "==", collegeId),
      where("yearId", "==", yearId),
      where("departmentId", "==", departmentId),
      where("isPublished", "==", true),
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      items.sort((a, b) => (b.startTime?.seconds ?? 0) - (a.startTime?.seconds ?? 0));
      setQuizzes(items);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [canQuery, collegeId, yearId, departmentId]);

  // Load student's submissions
  useEffect(() => {
    if (!user?.uid) return;
    getDocs(query(collection(db, "quizSubmissions"), where("studentUid", "==", user.uid)))
      .then((snap) => setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => {});
  }, [user?.uid]);

  const submissionMap = useMemo(() => {
    const m = {};
    submissions.forEach((s) => { m[s.quizId] = s; });
    return m;
  }, [submissions]);

  if (profileLoading) return <div className="py-12 text-center text-sm text-slate-500">Loading your profile…</div>;

  if (!canQuery) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-[#0b2c4a]">Available Quizzes</h1>
        <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-700 ring-1 ring-amber-200">
          Your profile is missing college/year/department. Contact your administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[#0b2c4a]">Available Quizzes</h1>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading quizzes…</div>
      ) : quizzes.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          <HiBookOpen className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          No quizzes available for your class right now.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} submission={submissionMap[quiz.id] || null} now={now} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentQuizzesPage;
