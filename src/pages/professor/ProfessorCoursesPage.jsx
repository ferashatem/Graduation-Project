import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { useAuthUser } from "../../auth/useAuthUser";
import { listenProfessorCourses } from "../../firebase/profCoursesApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const resolveCourseName = (course) =>
  course?.courseName ||
  course?.CourseName ||
  course?.courseLabel ||
  "Untitled course";

function ProfessorCoursesPage() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setCourses([]);
      setLoadingCourses(false);
      return;
    }

    setLoadingCourses(true);
    setError("");

    const unsubscribe = listenProfessorCourses(
      user.uid,
      (items) => {
        setCourses(items);
        setLoadingCourses(false);
      },
      (err) => {
        setError(getErrorMessage(err, "Failed to load courses."));
        setLoadingCourses(false);
      }
    );

    return () => unsubscribe();
  }, [authLoading, user?.uid, refreshKey]);

  const courseCards = useMemo(
    () =>
      courses.map((course) => ({
        id: course.id,
        courseName: resolveCourseName(course),
        collegeName: course.collegeName || "-",
        courseId: course.courseId || "-",
        assistantCount: Array.isArray(course.assistantIds)
          ? course.assistantIds.length
          : 0,
        termId: course.termId || "-",
      })),
    [courses]
  );

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  if (authLoading || loadingCourses) {
    return <Loading label="Loading courses..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {courseCards.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No courses assigned yet.
          </div>
        ) : (
          courseCards.map((course) => (
            <article
              key={course.id}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-800">
                  {course.courseName}
                </h3>
                <p className="text-xs text-slate-500">{course.collegeName}</p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Course ID</span>
                  <span className="text-slate-500">{course.courseId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Assistants</span>
                  <span className="text-slate-500">
                    {course.assistantCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Term</span>
                  <span className="text-slate-500">{course.termId}</span>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default ProfessorCoursesPage;
