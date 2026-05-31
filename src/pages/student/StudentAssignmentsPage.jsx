import { useCallback, useEffect, useRef, useState } from "react";
import { HiChevronDown, HiChevronUp, HiCheckCircle, HiClock, HiUpload } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";
import {
  getAssignmentsByOffering,
  getMySubmission,
  submitAssignment,
} from "../../api/assignmentsApi";
import { fetchMyEnrollments } from "../../features/subjectOfferings/api/subjectOfferingsApi";

const fmtDate = (s) => {
  if (!s) return "—";
  try { return new Date(s).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }); }
  catch { return s; }
};

const isOverdue = (deadline) => deadline && new Date(deadline) < new Date();

// ── Submission status badge ───────────────────────────────────────────────────
function StatusBadge({ sub }) {
  if (!sub) return <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">Not submitted</span>;
  const graded = sub.status === "Graded" || sub.grade != null;
  if (graded) return (
    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
      Graded · {sub.grade ?? "—"} pts
    </span>
  );
  return <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending Review</span>;
}

// ── Assignment card ───────────────────────────────────────────────────────────
function AssignmentCard({ assignment }) {
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(null);
  const [subLoad, setSubLoad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [submitOk, setSubmitOk] = useState(false);
  const fileRef = useRef();
  const loaded = useRef(false);

  const loadSub = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    setSubLoad(true);
    try {
      const data = await getMySubmission(assignment.id);
      setSub(data);
    } catch {
      setSub(null);
    } finally {
      setSubLoad(false);
    }
  }, [assignment.id]);

  const handleToggle = () => {
    setOpen((p) => !p);
    if (!open) loadSub();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setSubmitting(true);
    setSubmitErr("");
    setSubmitOk(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await submitAssignment(assignment.id, fd);
      setSub(result);
      setSubmitOk(true);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setSubmitErr(getErrorMessage(err, "Failed to submit. Try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const overdue = isOverdue(assignment.deadline ?? assignment.dueDate);
  const canSubmit = !sub && !overdue;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-start justify-between gap-4 p-5 text-left"
      >
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{assignment.title ?? "Untitled"}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <HiClock className="h-3.5 w-3.5" />
              {overdue ? (
                <span className="text-red-500 font-semibold">Overdue · {fmtDate(assignment.deadline ?? assignment.dueDate)}</span>
              ) : (
                <>Due: {fmtDate(assignment.deadline ?? assignment.dueDate)}</>
              )}
            </span>
            {assignment.maxScore != null && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5">{assignment.maxScore} pts</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge sub={sub} />
          {open ? <HiChevronUp className="h-5 w-5 text-slate-400" /> : <HiChevronDown className="h-5 w-5 text-slate-400" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 pb-5 space-y-4 pt-4">
          {assignment.description && (
            <p className="text-sm text-slate-600 whitespace-pre-line">{assignment.description}</p>
          )}

          {subLoad && <p className="text-xs text-slate-400">Loading submission…</p>}

          {!subLoad && sub && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 space-y-1 ring-1 ring-emerald-200">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <HiCheckCircle className="h-4 w-4" />
                Submitted {fmtDate(sub.submittedAt)}
              </div>
              {(sub.status === "Graded" || sub.grade != null) && (
                <p className="text-xs text-emerald-600">
                  Score: <span className="font-bold">{sub.grade}</span> / {assignment.maxScore ?? "—"} pts
                  {sub.feedback && <span className="block mt-0.5 text-slate-600">{sub.feedback}</span>}
                </p>
              )}
            </div>
          )}

          {!subLoad && canSubmit && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block text-xs font-semibold text-slate-600">Submit Your Work</label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0b2c4a] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
                >
                  <HiUpload className="h-3.5 w-3.5" />
                  {submitting ? "Uploading…" : "Submit"}
                </button>
              </div>
              {submitErr && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">{submitErr}</p>
              )}
              {submitOk && (
                <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-700 ring-1 ring-emerald-200">
                  Submitted successfully!
                </p>
              )}
            </form>
          )}

          {!subLoad && overdue && !sub && (
            <p className="text-xs text-red-500 font-medium">Deadline has passed. Submission is closed.</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function StudentAssignmentsPage() {
  const [offerings, setOfferings] = useState([]);
  const [offerLoad, setOfferLoad] = useState(true);
  const [offerErr, setOfferErr] = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [assLoad, setAssLoad] = useState(false);
  const [assErr, setAssErr] = useState("");

  useEffect(() => {
    fetchMyEnrollments()
      .then((data) => setOfferings(Array.isArray(data) ? data : []))
      .catch((err) => setOfferErr(getErrorMessage(err, "Failed to load your courses.")))
      .finally(() => setOfferLoad(false));
  }, []);

  useEffect(() => {
    if (!selectedId) { setAssignments([]); return; }
    setAssLoad(true);
    setAssErr("");
    getAssignmentsByOffering(selectedId)
      .then(setAssignments)
      .catch((err) => setAssErr(getErrorMessage(err, "Failed to load assignments.")))
      .finally(() => setAssLoad(false));
  }, [selectedId]);

  if (offerLoad) return <Loading label="Loading your courses…" />;
  if (offerErr) return <ErrorState message={offerErr} />;

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" />

      {/* Course selector */}
      <div className="max-w-sm">
        <label className="mb-1.5 block text-xs font-semibold text-slate-600">Select Course</label>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Choose a course…</option>
          {offerings.map((o) => {
            const id   = o.subjectOfferingId ?? o.offeringId ?? o.id;
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

      {/* Assignments list */}
      {selectedId && (
        <div className="space-y-3">
          {assLoad && <Loading label="Loading assignments…" />}
          {assErr && (
            <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{assErr}</div>
          )}
          {!assLoad && !assErr && assignments.length === 0 && (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <p className="text-sm text-slate-500">No assignments for this course yet.</p>
            </div>
          )}
          {!assLoad && assignments.map((a) => (
            <AssignmentCard key={a.id} assignment={a} />
          ))}
        </div>
      )}

      {!selectedId && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Select a course to view its assignments.</p>
        </div>
      )}
    </div>
  );
}

export default StudentAssignmentsPage;
