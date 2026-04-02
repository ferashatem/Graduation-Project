import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { getErrorMessage } from "../../utils/errorHelpers";

function AssistantCoursesPage() {
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

    const q = query(
      collection(db, "courseAssignments"),
      where("assistantUids", "array-contains", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setAssignments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(getErrorMessage(err, "Failed to load courses."));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, refreshKey]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  const cards = useMemo(
    () =>
      assignments.map((a) => ({
        id: a.id,
        courseName: a.courseName || "Untitled course",
        courseCode: a.courseCode || "-",
        term: a.term || a.termId || "-",
        yearLevel: a.yearLevel,
        section: a.section,
        schedule: Array.isArray(a.schedule) ? a.schedule : [],
      })),
    [assignments]
  );

  if (authLoading || loading) {
    return <Loading label="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No courses assigned yet.
          </div>
        ) : (
          cards.map((course) => (
            <article
              key={course.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800">
                  {course.courseName}
                </h3>
                {course.courseCode !== "-" ? (
                  <p className="text-xs font-semibold tracking-wide text-emerald-600">
                    {course.courseCode}
                  </p>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Term</span>
                  <span className="text-slate-500">{course.term}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Year</span>
                  <span className="text-slate-500">
                    {course.yearLevel ? `Year ${course.yearLevel}` : "-"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Section</span>
                  <span className="text-slate-500">
                    {course.section ? `§${course.section}` : "-"}
                  </span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-slate-700 shrink-0">Schedule</span>
                  <div className="text-right text-slate-500">
                    {course.schedule.length === 0 ? (
                      <span>TBD</span>
                    ) : (
                      course.schedule.map((entry, i) => {
                        const day = entry.day || "";
                        const start = entry.startTime || "";
                        const end = entry.endTime || "";
                        const label = start && end ? `${day} ${start} - ${end}`.trim() : day;
                        return <p key={i}>{label}</p>;
                      })
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  TA
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AssistantCoursesPage;
