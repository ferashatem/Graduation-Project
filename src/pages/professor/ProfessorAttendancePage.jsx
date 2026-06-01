import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { createSession } from "../../api/attendanceApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handle}
      className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function ProfessorAttendancePage() {
  const [offerings, setOfferings]   = useState([]);
  const [offerLoad, setOfferLoad]   = useState(true);
  const [offerErr, setOfferErr]     = useState("");

  const [selectedId, setSelectedId] = useState("");
  const [notes, setNotes]           = useState("");
  const [creating, setCreating]     = useState(false);
  const [sessions, setSessions]     = useState([]); // created this session
  const [createErr, setCreateErr]   = useState("");

  useEffect(() => {
    fetchMySubjects()
      .then((data) => setOfferings(Array.isArray(data) ? data : []))
      .catch((err) => setOfferErr(getErrorMessage(err, "Failed to load your offerings.")))
      .finally(() => setOfferLoad(false));
  }, []);

  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedId) return;
    setCreating(true);
    setCreateErr("");
    try {
      const data = await createSession({ subjectOfferingId: selectedId, notes: notes.trim() || null });
      setSessions((prev) => [data, ...prev]);
      setNotes("");
    } catch (err) {
      setCreateErr(getErrorMessage(err, "Failed to create session."));
    } finally {
      setCreating(false);
    }
  }, [selectedId, notes]);

  if (offerLoad) return <Loading label="Loading your offerings…" />;
  if (offerErr)  return <ErrorState message={offerErr} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Attendance Sessions</h1>
        <p className="text-sm text-slate-400 mt-0.5">Create sessions and track student attendance</p>
      </div>

      {/* Create session form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 space-y-5 max-w-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-800">Create New Session</h2>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
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

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-600">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Week 5 Lecture"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {createErr && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
              {createErr}
            </p>
          )}

          <button
            type="submit"
            disabled={creating || !selectedId}
            className="w-full rounded-xl bg-[#0b2c4a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
          >
            {creating ? "Creating…" : "Create Session"}
          </button>
        </form>
      </div>

      {/* Created sessions this page load */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Sessions Created This Visit
          </h2>
          {sessions.map((s, i) => {
            const sessionId = s.id ?? s.sessionId ?? s.Id;
            return (
              <div key={sessionId ?? i} className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Session created
                      {s.notes ? ` · ${s.notes}` : ""}
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Share this Session ID with your students so they can check in.
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-1 ring-emerald-100">
                  <code className="flex-1 break-all text-xs font-mono text-slate-700">
                    {sessionId}
                  </code>
                  <CopyButton text={sessionId} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Guidance */}
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100 max-w-lg shadow-sm">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <p className="text-sm font-bold text-slate-700">How it works</p>
        </div>
        <ol className="space-y-2">
          {[
            "Select the subject offering and create a session.",
            "Share the generated Session ID with your students (on the board or verbally).",
            "Students go to Attendance → Check-in and paste the Session ID.",
            "View student attendance reports from the Admin panel.",
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-slate-500">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default ProfessorAttendancePage;
