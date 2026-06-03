import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { db } from "../../firebase/firebaseConfig";
import { getErrorMessage } from "../../utils/errorHelpers";

const safeText = (value, fallback = "-") => {
  if (value === 0) return "0";
  if (value === null || value === undefined || value === "") return fallback;
  return String(value);
};

const formatTimestamp = (value) => {
  if (!value) return "-";
  if (typeof value.toDate === "function") {
    return value.toDate().toLocaleString("en-US");
  }
  if (typeof value.seconds === "number") {
    return new Date(value.seconds * 1000).toLocaleString("en-US");
  }
  if (value instanceof Date) {
    return value.toLocaleString("en-US");
  }
  return safeText(value);
};

const resolveUserName = (user) =>
  user?.name || user?.displayName || user?.fullName || user?.email || "";

const fetchUserById = async (userId) => {
  if (!userId) return null;
  const snapshot = await getDoc(doc(db, "users", userId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
};

function CourseDetailsPage() {
  const { collegeId, yearId, departmentId, deptId, courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [professor, setProfessor] = useState(null);
  const [assistant, setAssistant] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedSection, setExpandedSection] = useState(null);

  const resolvedDepartmentId = departmentId || deptId || "";

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: "Years", to: `/admin/colleges/${collegeId}/years` },
      {
        label: "Departments",
        to: `/admin/colleges/${collegeId}/years/${yearId}/departments`,
      },
      { label: "Courses", to: `/admin/colleges/${collegeId}/years/${yearId}/departments/${resolvedDepartmentId}/courses` },
      { label: "Course Details" },
    ],
    [collegeId, yearId, resolvedDepartmentId]
  );

  const courseFields = useMemo(() => {
    if (!course) return [];
    return [
      { label: "Course Name", value: safeText(course?.name) },
      { label: "Code", value: safeText(course?.code) },
      { label: "Credit Hours", value: safeText(course?.creditHours) },
      { label: "Created At", value: formatTimestamp(course?.createdAt) },
      { label: "Updated At", value: formatTimestamp(course?.updatedAt) },
    ];
  }, [course]);

  const professorSummary = useMemo(() => {
    if (!professor) return "No professor assigned";
    return resolveUserName(professor) || "Professor";
  }, [professor]);

  const assistantSummary = useMemo(() => {
    if (!assistant || assistant.length === 0) return "No assistant assigned";
    const first = resolveUserName(assistant[0]) || "Assistant";
    if (assistant.length === 1) return first;
    return `${first} +${assistant.length - 1}`;
  }, [assistant]);

  const loadCourse = useCallback(async () => {
    if (!collegeId || !yearId || !resolvedDepartmentId || !courseId) {
      setError("Course path is missing.");
      setCourse(null);
      setProfessor(null);
      setAssistant([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const courseRef = doc(
        db,
        "colleges",
        collegeId,
        "years",
        yearId,
        "departments",
        resolvedDepartmentId,
        "courses",
        courseId
      );
      const snapshot = await getDoc(courseRef);
      if (!snapshot.exists()) {
        setCourse(null);
        setProfessor(null);
        setAssistant([]);
        setError("Course not found.");
        return;
      }

      const courseData = { id: snapshot.id, ...snapshot.data() };
      const professorId = courseData?.professorId || "";
      const assistantIds = Array.isArray(courseData?.assistantIds)
        ? courseData.assistantIds
        : courseData?.assistantId
        ? [courseData.assistantId]
        : [];
      const uniqueAssistantIds = Array.from(
        new Set(assistantIds.map((id) => String(id || "").trim()).filter(Boolean))
      );

      const [professorProfile, ...assistantProfiles] = await Promise.all([
        professorId ? fetchUserById(professorId) : Promise.resolve(null),
        ...uniqueAssistantIds.map((id) => fetchUserById(id)),
      ]);

      setCourse(courseData);
      setProfessor(professorProfile);
      setAssistant(assistantProfiles.filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load course details."));
      setCourse(null);
      setProfessor(null);
      setAssistant([]);
    } finally {
      setLoading(false);
    }
  }, [collegeId, courseId, resolvedDepartmentId, yearId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleBack = useCallback(() => {
    if (!collegeId || !yearId || !resolvedDepartmentId) {
      navigate("/admin/colleges");
      return;
    }
    navigate(
      `/admin/colleges/${collegeId}/years/${yearId}/departments/${resolvedDepartmentId}/courses`
    );
  }, [collegeId, navigate, resolvedDepartmentId, yearId]);

  const handleToggleSection = useCallback((sectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  }, []);

  const isProfessorExpanded = expandedSection === "professor";
  const isAssistantExpanded = expandedSection === "assistant";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Course Details"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="outlined" onClick={handleBack}>
            Back to Courses
          </Button>
        }
      />

      {error && !loading ? <ErrorState message={error} onRetry={loadCourse} /> : null}

      {loading ? (
        <Loading label="Loading course..." />
      ) : !course ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm ring-1 ring-slate-200">
          Course not found.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-4 sm:grid-cols-2">
              {courseFields.map((field) => (
                <div key={field.label}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {field.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-800">{field.value}</p>
                </div>
              ))}
            </div>

            {course?.description ? (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Description
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {safeText(course?.description)}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="text-sm font-semibold text-slate-700">Staff</div>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => handleToggleSection("professor")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-left transition hover:border-slate-300"
                aria-expanded={isProfessorExpanded}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Professor</p>
                    <p className="text-xs text-slate-500">{professorSummary}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isProfessorExpanded ? "Hide" : "Show"}
                  </span>
                </div>
                {isProfessorExpanded ? (
                  <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Name
                      </p>
                      <p className="mt-1">
                        {safeText(resolveUserName(professor), "Unknown")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Email
                      </p>
                      <p className="mt-1">{safeText(professor?.email)}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                        Phone
                      </p>
                      <p className="mt-1">
                        {safeText(professor?.phone || professor?.phoneNumber)}
                      </p>
                    </div>
                  </div>
                ) : null}
              </button>

              <button
                type="button"
                onClick={() => handleToggleSection("assistant")}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/40 px-4 py-3 text-left transition hover:border-slate-300"
                aria-expanded={isAssistantExpanded}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Assistant</p>
                    <p className="text-xs text-slate-500">{assistantSummary}</p>
                  </div>
                  <span className="text-xs text-slate-500">
                    {isAssistantExpanded ? "Hide" : "Show"}
                  </span>
                </div>
                {isAssistantExpanded ? (
                  <div className="mt-4 space-y-3">
                    {assistant.length === 0 ? (
                      <p className="text-sm text-slate-500">
                        No assistant assigned.
                      </p>
                    ) : (
                      assistant.map((item, index) => (
                        <div
                          key={`${item?.email || "assistant"}-${index}`}
                          className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3"
                        >
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Name
                            </p>
                            <p className="mt-1">
                              {safeText(resolveUserName(item), "Unknown")}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Email
                            </p>
                            <p className="mt-1">{safeText(item?.email)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                              Phone
                            </p>
                            <p className="mt-1">
                              {safeText(item?.phone || item?.phoneNumber)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetailsPage;
