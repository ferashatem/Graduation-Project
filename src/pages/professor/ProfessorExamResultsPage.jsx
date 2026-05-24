import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HiArrowLeft, HiCheck, HiCheckCircle, HiClock, HiEye, HiLightningBolt,
  HiRefresh, HiShieldExclamation, HiUser, HiX,
} from "react-icons/hi";
import {
  autoGradeExamByCode, fetchExamById, fetchExamResults, fetchExamResultsByCode,
  fetchSubmission, gradeQuestion,
} from "../../api/examsApi";
import { flagSubmission, getExamProctoringsummary, getProctoringReport } from "../../api/proctoringApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const fmtDate = (s) => { try { return new Date(s).toLocaleString(); } catch { return s ?? "—"; } };

const isEssayType = (t) =>
  t === 2 || t === "Essay" || t === "essay";

// ── SubmissionAnswersModal ────────────────────────────────────────────────────
function SubmissionAnswersModal({ submissionId, studentName, open, onClose, onGraded }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [savingQ, setSavingQ] = useState(null);
  const [draft, setDraft]     = useState({});

  const load = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true); setError("");
    try {
      const result = await fetchSubmission(submissionId);
      setData(result);
      const initial = {};
      (result?.answers ?? []).forEach((a) => {
        initial[a.questionId] = {
          score:   a.awardedScore ?? "",
          comment: a.professorComment ?? "",
        };
      });
      setDraft(initial);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleSaveQuestion = async (questionId) => {
    const entry = draft[questionId];
    const score = Number(entry?.score);
    if (Number.isNaN(score) || score < 0) {
      setError("Enter a valid score.");
      return;
    }
    setSavingQ(questionId); setError("");
    try {
      await gradeQuestion({
        submissionId,
        questionId,
        score,
        comment: entry?.comment ?? "",
      });
      await load();
      if (onGraded) onGraded(submissionId);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSavingQ(null);
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] rounded-2xl bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Student Submission</h3>
            <p className="text-xs text-slate-500 mt-0.5">{studentName ?? data?.studentName ?? "—"}</p>
          </div>
          {data && (
            <div className="text-right text-xs">
              <p className="font-bold text-[#0b2c4a] text-lg">
                {data.score ?? 0} / {data.totalMarks ?? 0}
              </p>
              <p className="text-slate-500">
                {data.isGraded ? "Graded" : "Pending"}
              </p>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading…</p>
          ) : error ? (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          ) : !data ? (
            <p className="text-sm text-slate-500 text-center py-8">No data.</p>
          ) : (
            (data.answers ?? []).map((ans, idx) => {
              const isEssay = isEssayType(ans.questionType);
              const opts    = ans.options ?? [];
              return (
                <div key={ans.questionId ?? idx} className="rounded-2xl ring-1 ring-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-400">
                        Q{idx + 1} · {isEssay ? "Essay" : ans.questionType ?? "MCQ"} · {ans.marks ?? 0} marks
                      </p>
                      <p className="text-sm text-slate-800 mt-1">{ans.questionText ?? "—"}</p>
                    </div>
                    {!isEssay && (
                      ans.isCorrect === true ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          <HiCheck className="h-3.5 w-3.5" /> Correct
                        </span>
                      ) : ans.isCorrect === false ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-700">
                          <HiX className="h-3.5 w-3.5" /> Wrong
                        </span>
                      ) : null
                    )}
                  </div>

                  {!isEssay && opts.length > 0 && (
                    <div className="space-y-1.5">
                      {opts.map((opt, oi) => {
                        const isCorrect = oi === ans.correctIndex;
                        const isPicked  = oi === ans.studentAnswerIndex;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                              isCorrect
                                ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
                                : isPicked
                                  ? "bg-rose-50 text-rose-800 ring-1 ring-rose-200"
                                  : "bg-slate-50 text-slate-600"
                            }`}
                          >
                            <span className="text-xs font-bold w-5">{String.fromCharCode(65 + oi)}.</span>
                            <span className="flex-1">{opt}</span>
                            {isCorrect && <HiCheck className="h-4 w-4 text-emerald-600" />}
                            {isPicked && !isCorrect && <HiX className="h-4 w-4 text-rose-600" />}
                            {isPicked && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                                Student
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {isEssay && (
                    <>
                      <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 whitespace-pre-wrap">
                        {ans.studentAnswerText || <span className="italic text-slate-400">No answer.</span>}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="0"
                            max={ans.marks ?? undefined}
                            step="0.5"
                            placeholder={`Score (max ${ans.marks ?? 0})`}
                            value={draft[ans.questionId]?.score ?? ""}
                            onChange={(e) => setDraft((d) => ({
                              ...d,
                              [ans.questionId]: { ...d[ans.questionId], score: e.target.value },
                            }))}
                            className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                          />
                          <input
                            type="text"
                            placeholder="Optional comment"
                            value={draft[ans.questionId]?.comment ?? ""}
                            onChange={(e) => setDraft((d) => ({
                              ...d,
                              [ans.questionId]: { ...d[ans.questionId], comment: e.target.value },
                            }))}
                            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-300"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={savingQ === ans.questionId}
                          onClick={() => handleSaveQuestion(ans.questionId)}
                          className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#153a63] disabled:opacity-50"
                        >
                          {savingQ === ans.questionId ? "Saving…" : "Save Grade"}
                        </button>
                      </div>
                      {ans.professorComment && savingQ !== ans.questionId && (
                        <p className="text-xs text-slate-500 italic">Last comment: {ans.professorComment}</p>
                      )}
                    </>
                  )}

                  <div className="flex justify-end">
                    <span className="text-xs font-semibold text-slate-500">
                      Awarded: <span className="text-[#0b2c4a]">{ans.awardedScore ?? 0}</span> / {ans.marks ?? 0}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-slate-100 px-6 py-3 flex justify-end shrink-0">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProctoringReportModal ─────────────────────────────────────────────────────
function ProctoringReportModal({ submissionId, studentName, open, onClose, onFlag }) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [reason, setReason]   = useState("");

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
function SubmissionRow({ sub, onView, onViewProctoring }) {
  const score      = sub.score ?? 0;
  const totalMarks = sub.totalMarks ?? 0;
  const pct        = sub.percentage ?? (totalMarks ? Math.round((score / totalMarks) * 100) : null);
  const pendingEssays = sub.pendingEssayCount ?? 0;

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0b2c4a]/10">
            <HiUser className="h-4 w-4 text-[#0b2c4a]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{sub.studentName ?? "—"}</p>
            {sub.studentCode && <p className="text-xs text-slate-400">{sub.studentCode}</p>}
          </div>
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
          <div>
            <p className="text-sm font-bold text-emerald-600">{score} / {totalMarks}</p>
            {pct != null && <p className="text-[11px] text-slate-400">{pct}%</p>}
          </div>
        ) : (
          <div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              Pending
            </span>
            {pendingEssays > 0 && (
              <p className="text-[11px] text-slate-400 mt-1">{pendingEssays} essay{pendingEssays > 1 ? "s" : ""} left</p>
            )}
          </div>
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
          {sub.isFlagged && (
            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-600">
              <HiShieldExclamation className="h-3.5 w-3.5" /> Flagged
            </span>
          )}
          <button type="button" onClick={() => onView(sub)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <HiEye className="h-3.5 w-3.5" />
            View / Grade
          </button>
          <button type="button" onClick={() => onViewProctoring(sub)}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <HiShieldExclamation className="h-3.5 w-3.5" />
            Proctoring
          </button>
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function ProfessorExamResultsPage() {
  const { examId } = useParams();

  const [exam,             setExam]             = useState(null);
  const [submissions,      setSubmissions]      = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState("");
  const [viewTarget,       setViewTarget]       = useState(null);
  const [proctoringTarget, setProctoringTarget] = useState(null);
  const [procSummary,      setProcSummary]      = useState(null);
  const [autoGrading,      setAutoGrading]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const examData = await fetchExamById(examId);
      setExam(examData);

      let subs = [];
      const code = examData?.code;
      try {
        subs = code ? await fetchExamResultsByCode(code) : await fetchExamResults(examId);
      } catch {
        subs = await fetchExamResults(examId);
      }
      setSubmissions(subs);

      getExamProctoringsummary(examId).then(setProcSummary).catch(() => {});
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => {
    const graded = submissions.filter((s) => s.isGraded);
    const scores = graded.map((s) => Number(s.percentage ?? s.score ?? 0));
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return { total: submissions.length, graded: graded.length, avg };
  }, [submissions]);

  const handleAutoGrade = async () => {
    if (!exam?.code) return;
    if (!window.confirm("Auto-grade all MCQ and True/False submissions?")) return;
    setAutoGrading(true); setError("");
    try {
      await autoGradeExamByCode(exam.code);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setAutoGrading(false);
    }
  };

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
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {exam?.status ?? "—"}
                </span>
                <button
                  type="button"
                  onClick={handleAutoGrade}
                  disabled={autoGrading || submissions.length === 0}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#153a63] disabled:opacity-50"
                >
                  <HiLightningBolt className="h-3.5 w-3.5" />
                  {autoGrading ? "Auto-grading…" : "Auto-grade All"}
                </button>
              </div>
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
              { label: "Graded",      value: stats.graded },
              { label: "Avg %",       value: stats.avg ?? "—" },
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
                    <SubmissionRow
                      key={sub.submissionId ?? sub.id}
                      sub={{ ...sub, id: sub.submissionId ?? sub.id }}
                      onView={setViewTarget}
                      onViewProctoring={setProctoringTarget}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <SubmissionAnswersModal
        submissionId={viewTarget?.id}
        studentName={viewTarget?.studentName}
        open={Boolean(viewTarget)}
        onClose={() => setViewTarget(null)}
        onGraded={() => load()}
      />

      <ProctoringReportModal
        submissionId={proctoringTarget?.id}
        studentName={proctoringTarget?.studentName}
        open={Boolean(proctoringTarget)}
        onClose={() => setProctoringTarget(null)}
        onFlag={(subId) => {
          setSubmissions((prev) => prev.map((s) =>
            (s.submissionId ?? s.id) === subId ? { ...s, isFlagged: true } : s
          ));
        }}
      />
    </div>
  );
}

export default ProfessorExamResultsPage;
