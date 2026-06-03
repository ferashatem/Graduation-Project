import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  HiPlus, HiTrash, HiPencil,
  HiCheckCircle, HiClock, HiSparkles, HiRefresh, HiDocumentDownload,
} from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import {
  createAssignment,
  getAssignmentsByOffering,
  getSubmissions,
  gradeSubmission,
  aiGradeSubmission,
  deleteAssignment,
} from "../../api/assignmentsApi";

const fmtDate = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return s; }
};

// ── Grade Modal ───────────────────────────────────────────────────────────────
function GradeModal({ sub, onClose, onGraded }) {
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSave = async () => {
    const s = Number(score);
    if (isNaN(s) || s < 0) return setErr("Enter a valid score.");
    setSaving(true); setErr("");
    try {
      await gradeSubmission(sub.id, { submissionId: sub.id, grade: s, feedback: feedback.trim() || null });
      onGraded(sub.id, s, feedback.trim());
      onClose();
    } catch (e) {
      setErr(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800">Grade Submission</h3>
          <p className="text-xs text-slate-500">{sub.studentName ?? "Student"}</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Score</label>
            <input type="number" min="0" step="0.5" value={score} onChange={(e) => setScore(e.target.value)}
              placeholder="e.g. 85"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Feedback (optional)</label>
            <textarea rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)}
              placeholder="Your feedback…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300 resize-none" />
          </div>
        </div>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || !score}
            className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
            {saving ? "Saving…" : "Save Grade"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Submissions panel ─────────────────────────────────────────────────────────
function SubmissionsPanel({ assignmentId, onClose }) {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [gradeTarget, setGradeTarget] = useState(null);
  const [aiLoading, setAiLoading] = useState({});

  useEffect(() => {
    getSubmissions(assignmentId)
      .then(setSubs)
      .catch((e) => setErr(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const handleAiGrade = async (sub) => {
    setAiLoading((p) => ({ ...p, [sub.id]: true }));
    try {
      const result = await aiGradeSubmission(sub.id);
      setSubs((prev) => prev.map((s) =>
        s.id === sub.id ? { ...s, score: result?.score ?? s.score, isGraded: true, feedback: result?.feedback ?? s.feedback } : s
      ));
    } catch {
      // silent
    } finally {
      setAiLoading((p) => ({ ...p, [sub.id]: false }));
    }
  };

  const handleGraded = (subId, score, feedback) => {
    setSubs((prev) => prev.map((s) =>
      s.id === subId ? { ...s, score, feedback, isGraded: true } : s
    ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-semibold text-slate-800">Submissions</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-slate-100 text-slate-400">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-sm text-slate-500 text-center py-6">Loading…</p>}
          {err && <p className="text-sm text-red-600">{err}</p>}
          {!loading && !err && subs.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">No submissions yet.</p>
          )}
          {subs.map((sub) => (
            <div key={sub.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{sub.studentName ?? "Student"}</p>
                <p className="text-xs text-slate-400">{fmtDate(sub.submittedAt)}</p>
                {sub.textAnswer && (
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2 whitespace-pre-wrap">{sub.textAnswer}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {sub.fileUrl && (
                  <a
                    href={sub.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    <HiDocumentDownload className="h-3.5 w-3.5" />
                    View File
                  </a>
                )}
                {sub.isGraded ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    {sub.score ?? "—"} pts
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>
                )}
                <button type="button" onClick={() => setGradeTarget(sub)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                  <HiPencil className="h-3.5 w-3.5" />
                  {sub.isGraded ? "Re-grade" : "Grade"}
                </button>
                <button type="button" onClick={() => handleAiGrade(sub)} disabled={aiLoading[sub.id]}
                  className="flex items-center gap-1 rounded-xl bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
                  <HiSparkles className="h-3.5 w-3.5" />
                  {aiLoading[sub.id] ? "AI…" : "AI Grade"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {gradeTarget && (
        <GradeModal sub={gradeTarget} onClose={() => setGradeTarget(null)} onGraded={handleGraded} />
      )}
    </div>
  );
}

// ── Create Assignment Form ────────────────────────────────────────────────────
function CreateForm({ offeringId, onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState("100");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true); setErr("");
    try {
      const dto = {
        subjectOfferingId: offeringId,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        maxScore: maxScore ? Number(maxScore) : null,
      };
      const result = await createAssignment(dto);
      onCreated(result);
      setTitle(""); setDescription(""); setDeadline(""); setMaxScore("100");
      setOpen(false);
    } catch (e) {
      setErr(getErrorMessage(e, "Failed to create assignment."));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#153a63] transition">
        <HiPlus className="h-4 w-4" />
        New Assignment
      </button>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700">New Assignment</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
            placeholder="e.g. Midterm Project"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
          <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Assignment details…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Deadline</label>
            <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Max Score</label>
            <input type="number" min="1" value={maxScore} onChange={(e) => setMaxScore(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-300" />
          </div>
        </div>
        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{err}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => setOpen(false)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving || !title.trim()}
            className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50">
            {saving ? "Creating…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Assignment row ────────────────────────────────────────────────────────────
function AssignmentRow({ assignment, onDelete, onViewSubs }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this assignment?")) return;
    setDeleting(true);
    try { await deleteAssignment(assignment.id); onDelete(assignment.id); }
    catch { setDeleting(false); }
  };

  const overdue = assignment.deadline && new Date(assignment.deadline) < new Date();

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="space-y-1 min-w-0">
        <p className="font-semibold text-slate-800">{assignment.title ?? "Untitled"}</p>
        {assignment.description && (
          <p className="text-xs text-slate-500 line-clamp-2">{assignment.description}</p>
        )}
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <HiClock className="h-3.5 w-3.5" />
            {overdue
              ? <span className="text-red-500 font-semibold">Overdue · {fmtDate(assignment.deadline)}</span>
              : <>Due: {fmtDate(assignment.deadline ?? assignment.dueDate)}</>}
          </span>
          {assignment.maxScore != null && <span>{assignment.maxScore} pts</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" onClick={() => onViewSubs(assignment.id)}
          className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
          <HiCheckCircle className="h-3.5 w-3.5" />
          Submissions
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting}
          className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50">
          <HiTrash className="h-3.5 w-3.5" />
          {deleting ? "…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function ProfessorAssignmentsPage() {
  const [offerings, setOfferings] = useState([]);
  const [offerLoad, setOfferLoad] = useState(true);
  const [offerErr, setOfferErr] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [assLoad, setAssLoad] = useState(false);
  const [assErr, setAssErr] = useState("");
  const [viewSubsId, setViewSubsId] = useState(null);

  useEffect(() => {
    fetchMySubjects()
      .then((data) => setOfferings(Array.isArray(data) ? data : []))
      .catch((err) => setOfferErr(getErrorMessage(err, "Failed to load your offerings.")))
      .finally(() => setOfferLoad(false));
  }, []);

  const loadAssignments = useCallback((offeringId) => {
    if (!offeringId) { setAssignments([]); return; }
    setAssLoad(true); setAssErr("");
    getAssignmentsByOffering(offeringId)
      .then(setAssignments)
      .catch((err) => setAssErr(getErrorMessage(err, "Failed to load assignments.")))
      .finally(() => setAssLoad(false));
  }, []);

  useEffect(() => { loadAssignments(selectedId); }, [selectedId, loadAssignments]);

  const handleCreated = (newAss) => setAssignments((prev) => [newAss, ...prev]);
  const handleDelete = (id) => setAssignments((prev) => prev.filter((a) => a.id !== id));

  if (offerLoad) return <Loading label="Loading your offerings…" />;
  if (offerErr) return <ErrorState message={offerErr} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" />

      {/* Offering selector */}
      <div className="flex flex-wrap items-end gap-4">
        <div className="max-w-sm flex-1">
          <label className="mb-1.5 block text-xs font-semibold text-slate-600">Subject Offering</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select an offering…</option>
            {offerings.map((o) => {
              const id   = o.id ?? o.subjectOfferingId;
              const name = o.subjectName ?? o.name ?? "Untitled";
              const code = o.subjectCode ?? o.code ?? "";
              return (
                <option key={id} value={id}>
                  {name}{code ? ` (${code})` : ""}
                </option>
              );
            })}
          </select>
        </div>
        {selectedId && (
          <button type="button" onClick={() => loadAssignments(selectedId)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            <HiRefresh className="h-4 w-4" />
            Refresh
          </button>
        )}
      </div>

      {selectedId && (
        <>
          <CreateForm offeringId={selectedId} onCreated={handleCreated} />

          <div className="space-y-3">
            {assLoad && <Loading label="Loading assignments…" />}
            {assErr && (
              <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{assErr}</div>
            )}
            {!assLoad && !assErr && assignments.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">No assignments yet. Create the first one!</p>
              </div>
            )}
            {!assLoad && assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={a}
                onDelete={handleDelete}
                onViewSubs={setViewSubsId}
              />
            ))}
          </div>
        </>
      )}

      {!selectedId && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Select a subject offering to manage its assignments.</p>
        </div>
      )}

      {viewSubsId && (
        <SubmissionsPanel assignmentId={viewSubsId} onClose={() => setViewSubsId(null)} />
      )}
    </div>
  );
}

export default ProfessorAssignmentsPage;
