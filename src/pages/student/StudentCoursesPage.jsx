import { useCallback, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import apiClient from "../../api/apiClient";
import { fetchMyEnrollments } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { getMaterialsByOffering, getMaterialDownloadUrl } from "../../api/materialsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className="text-slate-500">{value || "-"}</span>
    </div>
  );
}

function MaterialsList({ offeringId }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    if (!offeringId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    getMaterialsByOffering(offeringId)
      .then((items) => { if (active) setMaterials(items); })
      .catch((err) => { if (active) setError(getErrorMessage(err, "Failed to load materials.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offeringId]);

  const handleDownload = useCallback(async (materialId) => {
    setDownloading(materialId);
    try {
      const { url } = await getMaterialDownloadUrl(materialId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      // silently fail — download link unavailable
    } finally {
      setDownloading(null);
    }
  }, []);

  if (loading) return <Loading label="Loading materials…" />;
  if (error) return <ErrorState message={error} />;
  if (materials.length === 0) {
    return <p className="text-sm text-slate-500">No materials uploaded yet.</p>;
  }

  return (
    <div className="space-y-2">
      {materials.map((m, i) => (
        <div key={m.id ?? i} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-800">{m.fileName ?? m.title ?? "Material"}</p>
            <p className="text-xs text-slate-400">
              {m.uploadedAt ? new Date(m.uploadedAt).toLocaleDateString("en-US") : ""}
              {m.fileSize ? ` · ${(m.fileSize / 1024 / 1024).toFixed(1)} MB` : ""}
            </p>
          </div>
          <Button
            size="small" variant="outlined"
            disabled={downloading === m.id}
            onClick={() => handleDownload(m.id)}
          >
            {downloading === m.id ? "…" : "Download"}
          </Button>
        </div>
      ))}
    </div>
  );
}

function SubjectCard({ item }) {
  const name    = item.subjectName  ?? item.name     ?? "Untitled";
  const code    = item.subjectCode  ?? item.code     ?? "-";
  const doctor  = item.doctorName   ?? "-";
  const sem     = item.semesterName ?? item.termName ?? "-";
  const dept    = item.departmentName                ?? "-";
  const credits = item.creditHours  ?? item.credits  ?? null;
  const offeringId = item.id ?? item.subjectOfferingId ?? null;

  const [showMaterials, setShowMaterials] = useState(false);

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-slate-800">{name}</h3>
          {code !== "-" && (
            <p className="text-xs font-semibold tracking-wide text-blue-600 mt-0.5">{code}</p>
          )}
        </div>
        <div className="space-y-2">
          {sem !== "-"    && <Row label="Semester"     value={sem} />}
          {doctor !== "-" && <Row label="Doctor"       value={doctor} />}
          {dept !== "-"   && <Row label="Department"   value={dept} />}
          {credits        && <Row label="Credit Hours" value={credits} />}
        </div>
        {offeringId && (
          <button
            type="button"
            onClick={() => setShowMaterials((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {showMaterials ? (
              <><HiChevronUp className="h-4 w-4" /> Hide Materials</>
            ) : (
              <><HiChevronDown className="h-4 w-4" /> Materials</>
            )}
          </button>
        )}
      </div>

      {showMaterials && offeringId && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Course Materials
          </p>
          <MaterialsList offeringId={offeringId} />
        </div>
      )}
    </article>
  );
}

function StudentCoursesPage() {
  const [batchSubjects,      setBatchSubjects]      = useState([]);
  const [batchLoading,       setBatchLoading]       = useState(true);
  const [enrollments,        setEnrollments]        = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

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
