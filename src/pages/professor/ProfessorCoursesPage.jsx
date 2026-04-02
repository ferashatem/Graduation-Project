import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { db } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import CourseMaterialsSection from "../../components/professor/CourseMaterialsSection";
import AddMaterialModal from "../../components/professor/AddMaterialModal";
import { getErrorMessage } from "../../utils/errorHelpers";

const formatScheduleEntry = (entry) => {
  if (!entry) return null;
  const day = entry.day || entry.Day || "";
  const start = entry.startTime || entry.start || entry.from || "";
  const end = entry.endTime || entry.end || entry.to || "";
  if (!day && !start) return null;
  if (start && end) return `${day} ${start} - ${end}`.trim();
  if (start) return `${day} ${start}`.trim();
  return day;
};

function CourseCard({ course, professorUid }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const scheduleEntries = useMemo(() => {
    if (!Array.isArray(course.schedule) || course.schedule.length === 0) return [];
    return course.schedule.map(formatScheduleEntry).filter(Boolean);
  }, [course.schedule]);

  // Shape expected by CourseMaterialsSection
  const courseForMaterials = useMemo(
    () => ({
      id: course.id,
      courseName: course.courseName,
      termId: course.term,
    }),
    [course.id, course.courseName, course.term]
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Main card info */}
      <div className="p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800">{course.courseName}</h3>
          {course.courseCode !== "-" ? (
            <p className="text-xs font-semibold tracking-wide text-emerald-600">
              {course.courseCode}
            </p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Term" value={course.term} />
          <Row label="Year" value={course.yearLevel ? `Year ${course.yearLevel}` : "-"} />
          <Row label="Section" value={course.section ? `§${course.section}` : "-"} />
          <Row label="Assistants" value={course.assistantCount} />

          {/* Building / Room */}
          <div className="pt-1 border-t border-slate-100" />
          <Row
            label="Building"
            value={
              course.building && course.room
                ? `${course.building} / ${course.room}`
                : course.building || course.room || "TBD"
            }
          />

          {/* Schedule */}
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-slate-700 shrink-0">Schedule</span>
            <div className="text-right text-slate-500">
              {scheduleEntries.length === 0 ? (
                <span>TBD</span>
              ) : (
                scheduleEntries.map((entry, i) => (
                  <p key={i}>{entry}</p>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            Professor
          </span>
          <button
            type="button"
            onClick={() => setMaterialsOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {materialsOpen ? (
              <>
                <HiChevronUp className="h-4 w-4" /> Hide Materials
              </>
            ) : (
              <>
                <HiChevronDown className="h-4 w-4" /> Materials
              </>
            )}
          </button>
        </div>
      </div>

      {/* Materials panel */}
      {materialsOpen ? (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Course Materials
            </p>
            <AddMaterialTrigger professorUid={professorUid} course={courseForMaterials} />
          </div>
          <CourseMaterialsSection
            professorId={professorUid}
            course={courseForMaterials}
          />
        </div>
      ) : null}
    </article>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value}</span>
    </div>
  );
}

// Thin wrapper that opens AddMaterialModal directly from the card header
function AddMaterialTrigger({ professorUid, course }) {
  const [open, setOpen] = useState(false);

  const handleCreated = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        + Upload
      </button>
      <AddMaterialModal
        open={open}
        professorId={professorUid}
        courses={course ? [course] : []}
        initialCourseDocId={course?.id}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </>
  );
}

function ProfessorCoursesPage() {
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
      where("professorUid", "==", user.uid)
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
        assistantCount: Array.isArray(a.assistantUids) ? a.assistantUids.length : 0,
        building: a.building || "",
        room: a.room || "",
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
            <CourseCard key={course.id} course={course} professorUid={user?.uid} />
          ))
        )}
      </div>
    </div>
  );
}

export default ProfessorCoursesPage;
