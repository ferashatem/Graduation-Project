import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOutletContext } from "react-router-dom";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuthUser } from "../../auth/useAuthUser";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import AssistantUploadModal from "../../components/assistant/AssistantUploadModal";
import { listenAssignmentMaterials } from "../../firebase/assignmentMaterialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function SectionMaterialsPanel({ assignmentId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    setLoading(true);
    const unsub = listenAssignmentMaterials(
      assignmentId,
      (items) => { setMaterials(items); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, [assignmentId]);

  if (loading) return <p className="text-xs text-slate-400">Loading materials…</p>;
  if (materials.length === 0) return <p className="text-xs text-slate-400">No materials uploaded yet.</p>;

  return (
    <ul className="space-y-2">
      {materials.map((m) => (
        <li key={m.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-700">
              {m.lectureNumber != null ? `Lec ${m.lectureNumber}: ` : ""}
              {m.lectureTitle || "Untitled"}
            </p>
            {m.notes ? <p className="text-xs text-slate-500">{m.notes}</p> : null}
          </div>
          <a
            href={m.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            View PDF
          </a>
        </li>
      ))}
    </ul>
  );
}

function AssistantCourseCard({ course, assignment, user, profile }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const assistantName = useMemo(
    () => profile?.fullName || profile?.name || user?.displayName || "",
    [profile, user]
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800">{course.courseName}</h3>
          {course.courseCode !== "-" ? (
            <p className="text-xs font-semibold tracking-wide text-emerald-600">{course.courseCode}</p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Term</span>
            <span className="text-slate-500">{course.term}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Year</span>
            <span className="text-slate-500">{course.yearLevel ? `Year ${course.yearLevel}` : "-"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-slate-700">Section</span>
            <span className="text-slate-500">{course.section ? `§${course.section}` : "-"}</span>
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

        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            TA
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMaterialsOpen((o) => !o)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {materialsOpen ? "Hide Materials" : "Materials"}
            </button>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              + Upload
            </button>
          </div>
        </div>
      </div>

      {materialsOpen ? (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Section Materials
          </p>
          <SectionMaterialsPanel assignmentId={course.id} />
        </div>
      ) : null}

      <AssistantUploadModal
        open={uploadOpen}
        assistantId={user?.uid}
        assistantName={assistantName}
        assignment={assignment}
        onClose={() => setUploadOpen(false)}
        onCreated={() => setUploadOpen(false)}
      />
    </article>
  );
}

function AssistantCoursesPage() {
  const outletContext = useOutletContext() || {};
  const { user: outletUser, profile } = outletContext;
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
      where("assistantIds", "array-contains", user.uid)
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
        courseName: a.courseName || a.CourseName || "Untitled course",
        courseCode: a.courseCode || "-",
        term: a.term || a.termId || "-",
        yearLevel: a.yearLevel,
        section: a.section,
        schedule: Array.isArray(a.schedule) ? a.schedule : [],
        courseId: a.courseId || "",
        CourseName: a.CourseName || a.courseName || "",
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

      {cards.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No courses assigned yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((course) => (
            <AssistantCourseCard
              key={course.id}
              course={course}
              assignment={course}
              user={user}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default AssistantCoursesPage;
