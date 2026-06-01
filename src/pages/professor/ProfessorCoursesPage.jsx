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
        course={course}
        onClose={() => setOpen(false)}
        onCreated={() => setOpen(false)}
      />
    </>
  );
}

function CourseCard({ subject, professorUid }) {
  const [materialsOpen, setMaterialsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-800 leading-tight">{name}</h3>
            {code !== "-" && (
              <p className="text-xs font-semibold text-emerald-600 mt-0.5">Code: {code}</p>
            )}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="mt-4 space-y-2 text-sm border-t border-slate-50 pt-4">
          <Row label="Term" value={term} />
          {yearLevel && <Row label="Year" value={`Year ${yearLevel}`} />}
          {creditHours && <Row label="Credit Hours" value={creditHours} />}
          {departmentName && <Row label="Department" value={departmentName} />}
        </div>

        {/* Footer buttons */}
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Professor
          </span>
          <button
            type="button"
            onClick={() => setMaterialsOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 ml-auto"
          >
            {materialsOpen ? <HiChevronUp className="h-4 w-4" /> : <HiChevronDown className="h-4 w-4" />}
            Materials
          </button>
        </div>
      </div>

      {materialsOpen && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Course Materials</p>
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
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
        <p className="text-sm text-slate-400 mt-0.5">Your assigned subjects this semester</p>
      </div>

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
