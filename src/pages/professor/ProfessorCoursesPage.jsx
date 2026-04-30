import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import CourseMaterialsSection from "../../components/professor/CourseMaterialsSection";
import AddMaterialModal from "../../components/professor/AddMaterialModal";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value || "-"}</span>
    </div>
  );
}

function AddMaterialTrigger({ professorUid, course }) {
  const [open, setOpen] = useState(false);
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
        onCreated={() => setOpen(false)}
      />
    </>
  );
}

function CourseCard({ subject, professorUid }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);

  const name = subject.subjectName ?? subject.name ?? subject.courseName ?? "Untitled";
  const code = subject.subjectCode ?? subject.code ?? "-";
  const term = subject.term ?? subject.termName ?? subject.semesterName ?? "-";
  const yearLevel = subject.yearLevel ?? subject.year ?? null;
  const creditHours = subject.creditHours ?? subject.credits ?? null;
  const departmentName = subject.departmentName ?? subject.department ?? null;

  const courseForMaterials = useMemo(
    () => ({ id: subject.id ?? subject.code, courseName: name, termId: term }),
    [subject.id, subject.code, name, term]
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800">{name}</h3>
          {code !== "-" && (
            <p className="text-xs font-semibold tracking-wide text-emerald-600">{code}</p>
          )}
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <Row label="Term" value={term} />
          {yearLevel && <Row label="Year" value={`Year ${yearLevel}`} />}
          {creditHours && <Row label="Credit Hours" value={creditHours} />}
          {departmentName && <Row label="Department" value={departmentName} />}
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
              <><HiChevronUp className="h-4 w-4" /> Hide Materials</>
            ) : (
              <><HiChevronDown className="h-4 w-4" /> Materials</>
            )}
          </button>
        </div>
      </div>

      {materialsOpen && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Course Materials
            </p>
            <AddMaterialTrigger professorUid={professorUid} course={courseForMaterials} />
          </div>
          <CourseMaterialsSection professorId={professorUid} course={courseForMaterials} />
        </div>
      )}
    </article>
  );
}

function ProfessorCoursesPage() {
  const { user, profile, profileLoading } = useOutletContext() || {};

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const doctorCode = profile?.code ?? profile?.doctorCode ?? profile?.Code ?? user?.code ?? "";
  const professorUid = user?.uid ?? user?.id ?? "";

  useEffect(() => {
    if (profileLoading) return;
    let active = true;
    setLoading(true);
    setError("");

    fetchMySubjects(doctorCode)
      .then((data) => { if (active) setSubjects(data); })
      .catch((e) => { if (active) setError(e?.response?.data?.message ?? e?.message ?? "Failed to load subjects."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [doctorCode, profileLoading, refreshKey]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (profileLoading || loading) return <Loading label="Loading courses..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow-sm ring-1 ring-slate-200">
            No subjects assigned yet.
          </div>
        ) : (
          subjects.map((s, i) => (
            <CourseCard key={s.id ?? s.code ?? i} subject={s} professorUid={professorUid} />
          ))
        )}
      </div>
    </div>
  );
}

export default ProfessorCoursesPage;
