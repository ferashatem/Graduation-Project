import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  collection,
  collectionGroup,
  getDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import jsPDF from "jspdf";
import { db } from "../../firebase/firebaseConfig";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { listenAssignmentMaterials } from "../../firebase/assignmentMaterialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// ─── Section Materials Panel ──────────────────────────────────────────────────

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

  if (loading) return <p className="text-xs text-slate-400">Loading…</p>;
  if (materials.length === 0) return <p className="text-xs text-slate-400">No section materials yet.</p>;

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
            {m.uploaderName ? <p className="text-xs text-slate-400">By: {m.uploaderName}</p> : null}
          </div>
          <a
            href={m.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            View PDF
          </a>
        </li>
      ))}
    </ul>
  );
}

// ─── Course Card ─────────────────────────────────────────────────────────────

function CourseCard({ course }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const scheduleEntries = useMemo(() => {
    if (!Array.isArray(course.schedule) || course.schedule.length === 0) return [];
    return course.schedule.map((entry) => {
      const day = entry.day || entry.dayKey || "";
      const start = entry.startTime || entry.start || "";
      const end = entry.endTime || entry.end || "";
      if (!day && !start) return null;
      if (start && end) return `${day} ${start} - ${end}`.trim();
      return day || start;
    }).filter(Boolean);
  }, [course.schedule]);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 course-card">
      <div className="p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800">{course.courseName}</h3>
          {course.courseCode && course.courseCode !== "-" ? (
            <p className="text-xs font-semibold tracking-wide text-blue-600">{course.courseCode}</p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          {course.collegeName ? <Row label="College" value={course.collegeName} /> : null}
          {course.departmentName ? <Row label="Department" value={course.departmentName} /> : null}
          <Row label="Year" value={course.yearLabel || "-"} />
          <Row label="Section" value={course.section ? `§${course.section}` : "-"} />
          <div className="pt-1 border-t border-slate-100" />
          <Row
            label="Building"
            value={
              course.building && course.room
                ? `${course.building} / ${course.room}`
                : course.building || course.room || "TBD"
            }
          />
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-slate-700 shrink-0">Schedule</span>
            <div className="text-right text-slate-500">
              {scheduleEntries.length === 0 ? (
                <span>TBD</span>
              ) : (
                scheduleEntries.map((entry, i) => <p key={i}>{entry}</p>)
              )}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <button
            type="button"
            onClick={() => setMaterialsOpen((o) => !o)}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 no-print"
          >
            {materialsOpen ? "Hide Section Materials" : "Section Materials"}
          </button>
        </div>
      </div>

      {materialsOpen ? (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 no-print">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Section Materials
          </p>
          <SectionMaterialsPanel assignmentId={course.id} />
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

// ─── PDF Export ───────────────────────────────────────────────────────────────

const exportPdf = (courses, studentName) => {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  const line = (text, size = 11, bold = false, color = [30, 30, 30]) => {
    pdf.setFontSize(size);
    pdf.setFont("helvetica", bold ? "bold" : "normal");
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, pageW - margin * 2);
    lines.forEach((l) => {
      if (y > 275) { pdf.addPage(); y = margin; }
      pdf.text(l, margin, y);
      y += size * 0.5 + 1;
    });
  };

  const gap = (mm = 4) => { y += mm; };

  line("My Course Schedule", 18, true, [11, 44, 74]);
  if (studentName) line(studentName, 11, false, [100, 100, 100]);
  line(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 10, false, [150, 150, 150]);
  gap(6);

  courses.forEach((course, idx) => {
    if (idx > 0) gap(5);
    if (y > 240) { pdf.addPage(); y = margin; }

    pdf.setFillColor(245, 248, 255);
    pdf.roundedRect(margin - 3, y - 5, pageW - margin * 2 + 6, 62, 3, 3, "F");

    line(course.courseName, 13, true, [11, 44, 74]);
    if (course.courseCode && course.courseCode !== "-") {
      line(course.courseCode, 10, false, [29, 95, 163]);
    }
    gap(1);
    if (course.collegeName) line(`College: ${course.collegeName}`, 10);
    if (course.departmentName) line(`Department: ${course.departmentName}`, 10);
    line(`Year: ${course.yearLabel || "-"}  |  Section: ${course.section ? `§${course.section}` : "-"}`, 10);

    const building = course.building && course.room
      ? `${course.building} / ${course.room}`
      : course.building || course.room || "TBD";
    line(`Building: ${building}`, 10);

    const schedEntries = Array.isArray(course.schedule)
      ? course.schedule.map((e) => {
          const d = e.day || e.dayKey || ""; const s = e.startTime || e.start || ""; const en = e.endTime || e.end || "";
          return s && en ? `${d} ${s} - ${en}`.trim() : d;
        }).filter(Boolean)
      : [];
    line(`Schedule: ${schedEntries.length > 0 ? schedEntries.join(", ") : "TBD"}`, 10);
  });

  pdf.save("my-courses.pdf");
};

// ─── Page ─────────────────────────────────────────────────────────────────────

function StudentCoursesPage() {
  const outletContext = useOutletContext() || {};
  const { profile, profileLoading } = outletContext;

  const [rawCourses, setRawCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Resolved labels for college / year / department
  const [collegeName, setCollegeName] = useState("");
  const [yearLabel, setYearLabel] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  // Schedule entries keyed by courseId
  const [schedulesByCourse, setSchedulesByCourse] = useState({});
  // Building names keyed by buildingId
  const [buildingNames, setBuildingNames] = useState({});

  const collegeId = profile?.collegeId || "";
  const departmentId = profile?.departmentId || "";
  const yearId = profile?.yearId || "";

  const canQuery = Boolean(collegeId) && Boolean(yearId) && Boolean(departmentId) && !profileLoading;

  // ── Fetch college / year / department names (single batch) ──
  useEffect(() => {
    if (!collegeId || !yearId || !departmentId) return;
    Promise.all([
      getDoc(doc(db, "colleges", collegeId)),
      getDoc(doc(db, "colleges", collegeId, "years", yearId)),
      getDoc(doc(db, "colleges", collegeId, "years", yearId, "departments", departmentId)),
    ]).then(([collegeSnap, yearSnap, deptSnap]) => {
      if (collegeSnap.exists()) setCollegeName(collegeSnap.data().name || "");
      if (yearSnap.exists()) {
        const d = yearSnap.data();
        setYearLabel(d.name || (d.level != null ? `Year ${d.level}` : "") || yearId);
      }
      if (deptSnap.exists()) setDepartmentName(deptSnap.data().name || "");
    }).catch(() => {});
  }, [collegeId, yearId, departmentId]);

  // ── Fetch courses ──
  useEffect(() => {
    if (!canQuery) { setRawCourses([]); return; }

    setLoading(true);
    setError("");

    const q = query(
      collection(db, "allCourses"),
      where("collegeId", "==", collegeId),
      where("yearId", "==", yearId),
      where("departmentId", "==", departmentId)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRawCourses(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        setError(getErrorMessage(err, "Failed to load courses."));
        setLoading(false);
      }
    );

    return () => unsub();
  }, [canQuery, collegeId, departmentId, yearId]);

  // ── Subscribe to schedule entries for the student's courses ──
  useEffect(() => {
    if (rawCourses.length === 0 || !collegeId) return;

    const courseIds = rawCourses.map((c) => c.id);

    // Firestore `in` supports up to 30 values; batch if needed
    const chunks = [];
    for (let i = 0; i < courseIds.length; i += 30) {
      chunks.push(courseIds.slice(i, i + 30));
    }

    const unsubscribers = chunks.map((chunk) => {
      const schedulesQuery = query(
        collectionGroup(db, "schedule"),
        where("courseId", "in", chunk)
      );

      return onSnapshot(
        schedulesQuery,
        (snap) => {
          const map = {};
          const buildingIds = new Set();
          snap.docs.forEach((d) => {
            const data = d.data();
            if (!data.courseId) return;
            if (!map[data.courseId]) map[data.courseId] = [];
            map[data.courseId].push({ id: d.id, ...data });
            // derive buildingId from path if not stored as field
            const pathBuildingId =
              data.buildingId ||
              (() => {
                const parts = d.ref.path.split("/");
                const idx = parts.indexOf("buildings");
                return idx >= 0 ? parts[idx + 1] : "";
              })();
            if (pathBuildingId) {
              buildingIds.add(pathBuildingId);
              if (!data.buildingId) map[data.courseId].at(-1).buildingId = pathBuildingId;
            }
            const pathRoomId =
              data.roomId ||
              (() => {
                const parts = d.ref.path.split("/");
                const idx = parts.indexOf("rooms");
                return idx >= 0 ? parts[idx + 1] : "";
              })();
            if (pathRoomId && !data.roomId) map[data.courseId].at(-1).roomId = pathRoomId;
          });

          setSchedulesByCourse(map);

          // Fetch building names
          Promise.all(
            [...buildingIds].map((bid) =>
              getDoc(doc(db, "colleges", collegeId, "buildings", bid))
                .then((s) => [bid, s.exists() ? (s.data().name || bid) : bid])
                .catch(() => [bid, bid])
            )
          ).then((pairs) => {
            if (pairs.length > 0) {
              setBuildingNames((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
            }
          });
        },
        () => {}
      );
    });

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [rawCourses, collegeId]);

  const cards = useMemo(
    () =>
      rawCourses.map((a) => {
        const entries = schedulesByCourse[a.id] || [];
        // Derive building/room from first schedule entry that has it
        const firstWithBuilding = entries.find((e) => e.buildingId);
        const buildingId = firstWithBuilding?.buildingId || "";
        const building = buildingNames[buildingId] || buildingId;
        const room = firstWithBuilding?.roomId || firstWithBuilding?.roomName || "";
        // section from first schedule entry
        const section = entries[0]?.section || "";

        return {
          id: a.id,
          courseName: a.name || "Untitled course",
          courseCode: a.code || "-",
          creditHours: a.creditHours,
          description: a.description || "",
          collegeName,
          departmentName,
          yearLabel,
          section,
          building,
          room,
          schedule: entries,
        };
      }),
    [rawCourses, schedulesByCourse, buildingNames, collegeName, departmentName, yearLabel]
  );

  const handleExportPdf = useCallback(() => {
    const name = profile?.fullName || profile?.name || "";
    exportPdf(cards, name);
  }, [cards, profile]);

  if (profileLoading) return <Loading label="Loading your profile…" />;

  if (!canQuery) {
    return (
      <div className="space-y-6">
        <PageHeader title="My Courses" />
        <div className="rounded-2xl bg-amber-50 p-6 text-sm text-amber-700 ring-1 ring-amber-200">
          Your profile is missing college information. Please contact your administrator to update your account.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="My Courses" />
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={cards.length === 0}
          className="rounded-xl bg-[#0b2c4a] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#153a63] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export PDF
        </button>
      </div>

      {!yearId || !departmentId ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
          Your year or department is not set — contact your admin to update your account.
        </div>
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      {loading ? (
        <Loading label="Loading courses…" />
      ) : cards.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
          No courses found for your college, department, and year.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentCoursesPage;
