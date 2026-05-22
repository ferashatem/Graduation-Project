import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchMySchedule, fetchMyToday } from "../../api/scheduleApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const DAYS = [
  { label: "Sun", number: 0 },
  { label: "Mon", number: 1 },
  { label: "Tue", number: 2 },
  { label: "Wed", number: 3 },
  { label: "Thu", number: 4 },
  { label: "Fri", number: 5 },
  { label: "Sat", number: 6 },
];

const TYPE_STYLES = {
  Lecture: "bg-blue-100 text-blue-800 border-blue-300",
  Section: "bg-green-100 text-green-800 border-green-300",
  Lab: "bg-orange-100 text-orange-800 border-orange-300",
};

const TYPE_DOT = {
  Lecture: "bg-blue-500",
  Section: "bg-green-500",
  Lab: "bg-orange-500",
};

function ScheduleCard({ entry }) {
  const typeStyle = TYPE_STYLES[entry.type] || "bg-slate-100 text-slate-800 border-slate-300";
  const dot = TYPE_DOT[entry.type] || "bg-slate-400";

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${typeStyle}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm leading-tight">
            {entry.subjectName || entry.subjectCode}
          </p>
          <div className="mt-0.5 flex flex-wrap gap-2 text-xs opacity-80">
            {entry.batchName && <span>{entry.batchName}</span>}
            {entry.groupName && <span>· {entry.groupName}</span>}
          </div>
        </div>
        <span className="mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium bg-white/60 border">
          {entry.type}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs">
        <span className="font-semibold">
          {entry.startTime} – {entry.endTime}
        </span>
        {entry.location && <span className="opacity-70">📍 {entry.location}</span>}
        {entry.dayOfWeek && <span className="opacity-70">{entry.dayOfWeek}</span>}
      </div>
      {entry.weekType && entry.weekType !== "All" && (
        <span className="mt-1 inline-block rounded-full bg-white/50 px-2 py-0.5 text-[11px] border">
          {entry.weekType === "Odd" ? "Week A" : "Week B"}
        </span>
      )}
      {entry.isNow && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full animate-pulse ${dot}`} />
          <span className="text-xs font-semibold">HAPPENING NOW</span>
        </div>
      )}
    </div>
  );
}

function WeekGrid({ entries }) {
  const byDay = DAYS.map((d) => ({
    ...d,
    slots: entries
      .filter((e) => {
        const n = e.dayOfWeekNumber ?? e.dayOfWeekNumber;
        const name = e.dayOfWeek;
        return n === d.number || name === d.label;
      })
      .sort((a, b) => a.startTime?.localeCompare(b.startTime)),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {byDay.map((day) => (
        <div key={day.number} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">
            {day.label}
          </h3>
          {day.slots.length === 0 ? (
            <p className="text-xs text-slate-400">No classes</p>
          ) : (
            <div className="space-y-2">
              {day.slots.map((e) => (
                <ScheduleCard key={e.id} entry={e} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProfessorSchedulePage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mode, setMode] = useState("today"); // "today" | "week"

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = mode === "today" ? await fetchMyToday() : await fetchMySchedule();
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load schedule."));
    } finally {
      setLoading(false);
    }
  }, [mode]);

  useEffect(() => { loadSchedule(); }, [loadSchedule]);

  const todayNumber = new Date().getDay();
  const todayLabel = DAYS.find((d) => d.number === todayNumber)?.label ?? "";

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <PageHeader title="My Teaching Schedule" />

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("today")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "today"
              ? "bg-green-600 text-white shadow"
              : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          Today ({todayLabel})
        </button>
        <button
          type="button"
          onClick={() => setMode("week")}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            mode === "week"
              ? "bg-green-600 text-white shadow"
              : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
          }`}
        >
          Full Week
        </button>
      </div>

      {loading && <Loading label="Loading schedule…" />}
      {!loading && error && <ErrorState message={error} onRetry={loadSchedule} />}
      {!loading && !error && (
        <>
          {mode === "week" ? (
            <WeekGrid entries={entries} />
          ) : (
            <div className="space-y-3 max-w-xl">
              {entries.length === 0 ? (
                <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
                  <p className="text-slate-500">No classes scheduled for today.</p>
                </div>
              ) : (
                entries.map((e) => <ScheduleCard key={e.id} entry={e} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProfessorSchedulePage;
