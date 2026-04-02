import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";

const mergeAssignments = (profDocs, taDocs) => {
  const map = new Map();
  for (const d of profDocs) map.set(d.id, { ...d, _role: "professor" });
  for (const d of taDocs) if (!map.has(d.id)) map.set(d.id, { ...d, _role: "ta" });
  return Array.from(map.values());
};

const formatSchedule = (schedule) => {
  if (!schedule) return "-";
  if (typeof schedule === "string") return schedule;
  const day = schedule.day || "";
  const start = schedule.startTime || "";
  const end = schedule.endTime || "";
  if (day && start && end) return `${day} ${start} – ${end}`;
  if (day && start) return `${day} ${start}`;
  return day || "-";
};

function ProfessorDashboard() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    let profDocs = [];
    let taDocs = [];
    let settled = 0;

    const finish = () => {
      settled += 1;
      if (settled >= 2) {
        setAssignments(mergeAssignments(profDocs, taDocs));
        setLoading(false);
      }
    };

    const qProf = query(
      collection(db, "courseAssignments"),
      where("professorUid", "==", user.uid)
    );
    const qTA = query(
      collection(db, "courseAssignments"),
      where("assistantUids", "array-contains", user.uid)
    );

    const unsubProf = onSnapshot(
      qProf,
      (snap) => {
        profDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssignments(mergeAssignments(profDocs, taDocs));
        setLoading(false);
      },
      (err) => {
        setError(getErrorMessage(err, "Failed to load assignments."));
        setLoading(false);
      }
    );

    const unsubTA = onSnapshot(
      qTA,
      (snap) => {
        taDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        finish();
      },
      () => finish()
    );

    return () => {
      unsubProf();
      unsubTA();
    };
  }, [authLoading, user?.uid, refreshKey]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (authLoading || loading) {
    return <Loading label="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Dashboard" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {assignments.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          No assignments found.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assignments.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="mb-4 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-slate-800">
                    {a.courseName || "Untitled Course"}
                  </h3>
                  {a._role === "ta" ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      TA
                    </span>
                  ) : null}
                </div>
                {a.courseCode ? (
                  <p className="text-xs font-semibold tracking-wide text-blue-600">
                    {a.courseCode}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2 text-sm">
                <Row label="Term" value={a.term || a.termId || "-"} />
                <Row
                  label="Section"
                  value={
                    a.section
                      ? `Year ${a.yearLevel || "?"} · §${a.section}`
                      : a.yearLevel
                      ? `Year ${a.yearLevel}`
                      : "-"
                  }
                />
                <Row
                  label="Building"
                  value={a.buildingName || a.buildingId || "-"}
                />
                <Row
                  label="Room"
                  value={a.roomNumber || a.roomId || "-"}
                />
                <Row label="Schedule" value={formatSchedule(a.schedule)} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-right text-slate-500">{value}</span>
    </div>
  );
}

export default ProfessorDashboard;
