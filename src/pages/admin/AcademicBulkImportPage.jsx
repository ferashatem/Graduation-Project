import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Chip,
  LinearProgress,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import {
  bulkUploadDoctors,
  bulkUploadStudentsAI,
  importStudentsExcel,
} from "../../api/bulkUploadApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const BREADCRUMBS = [{ label: "Academic Bulk Import" }];

const STUDENT_EXCEL_COLUMNS = "FullName | Email | NationalId | Phone | UniversityStudentId | BatchCode | GroupCode";
const DOCTOR_EXCEL_COLUMNS = "FullName | Email | NationalId | Phone | DepartmentCode";

function UploadZone({ accept, label, hint, onFile, disabled }) {
  const ref = useRef();
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        border: "2px dashed",
        borderColor: "grey.300",
        borderRadius: 3,
        p: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        "&:hover": { borderColor: "primary.main", bgcolor: "primary.50" },
        transition: "all .2s",
      }}
    >
      <input
        ref={ref}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <Typography variant="body1" fontWeight={600}>{label}</Typography>
      <Typography variant="caption" color="text.secondary" textAlign="center">{hint}</Typography>
    </Box>
  );
}

function ResultsSummary({ data }) {
  if (!data) return null;
  const { imported, failed, errors = [], success } = data;
  return (
    <Box sx={{ mt: 2 }}>
      <Box className="flex gap-3 flex-wrap mb-2">
        {imported != null && <Chip label={`${imported} imported`} color="success" size="small" />}
        {failed != null && failed > 0 && <Chip label={`${failed} failed`} color="error" size="small" />}
        {success === true && <Chip label="All rows succeeded" color="success" size="small" />}
      </Box>
      {errors.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, maxHeight: 200, overflowY: "auto" }}>
          {errors.map((e, i) => (
            <Typography key={i} variant="caption" display="block" color="error">{e}</Typography>
          ))}
        </Paper>
      )}
    </Box>
  );
}

function AsyncJobResult({ jobId }) {
  if (!jobId) return null;
  return (
    <Alert severity="info" sx={{ mt: 2 }}>
      File accepted for background processing. Job ID: <strong>{jobId}</strong>
      <br />
      You'll receive a notification when processing is complete.
    </Alert>
  );
}

// ── Tab 1: Students — Sync Excel Import ──────────────────────────────────────
function StudentsExcelTab() {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file) => {
    setBusy(true);
    setResult(null);
    setError("");
    setProgress(0);
    try {
      const { data } = await importStudentsExcel(file, setProgress);
      setResult(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, []);

  return (
    <Box className="space-y-4">
      <Alert severity="info">
        <strong>Sync import</strong> — results return immediately. File must be <code>.xlsx</code>.<br />
        Required columns: <code>{STUDENT_EXCEL_COLUMNS}</code>
      </Alert>

      <UploadZone
        accept=".xlsx"
        label="Click to select student Excel file (.xlsx)"
        hint={`Columns: ${STUDENT_EXCEL_COLUMNS}`}
        onFile={handleFile}
        disabled={busy}
      />

      {busy && <LinearProgress variant="determinate" value={progress} />}
      {error && <Alert severity="error">{error}</Alert>}
      <ResultsSummary data={result} />
    </Box>
  );
}

// ── Tab 2: Students — AI Bulk Import ─────────────────────────────────────────
function StudentsAITab() {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file) => {
    setBusy(true);
    setJobId(null);
    setError("");
    setProgress(0);
    try {
      const data = await bulkUploadStudentsAI(file, setProgress);
      setJobId(data?.jobId ?? data?.JobId ?? "N/A");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, []);

  return (
    <Box className="space-y-4">
      <Alert severity="info">
        <strong>AI-powered async import</strong> — processes in the background (max 20 MB).<br />
        Accepts Excel, PDF, CSV, or Text files.
      </Alert>

      <UploadZone
        accept=".xlsx,.xls,.pdf,.csv,.txt"
        label="Click to select student file"
        hint="Excel, PDF, CSV, or Text — max 20 MB"
        onFile={handleFile}
        disabled={busy}
      />

      {busy && <LinearProgress variant="determinate" value={progress} />}
      {error && <Alert severity="error">{error}</Alert>}
      <AsyncJobResult jobId={jobId} />
    </Box>
  );
}

// ── Tab 3: Doctors — Async Bulk Import ───────────────────────────────────────
function DoctorsTab() {
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [error, setError] = useState("");

  const handleFile = useCallback(async (file) => {
    setBusy(true);
    setJobId(null);
    setError("");
    setProgress(0);
    try {
      const data = await bulkUploadDoctors(file, setProgress);
      setJobId(data?.jobId ?? data?.JobId ?? "N/A");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
      setProgress(0);
    }
  }, []);

  return (
    <Box className="space-y-4">
      <Alert severity="info">
        <strong>Doctor async import</strong> — processes in the background (max 20 MB).<br />
        Required columns: <code>{DOCTOR_EXCEL_COLUMNS}</code>
      </Alert>

      <UploadZone
        accept=".xlsx,.xls,.pdf,.csv,.txt"
        label="Click to select doctor file"
        hint="Excel, PDF, CSV, or Text — max 20 MB"
        onFile={handleFile}
        disabled={busy}
      />

      {busy && <LinearProgress variant="determinate" value={progress} />}
      {error && <Alert severity="error">{error}</Alert>}
      <AsyncJobResult jobId={jobId} />
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
function AcademicBulkImportPage() {
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-5">
      <PageHeader title="Academic Bulk Import" breadcrumbs={BREADCRUMBS} />

      <Paper variant="outlined" sx={{ p: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
          <Tab label="Students — Excel (Sync)" />
          <Tab label="Students — AI Import (Async)" />
          <Tab label="Doctors — Bulk Import (Async)" />
        </Tabs>

        {tab === 0 && <StudentsExcelTab />}
        {tab === 1 && <StudentsAITab />}
        {tab === 2 && <DoctorsTab />}
      </Paper>
    </div>
  );
}

export default AcademicBulkImportPage;
