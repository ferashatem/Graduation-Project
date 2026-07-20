import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HiUpload, HiDownload, HiRefresh } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import { fetchEnrollmentsByOffering } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { bulkUploadGrades } from "../../api/bulkUploadApi";
import { calculateGrades } from "../../api/gradesApi";

function buildStaticTemplate() {
  return [
    ["StudentId", "Student Name", "Midterm", "Coursework", "Final"],
    ["STU20230001", "Example Student", "", "", ""],
  ];
}

function SummaryBadge({ label, value, color }) {
  const colors = {
    green: "bg-emerald-100 text-emerald-800",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-800",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`rounded-xl px-4 py-3 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  );
}

function parseRowError(msg) {
  const match = msg.match(/^Row\s+(\d+):\s*(.+)$/i);
  if (match) return { row: match[1], detail: match[2] };
  return { row: null, detail: msg };
}

function ProfessorGradesImportPage() {
  const { t } = useTranslation();
  const BREADCRUMBS = [{ label: t("profGrades.title") }];

  const [offerings, setOfferings] = useState([]);
  const [offerLoad, setOfferLoad] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [calculating, setCalculating] = useState(false);
  const [calcMsg, setCalcMsg] = useState("");
  const [templateLoading, setTemplateLoading] = useState(false);

  useEffect(() => {
    fetchMySubjects()
      .then((data) => setOfferings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setOfferLoad(false));
  }, []);

  const selectedOffering = useMemo(
    () => offerings.find((o) => (o.id ?? o.subjectOfferingId) === selectedId),
    [offerings, selectedId]
  );

  const courseName = useMemo(() => {
    if (!selectedOffering) return "";
    const name = selectedOffering.subjectName ?? selectedOffering.name ?? "";
    const code = selectedOffering.subjectCode ?? selectedOffering.code ?? "";
    return code ? `${name} (${code})` : name;
  }, [selectedOffering]);

  const handleDownloadTemplate = useCallback(async () => {
    let rows;
    if (selectedId) {
      setTemplateLoading(true);
      try {
        const enrollments = await fetchEnrollmentsByOffering(selectedId);
        rows = [["StudentId", "Student Name", "Midterm", "Coursework", "Final"]];
        for (const e of enrollments) {
          const sid = e.universityStudentId ?? e.studentCode ?? "";
          const name = e.studentName ?? e.fullName ?? "";
          rows.push([sid, name, "", "", ""]);
        }
        if (rows.length === 1) rows.push(["", "", "", "", ""]);
      } catch {
        rows = buildStaticTemplate();
      } finally {
        setTemplateLoading(false);
      }
    } else {
      rows = buildStaticTemplate();
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Grades");
    const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
    saveAs(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "grades_template.xlsx"
    );
  }, [selectedId]);

  const handleUpload = useCallback(async () => {
    if (!file || !selectedId) return;
    setUploading(true);
    setError("");
    setResult(null);
    setCalcMsg("");

    try {
      const { data } = await bulkUploadGrades(selectedId, file);
      setResult(data);

      if ((data?.imported ?? 0) > 0) {
        setCalculating(true);
        try {
          await calculateGrades(selectedId);
          setCalcMsg("✅ " + t("profGrades.calculateGpa") + " OK.");
        } catch {
          setCalcMsg("⚠️ Import succeeded but auto-calculation failed.");
        } finally {
          setCalculating(false);
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploading(false);
      setFile(null);
    }
  }, [file, selectedId, t]);

  const handleReset = () => {
    setResult(null);
    setError("");
    setCalcMsg("");
    setFile(null);
  };

  if (offerLoad) return <Loading label={t("profGrades.loading")} />;

  const midMax = selectedOffering?.midtermMaxScore;
  const cwMax = selectedOffering?.courseworkMaxScore;
  const finMax = selectedOffering?.finalExamMaxScore;
  const hasBreakdown = midMax != null || cwMax != null || finMax != null;
  const totalMarks =
    (midMax ?? 0) + (cwMax ?? 0) + (finMax ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader title={t("profGrades.title")} breadcrumbs={BREADCRUMBS} />

      {/* Step 1 — Offering */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-slate-800">Step 1 — Select Subject Offering</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose the course you want to upload grades for.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateLoading}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            {templateLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
            ) : (
              <HiDownload className="h-4 w-4" />
            )}
            {templateLoading
              ? t("profGrades.downloadingTemplate")
              : t("profGrades.downloadTemplate")}
          </button>
        </div>

        <select
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value);
            handleReset();
          }}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{t("profGrades.selectOffering")}</option>
          {offerings.map((o) => {
            const id = o.id ?? o.subjectOfferingId;
            const name = o.subjectName ?? o.name ?? t("profCourses.untitled");
            const code = o.subjectCode ?? o.code ?? "";
            return (
              <option key={id} value={id}>
                {name}
                {code ? ` (${code})` : ""}
              </option>
            );
          })}
        </select>

        {/* Assessment Breakdown */}
        {selectedOffering && hasBreakdown && (
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              {t("profGrades.assessmentBreakdown")}
            </p>
            <div className="flex flex-wrap gap-3">
              {midMax != null && (
                <div className="flex-1 min-w-[90px] rounded-lg bg-blue-50 ring-1 ring-blue-100 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-blue-700">{midMax}</p>
                  <p className="text-[11px] text-blue-400 mt-0.5">{t("profGrades.midterm")}</p>
                </div>
              )}
              {cwMax != null && (
                <div className="flex-1 min-w-[90px] rounded-lg bg-violet-50 ring-1 ring-violet-100 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-violet-700">{cwMax}</p>
                  <p className="text-[11px] text-violet-400 mt-0.5">{t("profGrades.coursework")}</p>
                </div>
              )}
              {finMax != null && (
                <div className="flex-1 min-w-[90px] rounded-lg bg-amber-50 ring-1 ring-amber-100 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-amber-700">{finMax}</p>
                  <p className="text-[11px] text-amber-400 mt-0.5">{t("profGrades.finalExam")}</p>
                </div>
              )}
              {totalMarks > 0 && (
                <div className="flex-1 min-w-[90px] rounded-lg bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3 text-center">
                  <p className="text-xl font-bold text-emerald-700">{totalMarks}</p>
                  <p className="text-[11px] text-emerald-500 mt-0.5">{t("profGrades.totalMarks")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Upload */}
      {selectedId && !result && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div>
            <p className="font-semibold text-slate-800">Step 2 — Upload Grades Excel</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Required columns:{" "}
              <code className="bg-slate-100 px-1 rounded">StudentId</code> ·{" "}
              <code className="bg-slate-100 px-1 rounded">Midterm</code> ·{" "}
              <code className="bg-slate-100 px-1 rounded">Coursework</code> ·{" "}
              <code className="bg-slate-100 px-1 rounded">Final</code>
              <br />
              Missing columns are treated as partial update (e.g. only Midterm → others unchanged).
            </p>
          </div>

          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-8 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition">
            <HiUpload className="h-8 w-8 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">
              {file ? file.name : t("profGrades.uploadFile")}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setFile(null)}
              disabled={!file || uploading}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex items-center gap-2 rounded-xl bg-[#0b2c4a] px-5 py-2 text-sm font-semibold text-white hover:bg-[#153a63] disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  {t("profGrades.uploading")}
                </>
              ) : (
                <>
                  <HiUpload className="h-4 w-4" />
                  {t("profGrades.upload")}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-semibold text-slate-800">Import Results</p>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <HiRefresh className="h-4 w-4" /> Import Another File
            </button>
          </div>

          <div className="flex flex-wrap gap-3">
            <SummaryBadge label={t("profGrades.totalCount")} value={result.totalRows ?? 0} color="slate" />
            <SummaryBadge label={t("profGrades.successCount")} value={result.imported ?? 0} color="green" />
            <SummaryBadge label={t("profGrades.skippedCount")} value={result.skipped ?? 0} color="amber" />
            <SummaryBadge label={t("profGrades.failCount")} value={result.failed ?? 0} color="red" />
          </div>

          {calcMsg && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-200">
              {calcMsg}
            </div>
          )}

          {calculating && (
            <div className="text-sm text-slate-500 animate-pulse">
              {t("profGrades.calculating")}
            </div>
          )}

          {result.errors?.length > 0 && (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200 space-y-2">
              <p className="text-sm font-semibold text-red-700">
                {t("profGrades.skippedRows")} ({result.errors.length})
              </p>
              <ul className="space-y-2">
                {result.errors.map((e, i) => {
                  const { row, detail } = parseRowError(e);
                  return (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-lg bg-white ring-1 ring-red-100 px-3 py-2.5"
                    >
                      {row && (
                        <span className="shrink-0 rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                          Row {row}
                        </span>
                      )}
                      <span className="text-xs text-red-700 leading-relaxed">
                        {detail}
                        {courseName && (
                          <span className="text-red-400"> · {courseName}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfessorGradesImportPage;
