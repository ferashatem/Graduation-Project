import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@mui/material";
import { HiBookOpen, HiChevronDown, HiChevronUp, HiPlusCircle } from "react-icons/hi";
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
  const { t } = useTranslation();
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
      .catch((err) => {
        if (!active) return;
        const status = err?.response?.status;
        if (status === 401 || status === 403) {
          setMaterials([]);
        } else {
          setError(getErrorMessage(err, t("studentCourses.failedMaterials")));
        }
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offeringId, t]);

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

  if (loading) return <Loading label={t("studentCourses.loadingMaterials")} />;
  if (error) return <ErrorState message={error} />;
  if (materials.length === 0) {
    return <p className="text-sm text-slate-500">{t("studentCourses.noMaterials")}</p>;
  }

  return (
    <div className="space-y-2">
      {materials.map((m, i) => (
        <div key={m.id ?? i} className="flex items-center justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200">
          <div>
            <p className="text-sm font-medium text-slate-800">{m.fileName ?? m.title ?? t("studentCourses.material")}</p>
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
            {downloading === m.id ? "…" : t("studentCourses.download")}
          </Button>
        </div>
      ))}
    </div>
  );
}

function SubjectCard({ item }) {
  const { t } = useTranslation();
  const name    = item.subjectName  || item.name     || t("studentCourses.untitled");
  const code    = item.subjectCode  || item.code     || "";
  const doctor  = item.doctorName   || "";
  const sem     = item.semesterName || item.termName || "";
  const dept    = item.departmentName               || "";
  const credits = item.creditHours  || item.credits  || null;
  // Prefer explicit offeringId/subjectOfferingId fields; fall back to id only if needed
  const offeringId = item.subjectOfferingId ?? item.offeringId ?? item.id ?? null;

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
          {sem     && <Row label={t("studentCourses.semester")}    value={sem} />}
          {doctor  && <Row label={t("studentCourses.doctor")}      value={doctor} />}
          {dept    && <Row label={t("studentCourses.department")}  value={dept} />}
          {credits && <Row label={t("studentCourses.creditHours")} value={credits} />}
        </div>
        {offeringId && (
          <button
            type="button"
            onClick={() => setShowMaterials((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            {showMaterials ? (
              <><HiChevronUp className="h-4 w-4" /> {t("studentCourses.hideMaterials")}</>
            ) : (
              <><HiChevronDown className="h-4 w-4" /> {t("studentCourses.materials")}</>
            )}
          </button>
        )}
      </div>

      {showMaterials && offeringId && (
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t("studentCourses.courseMaterials")}
          </p>
          <MaterialsList offeringId={offeringId} />
        </div>
      )}
    </article>
  );
}

function AvailableOfferingsSection({ enrolledIds, onEnrolled }) {
  const { t } = useTranslation();
  const [offerings, setOfferings] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [enrolling, setEnrolling] = useState(null);
  const [messages,  setMessages]  = useState({});

  useEffect(() => {
    apiClient.get("/registration/eligible-offerings")
      .then((res) => {
        const payload = res.data?.data ?? res.data;
        setOfferings(Array.isArray(payload) ? payload : payload?.items ?? []);
      })
      .catch((err) => setError(getErrorMessage(err, t("studentCourses.failedAvailable"))))
      .finally(() => setLoading(false));
  }, [t]);

  const handleEnroll = useCallback(async (offeringId) => {
    setEnrolling(offeringId);
    setMessages((m) => ({ ...m, [offeringId]: "" }));
    try {
      await apiClient.post(`/enrollments/${offeringId}`);
      setMessages((m) => ({ ...m, [offeringId]: "success" }));
      onEnrolled();
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? t("studentCourses.enrollmentFailed");
      setMessages((m) => ({ ...m, [offeringId]: msg }));
    } finally {
      setEnrolling(null);
    }
  }, [onEnrolled, t]);

  const available = offerings.filter((o) => !enrolledIds.has(o.id));

  if (loading) return <Loading label={t("studentCourses.loadingAvailable")} />;
  if (error)   return <ErrorState message={error} />;
  if (available.length === 0) return (
    <div className="rounded-2xl bg-white p-6 text-sm text-slate-400 ring-1 ring-slate-200 flex items-center gap-3">
      <HiBookOpen className="h-5 w-5 shrink-0" />
      {t("studentCourses.noAvailable")}
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {available.map((o) => {
        const msg = messages[o.id];
        const done = msg === "success";
        return (
          <article key={o.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-3">
            <div>
              <h3 className="text-base font-semibold text-slate-800">{o.subjectName ?? o.name}</h3>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{o.subjectCode ?? o.code}</p>
            </div>
            <div className="space-y-1 text-sm text-slate-500">
              {o.doctorName    && <p>{o.doctorName}</p>}
              {o.semesterName  && <p>{o.semesterName}</p>}
              {o.maxCapacity   && <p>{t("studentCourses.capacity")}: {o.enrolledCount ?? "?"} / {o.maxCapacity}</p>}
            </div>
            {msg && msg !== "success" && (
              <p className="text-xs text-red-600 rounded-xl bg-red-50 px-3 py-1.5">{msg}</p>
            )}
            <button
              type="button"
              disabled={!!enrolling || done}
              onClick={() => handleEnroll(o.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                done
                  ? "bg-emerald-100 text-emerald-700 cursor-default"
                  : "bg-[#0b2c4a] text-white hover:bg-[#153a63] disabled:opacity-50"
              }`}
            >
              <HiPlusCircle className="h-4 w-4" />
              {done ? t("studentCourses.enrolled") : enrolling === o.id ? t("studentCourses.enrolling") : t("studentCourses.register")}
            </button>
          </article>
        );
      })}
    </div>
  );
}

function StudentCoursesPage() {
  const { t } = useTranslation();
  const [batchSubjects,      setBatchSubjects]      = useState([]);
  const [batchLoading,       setBatchLoading]       = useState(true);
  const [enrollments,        setEnrollments]        = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [enrollKey,          setEnrollKey]          = useState(0);
  const [autoEnrolling,      setAutoEnrolling]      = useState(false);
  const [autoMsg,            setAutoMsg]            = useState(null);

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
    setEnrollmentsLoading(true);
    fetchMyEnrollments()
      .then((data) => {
        setEnrollments(data);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setEnrollmentsLoading(false));
  }, [enrollKey]);

  const enrolledIds = new Set(enrollments.map((e) => e.id ?? e.subjectOfferingId));

  // Map subject code -> offering id from the student's enrollments, so the
  // "My Subjects" cards can surface the materials the doctor uploaded.
  const normCode = (c) => (c ?? "").toString().trim().toUpperCase();
  const offeringIdByCode = new Map(
    enrollments
      .map((e) => {
        const code  = normCode(e.subjectCode ?? e.code);
        const offId = e.subjectOfferingId ?? e.offeringId ?? e.id ?? null;
        return code && offId ? [code, offId] : null;
      })
      .filter(Boolean)
  );

  const handleAutoEnroll = useCallback(async () => {
    setAutoEnrolling(true); setAutoMsg(null);
    try {
      const res = await apiClient.post("/enrollments/auto-enroll");
      const data = res.data?.data ?? res.data;
      setAutoMsg({ type: "success", text: t("studentCourses.enrolledCount", { count: data.enrolled ?? 0 }) });
      setEnrollKey((k) => k + 1);
    } catch (err) {
      setAutoMsg({ type: "error", text: err?.response?.data?.message ?? t("studentCourses.autoEnrollFailed") });
    } finally {
      setAutoEnrolling(false);
    }
  }, [t]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title={t("studentCourses.title")} />
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            disabled={autoEnrolling}
            onClick={handleAutoEnroll}
            className="flex items-center gap-2 rounded-2xl bg-[#0b2c4a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#153a63] disabled:opacity-50"
          >
            <HiPlusCircle className="h-4 w-4" />
            {autoEnrolling ? t("studentCourses.enrolling") : t("studentCourses.autoEnroll")}
          </button>
          {autoMsg && (
            <p className={`text-xs font-medium ${autoMsg.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
              {autoMsg.text}
            </p>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t("studentCourses.mySubjects")}
        </h2>
        {batchLoading ? (
          <Loading label={t("studentCourses.loadingSubjects")} />
        ) : batchSubjects.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-400 ring-1 ring-slate-200">
            {t("studentCourses.noSubjects")}
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
                  subjectOfferingId: offeringIdByCode.get(normCode(s.code)) ?? null,
                }}
              />
            ))}
          </div>
        )}
      </section>

      {(enrollmentsLoading || enrollments.length > 0) && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t("studentCourses.registeredSubjects")}
          </h2>
          {enrollmentsLoading ? (
            <Loading label={t("studentCourses.loadingEnrolled")} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {enrollments.map((e, i) => (
                <SubjectCard key={e.id ?? e.subjectOfferingId ?? i} item={e} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t("studentCourses.registerForCourse")}
        </h2>
        <AvailableOfferingsSection
          key={enrollKey}
          enrolledIds={enrolledIds}
          onEnrolled={() => setEnrollKey((k) => k + 1)}
        />
      </section>
    </div>
  );
}

export default StudentCoursesPage;
