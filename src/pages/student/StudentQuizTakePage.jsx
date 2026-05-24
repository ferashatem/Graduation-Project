import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HiArrowLeft, HiClock } from "react-icons/hi";
import { fetchExamSession, saveExamProgress, submitExam } from "../../api/examsApi";
import { recordProctoringEvent } from "../../api/proctoringApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// ── Countdown ─────────────────────────────────────────────────────────────────
function useCountdown(endEpochMs) {
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    if (!endEpochMs) return;
    const tick = () => setRemaining(Math.max(0, endEpochMs - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endEpochMs]);

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
    <div className={`flex items-center gap-2 rounded-2xl px-4 py-2 font-mono text-sm font-semibold ${
      urgent ? "bg-red-100 text-red-700 animate-pulse" : "bg-slate-100 text-slate-700"
    }`}>
      <HiClock className="h-4 w-4" />
      {h > 0 ? `${pad(h)}:` : ""}{pad(m)}:{pad(s)}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function StudentQuizTakePage() {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [session,     setSession]    = useState(null);
  const [questions,   setQuestions]  = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [error,       setError]      = useState("");
  const [answers,     setAnswers]    = useState({});
  const [submitting,  setSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  // endEpochMs = Date.now() + secondsRemaining * 1000 (set once on load)
  const [endEpochMs, setEndEpochMs] = useState(null);
  const remaining = useCountdown(endEpochMs);

  // Proctoring: tab-switch / blur events
  useEffect(() => {
    if (!session) return;
    const send = (type, details = "") =>
      recordProctoringEvent({ examId: quizId, eventType: type, details }).catch(() => {});
    const onVisibility = () => { if (document.hidden) send("TabSwitch", "Tab hidden"); };
    const onBlur = () => send("WindowBlur", "Window lost focus");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [session, quizId]);

  // Load session from backend
  useEffect(() => {
    setLoading(true);
    fetchExamSession(quizId)
      .then((data) => {
        if (!data) { setError("Exam not found."); return; }

        // Already submitted → go straight to results
        if (data.isSubmitted) {
          navigate(`/student/quizzes/${quizId}/result`, { replace: true });
          return;
        }

        setSession(data);
        setQuestions(data.questions ?? []);

        // Restore draft answers  (answerText is the actual text, not index)
        if (data.draftAnswers?.length) {
          const saved = {};
          data.draftAnswers.forEach((a) => { saved[a.questionId] = a.answerText ?? ""; });
          setAnswers(saved);
        }

        // Calculate end time from secondsRemaining (more accurate than endTime string)
        if (data.secondsRemaining != null) {
          setEndEpochMs(Date.now() + data.secondsRemaining * 1000);
        } else if (data.endTime) {
          setEndEpochMs(new Date(data.endTime).getTime());
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [quizId, navigate]);

  // Auto-save every 30 s
  useEffect(() => {
    if (!session || questions.length === 0) return;
    const save = () => {
      const list = questions.map((q) => ({ questionId: q.id, answerText: answers[q.id] ?? "" }));
      saveExamProgress(quizId, list).catch(() => {});
    };
    const t = setInterval(save, 30_000);
    return () => clearInterval(t);
  }, [session, questions, answers, quizId]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (submitting) return;
    if (!auto && !window.confirm("Submit your exam? You cannot change answers after submission.")) return;
    setSubmitting(true);
    try {
      const answerList = questions.map((q) => ({
        questionId: q.id,
        answerText: answers[q.id] ?? "",
      }));
      await submitExam(quizId, answerList);
      navigate(`/student/quizzes/${quizId}/result`, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  }, [questions, answers, quizId, submitting, navigate]);

  // Auto-submit when timer hits zero
  useEffect(() => {
    if (remaining === 0 && session && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleSubmit(true);
    }
  }, [remaining, session, handleSubmit]);

  const answeredCount  = useMemo(() => Object.values(answers).filter(Boolean).length, [answers]);
  const totalQuestions = questions.length;

  if (loading) return <div className="py-12 text-center text-sm text-slate-500">Loading exam…</div>;
  if (error)   return <div className="rounded-2xl bg-red-50 p-6 text-sm text-red-700">{error}</div>;
  if (!session) return null;

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
            <h1 className="text-base font-semibold text-slate-800">{session.title}</h1>
            <p className="text-xs text-slate-500">{answeredCount}/{totalQuestions} answered</p>
          </div>
        </div>
        <CountdownDisplay ms={remaining} />
      </div>

      {/* Instructions */}
      {session.instructions && (
        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-sm text-blue-700 ring-1 ring-blue-200">
          {session.instructions}
        </div>
      )}

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const qType = q.questionType ?? q.type ?? 0;
          const isEssay = qType === 2 || qType === "Essay";
          const isTF    = qType === 1 || qType === "TrueFalse";
          const opts    = isTF ? ["True", "False"] : (q.options ?? []);

          if (isEssay) {
            return (
              <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                    {q.questionText ?? q.text}
                  </p>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    {q.mark ?? q.marks ?? 0} pt
                  </span>
                </div>
                <textarea rows={4} placeholder="Write your answer here…"
                  value={answers[q.id] ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-300 resize-none" />
              </div>
            );
          }

          return (
            <div key={q.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-800">
                  <span className="mr-2 text-xs font-semibold text-slate-400">Q{idx + 1}.</span>
                  {q.questionText ?? q.text}
                </p>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {q.mark ?? q.marks ?? 0} pt
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {opts.map((opt, i) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <label key={i}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
                        selected
                          ? "border-[#0b2c4a] bg-[#0b2c4a]/5 ring-1 ring-[#0b2c4a]/20"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                      }`}>
                      <input type="radio" name={`q-${q.id}`} value={opt}
                        checked={selected}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className="accent-[#0b2c4a]" />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit bar */}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="text-sm text-slate-500">
          {totalQuestions - answeredCount > 0
            ? `${totalQuestions - answeredCount} question(s) unanswered`
            : "All questions answered!"}
        </p>
        <button type="button" disabled={submitting} onClick={() => handleSubmit(false)}
          className="rounded-2xl bg-[#0b2c4a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a63] disabled:opacity-50">
          {submitting ? "Submitting…" : "Submit Exam"}
        </button>
      </div>
    </div>
  );
}

export default StudentQuizTakePage;
