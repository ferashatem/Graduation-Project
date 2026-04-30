import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";
import { Button } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import CourseMaterialsSection from "../../components/professor/CourseMaterialsSection";
import AIChat from "../../components/professor/course-ai/AIChat";
import { fetchOffering } from "../../features/professor/api/professorBackendApi";

function ProfessorCourseDetailsPage() {
  const { courseDocId } = useParams();
  const { user, profile, profileLoading } = useOutletContext() || {};
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

  const professorUid = user?.uid ?? user?.id ?? "";

  const loadCourse = useCallback(async () => {
    if (!courseDocId) {
      setError("Course ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const data = await fetchOffering(courseDocId);
      if (!data) { setNotFound(true); return; }
      setCourse(data);
    } catch (e) {
      if (e?.response?.status === 404) {
        setNotFound(true);
      } else {
        setError(e?.response?.data?.message ?? e?.message ?? "Failed to load course details.");
      }
    } finally {
      setLoading(false);
    }
  }, [courseDocId]);

  useEffect(() => {
    if (profileLoading) return;
    loadCourse();
  }, [profileLoading, loadCourse, refreshKey]);

  const courseSummary = useMemo(() => {
    if (!course) return null;
    return {
      name: course.subjectName ?? course.courseName ?? course.name ?? "Untitled",
      courseId: course.id ?? course.code ?? "-",
      collegeName: course.collegeName ?? course.college ?? "-",
      departmentName: course.departmentName ?? course.department ?? "-",
      semesterName: course.semesterName ?? course.term ?? course.termName ?? "-",
      creditHours: course.creditHours ?? course.credits ?? null,
    };
  }, [course]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Courses", to: `${basePath}/courses` },
      { label: courseSummary?.name || "Course Details" },
    ],
    [basePath, courseSummary?.name]
  );

  const courseForMaterials = useMemo(
    () => course ? { id: courseDocId, courseName: courseSummary?.name, termId: courseSummary?.semesterName } : null,
    [course, courseDocId, courseSummary]
  );

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);
  const handleBack = useCallback(() => navigate(`${basePath}/courses`), [basePath, navigate]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={courseSummary?.name || "Course Details"}
        breadcrumbs={breadcrumbs}
        action={<Button variant="outlined" onClick={handleBack}>Back to Courses</Button>}
      />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {profileLoading || loading ? (
        <Loading label="Loading course..." />
      ) : error ? null : notFound || !course ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Course not found.
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-800">{courseSummary?.name}</h2>
              <p className="text-sm text-slate-500">{courseSummary?.collegeName}</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow label="Course ID" value={courseSummary?.courseId} />
              <InfoRow label="Department" value={courseSummary?.departmentName} />
              <InfoRow label="Semester" value={courseSummary?.semesterName} />
              {courseSummary?.creditHours && <InfoRow label="Credit Hours" value={courseSummary.creditHours} />}
            </div>
          </div>

          {courseForMaterials && (
            <CourseMaterialsSection professorId={professorUid} course={courseForMaterials} />
          )}

          <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <AIChat
              professorId={professorUid}
              courseDocId={courseDocId}
              courseName={courseSummary?.name}
            />
          </div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value || "-"}</span>
    </div>
  );
}

export default ProfessorCourseDetailsPage;
