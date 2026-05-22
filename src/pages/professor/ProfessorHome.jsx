import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-slate-800">{value}</p>
    </div>
  );
}

function ProfessorHome() {
  const { user, profile, profileLoading } = useOutletContext() || {};

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  // Doctor code can live at several field names depending on backend response
  const doctorCode = profile?.code ?? profile?.doctorCode ?? profile?.Code ?? user?.code ?? "";

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

  const profileSummary = useMemo(() => ({
    name: profile?.fullName ?? profile?.Full_Name ?? profile?.name ?? profile?.displayName ?? "Professor",
    email: profile?.email ?? profile?.Email ?? "—",
    college: profile?.collegeName ?? profile?.college ?? profile?.collegeCode ?? "—",
  }), [profile]);

  const termOptions = useMemo(() => {
    const terms = subjects.map((s) => s.term ?? s.termName ?? s.semesterName).filter(Boolean);
    return Array.from(new Set(terms)).sort();
  }, [subjects]);

  useEffect(() => {
    if (selectedTerm && !termOptions.includes(selectedTerm)) setSelectedTerm("");
  }, [selectedTerm, termOptions]);

  const filteredSubjects = useMemo(
    () => (selectedTerm ? subjects.filter((s) => (s.term ?? s.termName ?? s.semesterName) === selectedTerm) : subjects),
    [subjects, selectedTerm]
  );

  const recentSubjects = useMemo(() => subjects.slice(0, 5), [subjects]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (profileLoading || loading) return <Loading label="Loading professor dashboard..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="Professor Home" />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">{profileSummary.name}</h2>
              <p className="text-sm text-slate-500">{profileSummary.email}</p>
            </div>
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-700">College:</span> {profileSummary.college}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-700">Current term</p>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">All terms</option>
            {termOptions.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total assigned subjects" value={subjects.length} />
        <StatCard
          label={selectedTerm ? `Subjects in ${selectedTerm}` : "Subjects in all terms"}
          value={filteredSubjects.length}
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Recent assigned subjects
        </h3>
        <div className="mt-4 space-y-3">
          {recentSubjects.length === 0 ? (
            <p className="text-sm text-slate-500">No subjects assigned yet.</p>
          ) : (
            recentSubjects.map((s, i) => (
              <div
                key={s.id ?? s.code ?? i}
                className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {s.subjectName ?? s.name ?? s.courseName ?? "Untitled"}
                  </p>
                  <p className="text-xs text-slate-500">
                    Code: {s.subjectCode ?? s.code ?? "-"}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {s.term ?? s.termName ?? s.semesterName ?? ""}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfessorHome;
