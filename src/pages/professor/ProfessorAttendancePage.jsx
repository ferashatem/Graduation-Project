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

  const selectedOffering = offerings.find((o) => (o.id ?? o.subjectOfferingId) === selectedId);

  return (
    <div className="space-y-8">
      <PageHeader title="Attendance Sessions" />

      {/* Create session form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5 max-w-lg">
        <h2 className="text-sm font-bold text-slate-700">Create New Session</h2>

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
      <div className="rounded-2xl bg-slate-50 p-5 ring-1 ring-slate-200 max-w-lg">
        <p className="text-xs font-semibold text-slate-600 mb-2">How it works</p>
        <ol className="list-decimal list-inside space-y-1 text-xs text-slate-500">
          <li>Select the subject offering and create a session.</li>
          <li>Share the generated Session ID with your students (on the board or verbally).</li>
          <li>Students go to Attendance → Check-In and paste the Session ID.</li>
          <li>View student attendance reports from the Admin panel.</li>
        </ol>
      </div>
    </div>
  );
}

export default ProfessorAttendancePage;
