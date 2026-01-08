import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { resolveUsersByIds } from "../../features/users/api/usersApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchCourseById } from "./courseService";

const formatValue = (value, fallback = "N/A") => {
  if (value === 0) return "0";
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const mapDoc = (snapshot) => ({ id: snapshot.id, ...snapshot.data() });

const formatUserLabel = (user) =>
  user?.fullName || user?.email || user?.uid || "Unknown user";

function CourseDetailsPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const assignmentsRef = useMemo(() => collection(db, "courseAssignments"), [db]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [assignmentsError, setAssignmentsError] = useState("");

  const loadCourse = useCallback(async () => {
    if (!courseId) {
      setError("Course id is missing.");
      setCourse(null);
      setNotFound(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    setNotFound(false);

    try {
      const data = await fetchCourseById(db, courseId);
      if (!data) {
        setCourse(null);
        setNotFound(true);
        return;
      }
      setCourse(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [courseId, db]);

  const loadAssignments = useCallback(async () => {
    if (!courseId) {
      setAssignments([]);
      setAssignmentsError("");
      setAssignmentsLoading(false);
      return;
    }

    setAssignmentsLoading(true);
    setAssignmentsError("");

    try {
      const assignmentsQuery = query(
        assignmentsRef,
        where("courseId", "==", courseId)
      );
      const assignmentsSnap = await getDocs(assignmentsQuery);
      const rawAssignments = assignmentsSnap.docs.map(mapDoc);

      if (rawAssignments.length === 0) {
        setAssignments([]);
        return;
      }

      const userIds = [];
      rawAssignments.forEach((assignment) => {
        (assignment.professorIds || []).forEach((id) => userIds.push(id));
        (assignment.assistantIds || []).forEach((id) => userIds.push(id));
        if (assignment.createdBy) userIds.push(assignment.createdBy);
      });

      const usersById = await resolveUsersByIds(db, userIds);
      const enrichedAssignments = rawAssignments.map((assignment) => {
        const professors = (assignment.professorIds || [])
          .map((id) => usersById[id] || null)
          .filter(Boolean);
        const assistants = (assignment.assistantIds || [])
          .map((id) => usersById[id] || null)
          .filter(Boolean);
        const createdByUser = usersById[assignment.createdBy] || null;

        return {
          ...assignment,
          professors,
          assistants,
          createdByUser,
        };
      });

      setAssignments(enrichedAssignments);
    } catch (err) {
      setAssignments([]);
      setAssignmentsError(getErrorMessage(err));
    } finally {
      setAssignmentsLoading(false);
    }
  }, [assignmentsRef, courseId, db]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const primaryKeys = useMemo(
    () => ["name", "code", "creditHours", "department", "description"],
    []
  );

  const extraDetails = useMemo(() => {
    if (!course) return {};
    return Object.keys(course).reduce((acc, key) => {
      if (key === "id" || primaryKeys.includes(key)) return acc;
      acc[key] = course[key];
      return acc;
    }, {});
  }, [course, primaryKeys]);

  const extraDetailsJson = useMemo(
    () => JSON.stringify(extraDetails, null, 2),
    [extraDetails]
  );

  const hasExtraDetails = useMemo(
    () => Object.keys(extraDetails).length > 0,
    [extraDetails]
  );

  const handleToggleMore = useCallback(() => {
    setShowMore((prev) => !prev);
  }, []);

  const handleBack = useCallback(() => {
    navigate("/courses");
  }, [navigate]);

  const title = course?.name ? `Course: ${course.name}` : "Course Details";

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        action={
          <Button variant="outlined" onClick={handleBack}>
            Back to Courses
          </Button>
        }
      />

      {error && !loading ? (
        <ErrorState message={error} onRetry={loadCourse} />
      ) : null}

      {loading ? (
        <Loading label="Loading course..." />
      ) : error ? null : notFound || !course ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          Course not found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Name
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatValue(course?.name)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Code
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatValue(course?.code, "-")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Credit Hours
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatValue(course?.creditHours, "-")}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Department
                </p>
                <p className="mt-1 text-sm text-slate-800">
                  {formatValue(course?.department ?? course?.departmentName, "-")}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Description
              </p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                {formatValue(course?.description)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-semibold text-slate-700">
              Assigned Staff
            </div>
            {assignmentsLoading ? (
              <p className="mt-2 text-sm text-slate-500">Loading staff...</p>
            ) : assignmentsError ? (
              <p className="mt-2 text-sm text-red-600">{assignmentsError}</p>
            ) : assignments.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                No staff assigned yet.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {assignment.termLabel || assignment.termId || "Term"}
                    </div>
                    <div className="mt-2 text-sm text-slate-700">
                      Professors:{" "}
                      {assignment.professors?.length
                        ? assignment.professors.map(formatUserLabel).join(", ")
                        : "None"}
                    </div>
                    <div className="text-sm text-slate-700">
                      Assistants:{" "}
                      {assignment.assistants?.length
                        ? assignment.assistants.map(formatUserLabel).join(", ")
                        : "None"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <button
              type="button"
              onClick={handleToggleMore}
              className="flex w-full items-center justify-between text-sm font-semibold text-slate-700"
              aria-expanded={showMore}
              aria-controls="course-extra-details"
            >
              <span>More details</span>
              <span>{showMore ? "Hide" : "Show"}</span>
            </button>
            {showMore ? (
              <div id="course-extra-details" className="mt-4">
                {hasExtraDetails ? (
                  <pre className="overflow-x-auto rounded-xl bg-slate-50 p-4 text-xs text-slate-700">
                    {extraDetailsJson}
                  </pre>
                ) : (
                  <p className="text-sm text-slate-500">No extra details.</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetailsPage;
