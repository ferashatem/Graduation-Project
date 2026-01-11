import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { useAuthUser } from "../../auth/useAuthUser";
import { listenProfessorAssignments } from "../../firebase/professorApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const resolveCourseName = (assignment) =>
  assignment?.CourseName ||
  assignment?.courseName ||
  assignment?.courseLabel ||
  "Untitled course";

const getTimestampValue = (timestamp) => {
  if (!timestamp) return 0;
  if (typeof timestamp.toDate === "function") return timestamp.toDate().getTime();
  if (typeof timestamp.seconds === "number") return timestamp.seconds * 1000;
  if (timestamp instanceof Date) return timestamp.getTime();
  const numeric = Number(timestamp);
  return Number.isNaN(numeric) ? 0 : numeric;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "-";
  if (typeof timestamp.toDate === "function") {
    return timestamp.toDate().toLocaleDateString("en-US");
  }
  if (typeof timestamp.seconds === "number") {
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US");
  }
  return "-";
};

function ProfessorHome() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser, profile, profileLoading } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState("");
  const [indexWarning, setIndexWarning] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setAssignments([]);
      setLoadingAssignments(false);
      return;
    }

    setLoadingAssignments(true);
    setError("");
    setIndexWarning("");

    const unsubscribe = listenProfessorAssignments(
      user.uid,
      {},
      (items) => {
        setAssignments(items);
        setLoadingAssignments(false);
      },
      (err, context) => {
        if (context?.fallback) {
          setIndexWarning(
            "Sorting requires a Firestore index. Showing results without server sorting."
          );
          return;
        }
        setError(getErrorMessage(err, "Failed to load assignments."));
        setLoadingAssignments(false);
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
    const terms = assignments
      .map((assignment) => assignment.termId)
      .filter(Boolean);
    return Array.from(new Set(terms)).sort((a, b) =>
      String(a).localeCompare(String(b))
    );
  }, [assignments]);

  useEffect(() => {
    if (selectedTerm && !termOptions.includes(selectedTerm)) {
      setSelectedTerm("");
    }
  }, [selectedTerm, termOptions]);

  const filteredAssignments = useMemo(() => {
    if (!selectedTerm) return assignments;
    return assignments.filter((assignment) => assignment.termId === selectedTerm);
  }, [assignments, selectedTerm]);

  const recentAssignments = useMemo(() => {
    const sorted = [...assignments].sort(
      (a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt)
    );
    return sorted.slice(0, 5);
  }, [assignments]);

  const totalAssigned = useMemo(() => assignments.length, [assignments]);
  const currentTermCount = useMemo(
    () => filteredAssignments.length,
    [filteredAssignments]
  );

  const handleTermChange = useCallback((event) => {
    setSelectedTerm(event.target.value);
  }, []);

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  if ((authLoading && !outletUser) || loadingAssignments || profileLoading) {
    return <Loading label="Loading professor dashboard..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Professor Home" />

      {indexWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {indexWarning}
        </div>
      ) : null}

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
            onChange={handleTermChange}
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
        <StatCard label="Total assigned courses" value={totalAssigned} />
        <StatCard
          label={selectedTerm ? `Courses in ${selectedTerm}` : "Courses in all terms"}
          value={currentTermCount}
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
            recentAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {resolveCourseName(assignment)}
                  </p>
                  <p className="text-xs text-slate-500">
                    Term: {assignment.termId || "-"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  Assigned {formatDate(assignment.createdAt)}
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
