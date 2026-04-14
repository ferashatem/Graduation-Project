import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { calculateResult } from "../../lib/quizUtils";
import { HiArrowLeft, HiClock } from "react-icons/hi";
import { db } from "../../firebase/firebaseConfig";

// ─── Countdown ────────────────────────────────────────────────────────────────
function useCountdown(endTime) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!endTime) return;
    const tick = () => {
      const diff = Math.max(0, endTime - Date.now());
      setRemaining(diff);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  return remaining;
}

function CountdownDisplay({ ms }) {
  if (ms === null) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, "0");
  const urgent = ms < 60000;
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-mono text-sm font-semibold ${urgent ? "bg-red-100 text-red-700 animate-pulse" : "bg-slate-100 text-slate-700"}`}>
      <HiClock className="h-4 w-4" />
      {h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
function StudentQuizTakePage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useOutletContext() || {};

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({}); // questionId → selectedAnswer
  const [submitting, setSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  const endTime = useMemo(() => {
    if (!quiz) return null;
    const start = quiz.startTime?.toDate ? quiz.startTime.toDate() : new Date(quiz.startTime.seconds * 1000);
    return start.getTime() + quiz.durationMinutes * 60 * 1000;
  }, [quiz]);

  const remaining = useCountdown(endTime);

  // Load quiz + check existing submission
  useEffect(() => {
    if (!user?.uid || !quizId) return;
    let active = true;
    setLoading(true);
    Promise.all([
      getDoc(doc(db, "quizzes", quizId)),
      getDocs(query(collection(db, "quizSubmissions"), where("quizId", "==", quizId), where("studentUid", "==", user.uid))),
    ]).then(([quizSnap, subSnap]) => {
      if (!active) return;
      if (!quizSnap.exists()) { setError("Quiz not found."); setLoading(false); return; }
      const quizData = { id: quizSnap.id, ...quizSnap.data() };
      if (!quizData.isPublished) { setError("This quiz is not available."); setLoading(false); return; }
      setQuiz(quizData);
      if (!subSnap.empty) {
        setAlreadySubmitted(true);
        navigate(`/student/quizzes/${quizId}/result`, { replace: true });
      }
      setLoading(false);
    }).catch((e) => { if (active) { setError(e.message || "Failed to load."); setLoading(false); } });
    return () => { active = false; };
  }, [quizId, user?.uid, navigate]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting || alreadySubmitted) return;
    if (!auto && !window.confirm("Submit your quiz? You cannot change answers after submission.")) return;
    setSubmitting(true);
    try {
      const questions = quiz.questions || [];
      const answerList = questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: answers[q.id] || "",
      }));

      const { score, totalPoints, percentage, wrongQuestions } = calculateResult(questions, answerList);
      const studentName =
        profile?.fullName || profile?.name || user?.displayName || user?.email || "Student";

      await addDoc(collection(db, "quizSubmissions"), {
        quizId,
        studentUid: user.uid,
        studentName,
        answers: answerList,
        score,
        totalPoints,
        percentage,
        wrongQuestions,
        submittedAt: serverTimestamp(),
      });
      navigate(`/student/quizzes/${quizId}/result`, { replace: true });
    } catch (e) {
      setError(e.message || "Submission failed. Try again.");
      setSubmitting(false);
    }
  }, [quiz, answers, quizId, user, profile, submitting, alreadySubmitted, navigate]);

  // Auto-submit when timer hits zero
  useEffect(() => {
    if (remaining === 0 && quiz && !autoSubmittedRef.current && !alreadySubmitted) {
      autoSubmittedRef.current = true;
      handleSubmit(true);
    }
  }, [remaining, quiz, alreadySubmitted, handleSubmit]);

  const answeredCount = useMemo(() =>
    Object.values(answers).filter(Boolean).length, [answers]);
  const totalQuestions = quiz?.questions?.length ?? 0;

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading quiz…</div>;
  if (error) return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!quiz) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/student/quizzes")}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100">
            <HiArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-slate-800">{quiz.title}</h1>
            <p className="text-xs text-slate-500">{answeredCount}/{totalQuestions} answered</p>
          </div>
        </div>
        <CountdownDisplay ms={remaining} />
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions.map((q, idx) => (
          <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-slate-800">
                <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                {q.text}
              </p>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                {q.points} pt{q.points !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {q.options.map((opt, i) => {
                const selected = answers[q.id] === opt;
                return (
                  <label key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${selected ? "border-[#0b2c4a] bg-[#0b2c4a]/5 ring-1 ring-[#0b2c4a]/20" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      value={opt}
                      checked={selected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                      className="accent-[#0b2c4a]"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          {totalQuestions - answeredCount > 0
            ? `${totalQuestions - answeredCount} question(s) unanswered`
            : "All questions answered!"}
        </p>
        <button type="button" disabled={submitting} onClick={() => handleSubmit(false)}
          className="rounded-2xl bg-[#0b2c4a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a63] disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit Quiz"}
        </button>
      </div>
    </div>
  );
}

export default StudentQuizTakePage;
