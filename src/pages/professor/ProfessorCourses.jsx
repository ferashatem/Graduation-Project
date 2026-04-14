import { useCallback, useEffect, useMemo, useState } from "react";
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

function ProfessorCourses() {
  const { user, authLoading } = useAuthUser();

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [error, setError] = useState("");
  const [indexWarning, setIndexWarning] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
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

  const sortedAssignments = useMemo(() => {
    const items = [...assignments];
    items.sort(
      (a, b) => getTimestampValue(b.createdAt) - getTimestampValue(a.createdAt)
    );
    return items;
  }, [assignments]);

  const rows = useMemo(
    () =>
      sortedAssignments.map((assignment) => ({
        id: assignment.id,
        courseName: resolveCourseName(assignment),
        termId: assignment.termId || "-",
        createdAtLabel: formatDate(assignment.createdAt),
        assistantCount: assignment.assistantIds?.length || 0,
      })),
    [sortedAssignments]
  );

  const filteredRows = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => {
      const values = [row.courseName, row.termId];
      return values.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [rows, searchTerm]);

  const emptyMessage = useMemo(() => {
    if (searchTerm.trim()) return "No courses match your search.";
    return "No courses assigned yet.";
  }, [searchTerm]);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  if (authLoading || loadingAssignments) {
    return <Loading label="Loading courses..." />;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="My Courses" />

      {indexWarning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {indexWarning}
        </div>
      ) : null}

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Search courses
          <input
            type="search"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search by course name or term"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Course</th>
              <th className="px-4 py-3 text-left font-semibold">Term</th>
              <th className="px-4 py-3 text-left font-semibold">Created At</th>
              <th className="px-4 py-3 text-left font-semibold">Assistants</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-6 text-center text-sm text-slate-500"
                  colSpan={4}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium">{row.courseName}</td>
                  <td className="px-4 py-3">{row.termId}</td>
                  <td className="px-4 py-3">{row.createdAtLabel}</td>
                  <td className="px-4 py-3">{row.assistantCount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProfessorCourses;
