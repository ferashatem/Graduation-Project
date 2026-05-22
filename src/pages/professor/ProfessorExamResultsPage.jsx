import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiArrowLeft, HiCheckCircle, HiClock, HiPencil, HiRefresh, HiUser } from "react-icons/hi";
import { fetchExamById, fetchExamResults, gradeSubmission } from "../../api/examsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const fmtDate = (s) => { try { return new Date(s).toLocaleString(); } catch { return s ?? "—"; } };

// ── GradeEssayModal ───────────────────────────────────────────────────────────
function GradeEssayModal({ submission, open, onClose, onGraded }) {
  const [score, setScore]     = useState("");
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (open) { setScore(""); setError(""); }
  }, [open]);

  const handleSave = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0) return setError("Enter a valid score.");
    setSaving(true); setError("");
    try {
      await gradeSubmission({ submissionId: submission.id, score: s });
      onGraded(submission.id, s);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open || !submission) return null;

  // Parse answers
  let answers = [];
  try { answers = typeof submission.answersJson === "string"
    ? JSON.parse(submission.answersJson)
    : (submission.answers ?? []); } catch { answers = []; }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl space-y-4 p-6"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Grade Submission</h3>
          <p className="text-xs text-slate-500">{submission.studentName}</p>
        </div>

        {/* Answers preview */}
        {answers.length > 0 && (
          <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3">
            {answers.map((a, i) => (
              <div key={i} className="text-xs text-slate-700">
                <span className="font-semibold text-slate-500">Q{i + 1}: </span>
                {a.answerText ?? a.answer ?? "—"}
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Score</label>
          <input type="number" min="0" step="0.5" value={score}
            onChange={(e) => setScore(e.target.value)}
            placeholder="e.g. 42.5"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300" />
        </div>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !score}
            className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
            {saving ? "Saving…" : "Save Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SubmissionRow ─────────────────────────────────────────────────────────────
function SubmissionRow({ sub, hasEssay, onGrade }) {
  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b2c4a]/10">
            <HiUser className="h-4 w-4 text-[#0b2c4a]" />
          </div>
          <span className="text-sm font-medium text-slate-800">{sub.studentName ?? "—"}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <HiClock className="h-3.5 w-3.5" />
          {fmtDate(sub.submittedAt)}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {sub.isGraded ? (
          <span className="text-sm font-bold text-emerald-600">
            {sub.score ?? "—"}
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Pending
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {sub.isGraded ? (
          <HiCheckCircle className="h-5 w-5 text-emerald-500 mx-auto" />
        ) : (
          <span className="text-xs text-slate-400">Not graded</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {hasEssay && (
          <button type="button" onClick={() => onGrade(sub)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 ml-auto">
            <HiPencil className="h-3.5 w-3.5" />
            {sub.isGraded ? "Re-grade" : "Grade"}
          </button>
        )}
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ProfessorExamResultsPage() {
  const { examId } = useParams();

  const [exam,         setExam]         = useState(null);
  const [submissions,  setSubmissions]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");
  const [gradeTarget,  setGradeTarget]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [examData, subs] = await Promise.all([
        fetchExamById(examId),
        fetchExamResults(examId),
      ]);
      setExam(examData);
      setSubmissions(subs);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const hasEssay = useMemo(
    () => exam?.questions?.some((q) => q.questionType === 2 || q.questionType === "Essay"),
    [exam]
  );

  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.isGraded);
    const scores = graded.map((s) => Number(s.score ?? 0));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { total: submissions.length, graded: graded.length, avg };
  }, [submissions]);

  const handleGraded = useCallback((subId, score) => {
    setSubmissions((prev) => prev.map((s) =>
      s.id === subId ? { ...s, score, isGraded: true } : s
    ));
  }, []);

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link to="/prof/exams"
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
        <HiArrowLeft className="h-4 w-4" /> Back to Exams
      </Link>

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading results…</div>
      ) : error ? (
        <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          <span className="flex-1">{error}</span>
          <button onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold hover:bg-red-100">
            <HiRefresh className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      ) : (
        <>
          {/* Exam info */}
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-xl font-semibold text-[#0b2c4a]">{exam?.title ?? "Exam Results"}</h1>
                {exam?.subjectName && (
                  <p className="text-sm text-slate-500 mt-0.5">{exam.subjectName}</p>
                )}
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {exam?.status ?? "—"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {exam?.type && <span className="rounded-full bg-slate-100 px-2.5 py-1">{exam.type}</span>}
              <span className="rounded-full bg-slate-100 px-2.5 py-1">
                {fmtDate(exam?.startTime)} → {fmtDate(exam?.endTime)}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Submissions", value: stats.total },
              { label: "Graded", value: stats.graded },
              { label: "Avg Score", value: stats.avg ?? "—" },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                <p className="text-2xl font-bold text-[#0b2c4a]">{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Submissions table */}
          {submissions.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
              No submissions yet.
            </div>
          ) : (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Submitted At</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <SubmissionRow key={sub.id} sub={sub}
                      hasEssay={hasEssay}
                      onGrade={setGradeTarget} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <GradeEssayModal
        submission={gradeTarget}
        open={Boolean(gradeTarget)}
        onClose={() => setGradeTarget(null)}
        onGraded={handleGraded}
      />
    </div>
  );
}

export default ProfessorExamResultsPage;
