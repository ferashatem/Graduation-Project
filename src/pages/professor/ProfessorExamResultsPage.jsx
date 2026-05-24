import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { HiArrowLeft, HiCheckCircle, HiClock, HiExclamation, HiPencil, HiRefresh, HiShieldExclamation, HiUser } from "react-icons/hi";
import { fetchExamById, fetchExamResults, gradeSubmission } from "../../api/examsApi";
import { flagSubmission, getExamProctoringsummary, getProctoringReport } from "../../api/proctoringApi";
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

// ── ProctoringReportModal ─────────────────────────────────────────────────────
function ProctoringReportModal({ submissionId, studentName, open, onClose, onFlag }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || !submissionId) return;
    setLoading(true);
    getProctoringReport(submissionId)
      .then(setReport)
      .catch(() => setReport(null))
      .finally(() => setLoading(false));
  }, [open, submissionId]);

  const handleFlag = async () => {
    if (!reason.trim()) return;
    setFlagging(true);
    try {
      await flagSubmission(submissionId, reason);
      onFlag && onFlag(submissionId);
      onClose();
    } finally {
      setFlagging(false);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl space-y-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <HiShieldExclamation className="h-5 w-5 text-amber-500" />
            Proctoring Report
          </h3>
          <p className="text-xs text-slate-500">{studentName}</p>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500 text-center py-4">Loading…</p>
        ) : report ? (
          <div className="space-y-2 text-sm">
            <div className="flex gap-4">
              <div className="rounded-xl bg-amber-50 px-3 py-2 text-center flex-1">
                <p className="text-xl font-bold text-amber-700">{report.tabSwitchCount ?? 0}</p>
                <p className="text-xs text-slate-500">Tab Switches</p>
              </div>
              <div className="rounded-xl bg-red-50 px-3 py-2 text-center flex-1">
                <p className="text-xl font-bold text-red-700">{report.totalEvents ?? 0}</p>
                <p className="text-xs text-slate-500">Total Events</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2 text-center flex-1">
                <p className={`text-xl font-bold ${report.isFlagged ? "text-red-600" : "text-emerald-600"}`}>
                  {report.isFlagged ? "Flagged" : "Clean"}
                </p>
                <p className="text-xs text-slate-500">Status</p>
              </div>
            </div>
            {report.events?.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-xl bg-slate-50 p-2 space-y-1">
                {report.events.map((ev, i) => (
                  <p key={i} className="text-xs text-slate-600">
                    <span className="font-semibold">{ev.eventType}</span> — {new Date(ev.occurredAt).toLocaleTimeString()}
                    {ev.details && <span className="text-slate-400"> · {ev.details}</span>}
                  </p>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">No proctoring data available.</p>
        )}
        {!report?.isFlagged && (
          <div className="space-y-2 border-t border-slate-100 pt-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Flag Reason</label>
            <input value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Multiple tab switches observed"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-300" />
            <button type="button" onClick={handleFlag} disabled={flagging || !reason.trim()}
              className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {flagging ? "Flagging…" : "Flag Submission"}
            </button>
          </div>
        )}
        <button type="button" onClick={onClose}
          className="w-full rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Close
        </button>
      </div>
    </div>
  );
}

// ── SubmissionRow ─────────────────────────────────────────────────────────────
function SubmissionRow({ sub, hasEssay, onGrade, onViewProctoring }) {
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
        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={() => onViewProctoring(sub)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <HiShieldExclamation className="h-3.5 w-3.5" />
            Proctoring
          </button>
          {hasEssay && (
            <button type="button" onClick={() => onGrade(sub)}
              className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <HiPencil className="h-3.5 w-3.5" />
              {sub.isGraded ? "Re-grade" : "Grade"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ProfessorExamResultsPage() {
  const { examId } = useParams();

  const [exam,              setExam]              = useState(null);
  const [submissions,       setSubmissions]       = useState([]);
  const [loading,           setLoading]           = useState(true);
  const [error,             setError]             = useState("");
  const [gradeTarget,       setGradeTarget]       = useState(null);
  const [proctoringTarget,  setProctoringTarget]  = useState(null);
  const [procSummary,       setProcSummary]       = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [examData, subs] = await Promise.all([
        fetchExamById(examId),
        fetchExamResults(examId),
      ]);
      setExam(examData);
      setSubmissions(subs);
      // Load proctoring summary in background
      getExamProctoringsummary(examId).then(setProcSummary).catch(() => {});
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

          {/* Proctoring Summary */}
          {procSummary && (
            <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
                <HiShieldExclamation className="h-5 w-5" />
                Proctoring Summary
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-amber-700">
                <span className="rounded-full bg-amber-100 px-2.5 py-1">
                  {procSummary.totalEvents ?? 0} total events
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1">
                  {procSummary.flaggedCount ?? 0} flagged submissions
                </span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1">
                  {procSummary.tabSwitchCount ?? 0} tab switches
                </span>
              </div>
            </div>
          )}

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
                      onGrade={setGradeTarget}
                      onViewProctoring={setProctoringTarget} />
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

      <ProctoringReportModal
        submissionId={proctoringTarget?.id}
        studentName={proctoringTarget?.studentName}
        open={Boolean(proctoringTarget)}
        onClose={() => setProctoringTarget(null)}
        onFlag={(subId) => {
          setSubmissions((prev) => prev.map((s) =>
            s.id === subId ? { ...s, isFlagged: true } : s
          ));
        }}
      />
    </div>
  );
}

export default ProfessorExamResultsPage;
