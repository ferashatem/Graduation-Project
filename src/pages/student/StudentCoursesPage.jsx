import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import apiClient from "../../api/apiClient";
import { fetchMyEnrollments } from "../../features/subjectOfferings/api/subjectOfferingsApi";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value || "-"}</span>
    </div>
  );
}

function SubjectCard({ item }) {
  const name    = item.subjectName  ?? item.name           ?? "Untitled";
  const code    = item.subjectCode  ?? item.code           ?? "-";
  const doctor  = item.doctorName   ?? "-";
  const sem     = item.semesterName ?? item.termName       ?? "-";
  const dept    = item.departmentName                      ?? "-";
  const credits = item.creditHours  ?? item.credits        ?? null;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5 space-y-3">
      <div>
        <h3 className="text-base font-semibold text-slate-800">{name}</h3>
        {code !== "-" && (
          <p className="text-xs font-semibold tracking-wide text-blue-600 mt-0.5">{code}</p>
        )}
      </div>
      <div className="space-y-2">
        {sem !== "-"  && <Row label="Semester"     value={sem} />}
        {doctor !== "-" && <Row label="Doctor"    value={doctor} />}
        {dept !== "-" && <Row label="Department"  value={dept} />}
        {credits      && <Row label="Credit Hours" value={credits} />}
      </div>
    </article>
  );
}

function StudentCoursesPage() {
  const [batchSubjects,       setBatchSubjects]       = useState([]);
  const [batchLoading,        setBatchLoading]        = useState(true);
  const [enrollments,         setEnrollments]         = useState([]);
  const [enrollmentsLoading,  setEnrollmentsLoading]  = useState(true);

  useEffect(() => {
    apiClient.get("/subjects/my-subjects")
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setBatchSubjects(Array.isArray(payload) ? payload : []);
      })
      .catch(() => setBatchSubjects([]))
      .finally(() => setBatchLoading(false));
  }, []);

  useEffect(() => {
    fetchMyEnrollments()
      .then(setEnrollments)
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollmentsLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader title="My Courses" />

      {/* My batch subjects */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          My Subjects
        </h2>
        {batchLoading ? (
          <Loading label="Loading subjects…" />
        ) : batchSubjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-400 ring-1 ring-slate-200">
            No subjects assigned to your batch yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {batchSubjects.map((s, i) => (
              <SubjectCard
                key={s.id ?? s.code ?? i}
                item={{
                  subjectName: s.name,
                  subjectCode: s.code,
                  departmentName: s.departmentName,
                  doctorName: s.doctorName,
                  creditHours: s.creditHours,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Enrolled offerings */}
      {(enrollmentsLoading || enrollments.length > 0) && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Registered Subjects
          </h2>
          {enrollmentsLoading ? (
            <Loading label="Loading enrolled subjects…" />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enrollments.map((e, i) => (
                <SubjectCard key={e.id ?? e.subjectOfferingId ?? i} item={e} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default StudentCoursesPage;
