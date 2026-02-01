import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { Button } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import CourseMaterialsSection from "../../components/professor/CourseMaterialsSection";
import { useAuthUser } from "../../auth/useAuthUser";
import { getProfessorCourseById } from "../../firebase/profCoursesApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const resolveCourseName = (course) =>
  course?.courseName ||
  course?.CourseName ||
  course?.courseLabel ||
  "Untitled course";

function ProfessorCourseDetailsPage() {
  const { courseDocId } = useParams();
  const outletContext = useOutletContext() || {};
  const { user: outletUser } = outletContext;
  const { user: authUser, authLoading } = useAuthUser();
  const user = outletUser || authUser;
  const navigate = useNavigate();
  const location = useLocation();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const basePath = useMemo(
    () => (location.pathname.startsWith("/professor") ? "/professor" : "/prof"),
    [location.pathname]
  );

  const loadCourse = useCallback(async () => {
    if (!user?.uid) {
      setCourse(null);
      setNotFound(false);
      setLoading(false);
      return;
    }
    if (!courseDocId) {
      setCourse(null);
      setNotFound(false);
      setError("Course id is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const data = await getProfessorCourseById(user.uid, courseDocId);
      if (!data) {
        setCourse(null);
        setNotFound(true);
        return;
      }
      setCourse(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load course details."));
    } finally {
      setLoading(false);
    }
  }, [courseDocId, user?.uid]);

  useEffect(() => {
    if (authLoading) return;
    loadCourse();
  }, [authLoading, loadCourse, refreshKey]);

  const courseSummary = useMemo(() => {
    if (!course) return null;
    return {
      name: resolveCourseName(course),
      courseId: course.courseId || "-",
      collegeName: course.collegeName || "-",
      assistantCount: Array.isArray(course.assistantIds)
        ? course.assistantIds.length
        : 0,
      termId: course.termId || "-",
    };
  }, [course]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Courses", to: `${basePath}/courses` },
      { label: courseSummary?.name || "Course Details" },
    ],
    [basePath, courseSummary?.name]
  );

  const handleRetry = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleBack = useCallback(() => {
    navigate(`${basePath}/courses`);
  }, [basePath, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={courseSummary?.name || "Course Details"}
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="outlined" onClick={handleBack}>
            Back to Courses
          </Button>
        }
      />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {authLoading || loading ? (
        <Loading label="Loading course..." />
      ) : error ? null : notFound || !course ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Course not found.
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-800">
                {courseSummary?.name}
              </h2>
              <p className="text-sm text-slate-500">
                {courseSummary?.collegeName}
              </p>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium text-slate-700">Course ID</span>
                <span className="text-slate-500">{courseSummary?.courseId}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium text-slate-700">Assistants</span>
                <span className="text-slate-500">
                  {courseSummary?.assistantCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span className="font-medium text-slate-700">Term</span>
                <span className="text-slate-500">{courseSummary?.termId}</span>
              </div>
            </div>
          </div>

          <CourseMaterialsSection professorId={user?.uid} course={course} />
        </>
      )}
    </div>
  );
}

export default ProfessorCourseDetailsPage;
