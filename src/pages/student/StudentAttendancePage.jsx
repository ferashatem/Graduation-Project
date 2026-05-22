import { useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import apiClient from "../../api/apiClient";

function StudentAttendancePage() {
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null); // { ok: bool, message: string }

  const handleSubmit = async (e) => {
    e.preventDefault();
    const id = sessionId.trim();
    if (!id) return;
    setLoading(true);
    setResult(null);
    try {
      await apiClient.post("/attendance/check-in", { sessionId: id });
      setResult({ ok: true, message: "Attendance recorded successfully!" });
      setSessionId("");
    } catch (err) {
      const msg = err?.response?.data?.message
        ?? err?.response?.data
        ?? err?.message
        ?? "Failed to record attendance.";
      setResult({ ok: false, message: typeof msg === "string" ? msg : "Failed to record attendance." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Attendance Check-In" />

      <div className="max-w-md">
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-700">Session ID</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter the Session ID provided by your doctor to mark your attendance.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              placeholder="Paste session ID here…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              disabled={loading || !sessionId.trim()}
              className="w-full rounded-xl bg-[#0b2c4a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50 transition"
            >
              {loading ? "Recording…" : "Check In"}
            </button>
          </form>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
              result.ok
                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-red-50 text-red-700 ring-1 ring-red-200"
            }`}>
              {result.message}
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-400 text-center">
          You can only check in once per session. Contact your doctor if you have issues.
        </p>
      </div>
    </div>
  );
}

export default StudentAttendancePage;
