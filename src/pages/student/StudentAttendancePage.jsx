import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import { checkIn, getMyAttendanceReport } from "../../api/attendanceApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// ── Attendance badge ──────────────────────────────────────────────────────────
const STATUS_STYLE = {
  Present:  "bg-emerald-100 text-emerald-700 ring-emerald-200",
  Absent:   "bg-red-100 text-red-700 ring-red-200",
  Late:     "bg-amber-100 text-amber-700 ring-amber-200",
  Excused:  "bg-blue-100 text-blue-700 ring-blue-200",
};

function StatusBadge({ status }) {
  const cls = STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cls}`}>
      {status ?? "—"}
    </span>
  );
}

// ── Attendance report per subject ─────────────────────────────────────────────
function SubjectReport({ subject }) {
  const records = subject.records ?? subject.sessions ?? [];
  const total   = records.length;
  const present = records.filter((r) => r.status === "Present").length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : null;
  const barColor = pct == null ? "bg-slate-300" : pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200 shadow-sm space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{subject.subjectName ?? subject.name ?? "Subject"}</p>
          {subject.subjectCode && <p className="text-xs text-slate-400">{subject.subjectCode}</p>}
        </div>
        {pct != null && (
          <span className={`text-sm font-bold px-3 py-1 rounded-full ${
            pct >= 75 ? "bg-emerald-100 text-emerald-700" : pct >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
          }`}>
            {pct}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {pct != null && (
        <div className="h-2 w-full rounded-full bg-slate-100">
          <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      )}

      <p className="text-xs text-slate-500">
        {present} / {total} sessions attended
        {pct != null && pct < 75 && (
          <span className="ml-2 text-red-500 font-semibold">⚠ Below 75% threshold</span>
        )}
      </p>

      {/* Records table */}
      {records.length > 0 && (
        <div className="space-y-1.5">
          {records.map((r, i) => (
            <div key={r.sessionId ?? i} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <span className="text-slate-600">
                {r.date ?? r.sessionDate
                  ? new Date(r.date ?? r.sessionDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  : `Session ${i + 1}`}
              </span>
              {r.notes && <span className="text-slate-400 mx-2 truncate max-w-[120px]">{r.notes}</span>}
              <StatusBadge status={r.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function StudentAttendancePage() {
  const [sessionId,   setSessionId]   = useState("");
  const [checkInLoad, setCheckInLoad] = useState(false);
  const [checkInResult, setCheckInResult] = useState(null);

  const [report,      setReport]      = useState(null);
  const [reportLoad,  setReportLoad]  = useState(true);
  const [reportError, setReportError] = useState("");

  // Load attendance report on mount
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) { setReportLoad(false); return; }
    getMyAttendanceReport(userId)
      .then((data) => setReport(data))
      .catch((err) => setReportError(getErrorMessage(err, "Could not load attendance report.")))
      .finally(() => setReportLoad(false));
  }, []);

  const handleCheckIn = useCallback(async (e) => {
    e.preventDefault();
    const id = sessionId.trim();
    if (!id) return;
    setCheckInLoad(true);
    setCheckInResult(null);
    try {
      await checkIn(id);
      setCheckInResult({ ok: true, message: "Attendance recorded successfully!" });
      setSessionId("");
      // refresh report
      const userId = localStorage.getItem("userId");
      if (userId) {
        getMyAttendanceReport(userId).then(setReport).catch(() => {});
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Failed to record attendance.");
      setCheckInResult({ ok: false, message: msg });
    } finally {
      setCheckInLoad(false);
    }
  }, [sessionId]);

  const subjects = Array.isArray(report)
    ? report
    : report?.subjects ?? report?.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Attendance" />

      {/* ── Check-In Card ── */}
      <div className="max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Check-In to Session</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the Session ID provided by your doctor to mark your attendance.
            </p>
          </div>

          <form onSubmit={handleCheckIn} className="space-y-4">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste session ID here…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={checkInLoad || !sessionId.trim()}
              className="w-full rounded-xl bg-[#0b2c4a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
            >
              {checkInLoad ? "Recording…" : "Check In"}
            </button>
          </form>

          {checkInResult && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
              checkInResult.ok
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}>
              {checkInResult.message}
            </div>
          )}
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">
          You can only check in once per session. Contact your doctor if you have issues.
        </p>
      </div>

      {/* ── Attendance Report ── */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">My Attendance Report</h2>

        {reportLoad && <Loading label="Loading attendance report…" />}

        {!reportLoad && reportError && (
          <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
            {reportError}
          </div>
        )}

        {!reportLoad && !reportError && subjects.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
            <p className="text-sm text-slate-500">No attendance records found yet.</p>
          </div>
        )}

        {!reportLoad && subjects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {subjects.map((s, i) => (
              <SubjectReport key={s.offeringId ?? s.subjectCode ?? i} subject={s} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentAttendancePage;
