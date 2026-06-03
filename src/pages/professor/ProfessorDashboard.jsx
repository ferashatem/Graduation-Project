import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-right text-slate-500">{value || "-"}</span>
    </div>
  );
}

function ProfessorDashboard() {
  const { user, profile, profileLoading } = useOutletContext() || {};
  const { t } = useTranslation();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const doctorCode = profile?.code ?? profile?.doctorCode ?? profile?.Code ?? user?.code ?? "";

  useEffect(() => {
    if (profileLoading) return;
    let active = true;
    setLoading(true);
    setError("");

    fetchMySubjects(doctorCode)
      .then((data) => { if (active) setSubjects(data); })
      .catch((e) => { if (active) setError(e?.response?.data?.message ?? e?.message ?? t("profDashboard.failed")); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [doctorCode, profileLoading, refreshKey]);

  const handleRetry = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (profileLoading || loading) return <Loading label={t("profDashboard.loading")} />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("profDashboard.title")} />

      {error ? <ErrorState message={error} onRetry={handleRetry} /> : null}

      {subjects.length === 0 && !error ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm ring-1 ring-slate-100">
          {t("profDashboard.noSubjects")}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {subjects.map((s, i) => {
            const name = s.subjectName ?? s.name ?? s.courseName ?? t("profDashboard.untitled");
            const code = s.subjectCode ?? s.code ?? "";
            const term = s.term ?? s.termName ?? s.semesterName ?? "-";
            const dept = s.departmentName ?? s.department ?? "";
            const year = s.yearLevel ?? s.year ?? null;
            const credits = s.creditHours ?? s.credits ?? null;

            return (
              <article key={s.id ?? code ?? i} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
                <div className="mb-4 space-y-0.5">
                  <h3 className="text-base font-semibold text-slate-800">{name}</h3>
                  {code && (
                    <p className="text-xs font-semibold tracking-wide text-blue-600">{code}</p>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <Row label={t("profDashboard.term")} value={term} />
                  {year && <Row label={t("profDashboard.students")} value={`${year}`} />}
                  {dept && <Row label={t("profCourses.department")} value={dept} />}
                  {credits && <Row label={t("profCourses.creditHours")} value={credits} />}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ProfessorDashboard;
