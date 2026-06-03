import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { HiUpload, HiDownload, HiRefresh } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import { getErrorMessage } from "../../utils/errorHelpers";
import { fetchMySubjects } from "../../features/professor/api/professorBackendApi";
import { bulkUploadGrades } from "../../api/bulkUploadApi";
import { calculateGrades } from "../../api/gradesApi";

// BREADCRUMBS defined inside component now (uses t)

const TEMPLATE_ROWS = [
  ["StudentId", "Midterm", "Coursework", "Final"],
  ["STU20230001", 18, 25, 55],
  ["STU20230002", 15, 22, 48],
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS);
  XLSX.utils.book_append_sheet(wb, ws, "Grades");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    "grades_template.xlsx"
  );
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
  }, [file, selectedId]);

  const handleReset = () => {
    setResult(null);
    setError("");
    setCalcMsg("");
    setFile(null);
  };

  if (offerLoad) return <Loading label={t("profGrades.loading")} />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("profGrades.title")} breadcrumbs={BREADCRUMBS} />

      {/* Step 1 — Offering */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-semibold text-slate-800">Step 1 — Select Subject Offering</p>
            <p className="text-xs text-slate-500 mt-0.5">Choose the course you want to upload grades for.</p>
          </div>
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            <HiDownload className="h-4 w-4" />
            {t("profGrades.downloadTemplate")}
          </button>
        </div>

        <select
          value={selectedId}
          onChange={(e) => { setSelectedId(e.target.value); handleReset(); }}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <option value="">{t("profGrades.selectOffering")}</option>
          {offerings.map((o) => {
            const id = o.id ?? o.subjectOfferingId;
            const name = o.subjectName ?? o.name ?? t("profCourses.untitled");
            const code = o.subjectCode ?? o.code ?? "";
            return <option key={id} value={id}>{name}{code ? ` (${code})` : ""}</option>;
          })}
        </select>

        {selectedOffering && (
          <div className="flex flex-wrap gap-4 text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3">
            {selectedOffering.midtermMaxScore != null && <span>Midterm max: <strong>{selectedOffering.midtermMaxScore}</strong></span>}
            {selectedOffering.courseworkMaxScore != null && <span>Coursework max: <strong>{selectedOffering.courseworkMaxScore}</strong></span>}
            {selectedOffering.finalExamMaxScore != null && <span>Final max: <strong>{selectedOffering.finalExamMaxScore}</strong></span>}
          </div>
        )}
      </div>

      {/* Step 2 — Upload */}
      {selectedId && !result && (
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 space-y-4">
          <div>
            <p className="font-semibold text-slate-800">Step 2 — Upload Grades Excel</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Required columns: <code className="bg-slate-100 px-1 rounded">StudentId</code> · <code className="bg-slate-100 px-1 rounded">Midterm</code> · <code className="bg-slate-100 px-1 rounded">Coursework</code> · <code className="bg-slate-100 px-1 rounded">Final</code>
              <br />Missing columns are treated as partial update (e.g. only Midterm → others unchanged).
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
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
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
                <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" /> Uploading…</>
              ) : (
                <><HiUpload className="h-4 w-4" /> {t("profGrades.upload")}</>
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
            <div className="text-sm text-slate-500 animate-pulse">Calculating final grades…</div>
          )}

          {result.errors?.length > 0 && (
            <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
              <p className="text-sm font-semibold text-red-700 mb-2">Skipped Rows ({result.errors.length})</p>
              <ul className="space-y-1">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-xs text-red-600">• {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfessorGradesImportPage;
