import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";

const getTimestampValue = (ts) => {
  if (!ts) return 0;
  if (typeof ts.toDate === "function") return ts.toDate().getTime();
  if (typeof ts.seconds === "number") return ts.seconds * 1000;
  if (ts instanceof Date) return ts.getTime();
  const n = Number(ts);
  return Number.isNaN(n) ? 0 : n;
};

const formatDate = (ts) => {
  if (!ts) return "-";
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleDateString("en-US");
  if (typeof ts.seconds === "number")
    return new Date(ts.seconds * 1000).toLocaleDateString("en-US");
  return "-";
};

function ProfessorHome() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser, profile, profileLoading } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
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

    const q = query(
      collection(db, "courseAssignments"),
      where("professorUid", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(getErrorMessage(err, "Failed to load assignments."));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, refreshKey]);

  const profileSummary = useMemo(() => {
    const data = profile || {};
    return {
      name:
        data.fullName ||
        data.Full_Name ||
        data.name ||
        data.displayName ||
        user?.displayName ||
        "Professor",
      email: data.email || data.Email || user?.email || "Not available",
      college:
        data.collegeName ||
        data.college ||
        data.collegeId ||
        data.collegeCode ||
        "Not available",
    };
  }, [profile, user]);

  const termOptions = useMemo(() => {
    const terms = assignments.map((a) => a.term || a.termId).filter(Boolean);
    return Array.from(new Set(terms)).sort((a, b) => String(a).localeCompare(String(b)));
  }, [assignments]);

  useEffect(() => {
    if (selectedTerm && !termOptions.includes(selectedTerm)) setSelectedTerm("");
  }, [selectedTerm, termOptions]);

  const filteredAssignments = useMemo(() => {
    if (!selectedTerm) return assignments;
    return assignments.filter((a) => (a.term || a.termId) === selectedTerm);
  }, [assignments, selectedTerm]);

  const recentAssignments = useMemo(
    () =>
      [...assignments]
        .sort((a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt))
        .slice(0, 5),
    [assignments]
  );

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if ((authLoading && !outletUser) || loading || profileLoading) {
    return <Loading label="Loading professor dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Professor Home" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                {profileSummary.name}
              </h2>
              <p className="text-sm text-slate-500">{profileSummary.email}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">College:</span>{" "}
              {profileSummary.college}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-700">Current term</p>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All terms</option>
            {termOptions.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total assigned courses" value={assignments.length} />
        <StatCard
          label={selectedTerm ? `Courses in ${selectedTerm}` : "Courses in all terms"}
          value={filteredAssignments.length}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Recent assigned courses
        </h3>
        <div className="mt-4 space-y-3">
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-slate-500">No assignments yet.</p>
          ) : (
            recentAssignments.map((a) => (
              <div
                key={a.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {a.courseName || "Untitled course"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Term: {a.term || a.termId || "-"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  Assigned {formatDate(a.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export default ProfessorHome;
