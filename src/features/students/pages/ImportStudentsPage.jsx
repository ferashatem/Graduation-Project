import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import DownloadIcon from "@mui/icons-material/Download";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../../components/common/PageHeader";
import ImportDropzone from "../components/ImportDropzone";
import ImportHelpDialog from "../components/ImportHelpDialog";
import {
  downloadImportTemplate,
  exportCredentialsXlsx,
  importStudents,
  triggerBlobDownload,
} from "../api/studentsImportApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

// ─── Column guide data ────────────────────────────────────────────────────────
const REQUIRED_COLS = [
  "FullName",
  "NationalId (14 digits)",
  "Phone",
  "BatchCode",
  "GroupCode",
];
const OPTIONAL_COLS = [
  "Email",
  "Governorate",
  "Address",
  "Gender  (Male/Female)",
  "DateOfBirth",
  "StudentType",
  "Religion",
  "CollegeCode (verify)",
  "DepartmentCode (verify)",
];
const STUDENT_TYPE_LEGEND = [
  { excel: "Regular / منتظم", meaning: "Standard enrolled student" },
  { excel: "Transfer / منقول", meaning: "Transferred from another university" },
  { excel: "Repeating / معيد", meaning: "Repeating the academic year" },
  { excel: "External / انتساب", meaning: "External / distance student" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const parseWarningsByRow = (warnings = []) => {
  const map = {};
  warnings.forEach((w) => {
    const m = w.match(/^Row (\d+):\s*(.*)/);
    if (m) {
      const row = parseInt(m[1]);
      if (!map[row]) map[row] = [];
      map[row].push(m[2]);
    }
  });
  return map;
};

const parseErrorRows = (errors = []) =>
  errors.map((e) => {
    const m = e.match(/^Row (\d+):\s*(.*)/);
    return m ? { row: m[1], message: m[2] } : { row: "—", message: e };
  });

const exportErrorsCsv = (errors) => {
  const rows = parseErrorRows(errors);
  const csv = `Row,Error\n${rows
    .map((r) => `${r.row},"${r.message.replace(/"/g, '""')}"`)
    .join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv" });
  triggerBlobDownload(blob, "skipped_rows.csv");
};

const exportStudentsCsv = (students) => {
  const headers = [
    "#", "Full Name", "University ID", "Email",
    "Phone", "National ID", "Batch", "Group",
    "Department", "Student Type",
  ];
  const rows = students.map((s, i) => [
    i + 1,
    s.fullName || s.name || "",
    s.universityStudentId || s.studentId || "",
    s.universityEmail || s.email || "",
    s.phone || "",
    s.nationalId || "",
    s.batchCode || s.batch || "",
    s.groupCode || s.group || "",
    s.departmentName || s.department || "",
    s.studentType || "",
  ]);
  const csv = [headers, ...rows]
    .map((r) =>
      r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const date = new Date().toISOString().slice(0, 10);
  triggerBlobDownload(blob, `imported_students_${date}.csv`);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ColumnGuide({ onDownloadTemplate }) {
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        divider={<Divider orientation="vertical" flexItem />}
      >
        {/* Required */}
        <Box flex={1}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Required columns
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {REQUIRED_COLS.map((c) => (
              <Stack key={c} direction="row" alignItems="center" spacing={0.75}>
                <Box
                  component="span"
                  sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "error.main", flexShrink: 0 }}
                />
                <Typography variant="body2">{c}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Optional */}
        <Box flex={1}>
          <Typography
            variant="caption"
            fontWeight={700}
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing={0.5}
          >
            Optional columns
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {OPTIONAL_COLS.map((c) => (
              <Stack key={c} direction="row" alignItems="center" spacing={0.75}>
                <Box
                  component="span"
                  sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "divider", flexShrink: 0 }}
                />
                <Typography variant="body2" color="text.secondary">{c}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Stack>

      {/* StudentType legend */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        StudentType values:
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 0.75 }}>
        {STUDENT_TYPE_LEGEND.map((t) => (
          <Tooltip key={t.excel} title={t.meaning} arrow>
            <Chip
              label={t.excel}
              size="small"
              variant="outlined"
              sx={{ fontFamily: "monospace", cursor: "default" }}
            />
          </Tooltip>
        ))}
      </Stack>

      <Box sx={{ mt: 2 }}>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          onClick={onDownloadTemplate}
          variant="outlined"
        >
          Download Template
        </Button>
      </Box>
    </Paper>
  );
}

function ImportSummaryBanner({ result, onCopy, copied }) {
  const hasIssues = result.skipped > 0 || result.warnings?.length > 0;
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: "1px solid",
        borderColor: hasIssues ? "warning.light" : "success.light",
        bgcolor: hasIssues ? "warning.50" : "success.50",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 28 }} />
        <Typography variant="h6" fontWeight={700}>
          Import Complete
        </Typography>
      </Stack>

      <Stack direction="row" spacing={4} sx={{ mb: 2.5 }}>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={800} color="success.main">
            {result.imported ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            students imported
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography
            variant="h4"
            fontWeight={800}
            color={result.skipped > 0 ? "error.main" : "text.disabled"}
          >
            {result.skipped ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            skipped
          </Typography>
        </Box>
        <Box textAlign="center">
          <Typography variant="h4" fontWeight={800} color="text.secondary">
            {result.totalRows ?? 0}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            total rows
          </Typography>
        </Box>
      </Stack>

      {result.temporaryPassword && (
        <Box
          sx={{
            p: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                🔑 Temporary Password
              </Typography>
            </Stack>
            <Typography
              variant="h6"
              fontFamily="monospace"
              fontWeight={700}
              color="primary.main"
              sx={{ letterSpacing: 2 }}
            >
              {result.temporaryPassword}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Share this with students — they must change it on first login.
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={onCopy}
            color={copied ? "success" : "primary"}
          >
            {copied ? "Copied!" : "Copy Password"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

function CollapsiblePanel({ title, count, color, defaultExpanded, children }) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <Paper
      variant="outlined"
      sx={{ borderColor: `${color}.light`, overflow: "hidden" }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: `${color}.50`,
          cursor: "pointer",
          "&:hover": { bgcolor: `${color}.100` },
        }}
        onClick={() => setOpen((p) => !p)}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          {color === "warning" ? (
            <WarningAmberIcon sx={{ color: `${color}.main` }} />
          ) : (
            <ErrorOutlineIcon sx={{ color: `${color}.main` }} />
          )}
          <Typography variant="subtitle2" fontWeight={700} color={`${color}.dark`}>
            {title}
          </Typography>
          <Chip
            label={count}
            size="small"
            color={color}
            sx={{ height: 20, fontSize: 11 }}
          />
        </Stack>
        <IconButton size="small">
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ px: 2.5, py: 2 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}

function WarningsPanel({ warnings }) {
  const [showAll, setShowAll] = useState(false);
  if (!warnings?.length) return null;
  const visible = showAll ? warnings : warnings.slice(0, 4);

  return (
    <CollapsiblePanel
      title={`${warnings.length} Warning${warnings.length !== 1 ? "s" : ""}  (rows were imported, review recommended)`}
      count={warnings.length}
      color="warning"
      defaultExpanded={false}
    >
      <Stack spacing={0.75}>
        {visible.map((w, i) => (
          <Typography key={i} variant="body2" sx={{ lineHeight: 1.5 }}>
            • {w}
          </Typography>
        ))}
        {warnings.length > 4 && !showAll && (
          <Button
            size="small"
            variant="text"
            onClick={() => setShowAll(true)}
            sx={{ alignSelf: "flex-start", mt: 0.5 }}
          >
            View All ({warnings.length}) ↓
          </Button>
        )}
      </Stack>
    </CollapsiblePanel>
  );
}

function ErrorsPanel({ errors }) {
  const parsedErrors = useMemo(() => parseErrorRows(errors), [errors]);
  if (!errors?.length) return null;

  return (
    <CollapsiblePanel
      title={`${errors.length} Row${errors.length !== 1 ? "s" : ""} Skipped  (fix and re-import these rows only)`}
      count={errors.length}
      color="error"
      defaultExpanded={true}
    >
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={70}>
                <strong>Row</strong>
              </TableCell>
              <TableCell>
                <strong>Reason</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parsedErrors.map((e, i) => (
              <TableRow key={i}>
                <TableCell sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                  {e.row}
                </TableCell>
                <TableCell>{e.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 1.5 }}>
        <Button
          size="small"
          startIcon={<DownloadIcon />}
          variant="outlined"
          color="error"
          onClick={() => exportErrorsCsv(errors)}
        >
          Export Skipped Rows
        </Button>
      </Box>
    </CollapsiblePanel>
  );
}

function ImportedStudentsTable({ students, warningsByRow }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!students?.length) return [];
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        (s.fullName || s.name || "").toLowerCase().includes(q) ||
        (s.universityStudentId || s.studentId || "").toLowerCase().includes(q) ||
        (s.universityEmail || s.email || "").toLowerCase().includes(q) ||
        (s.batchCode || s.batch || "").toLowerCase().includes(q)
    );
  }, [students, search]);

  if (!students?.length) return null;

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          Imported Students ({students.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <TextField
            size="small"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 200 }}
          />
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            variant="outlined"
            onClick={() => exportStudentsCsv(filtered)}
          >
            Export
          </Button>
        </Stack>
      </Stack>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell width={48}>#</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>University ID</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Batch</TableCell>
              <TableCell>Group</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((s, i) => {
              const rowNum = s.rowNumber;
              const rowWarnings = rowNum ? warningsByRow[rowNum] : null;
              return (
                <TableRow key={i} hover>
                  <TableCell sx={{ color: "text.disabled", fontFamily: "monospace" }}>
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <span>{s.fullName || s.name}</span>
                      {rowWarnings?.length > 0 && (
                        <Tooltip
                          title={
                            <Box>
                              {rowWarnings.map((w, wi) => (
                                <div key={wi}>• {w}</div>
                              ))}
                            </Box>
                          }
                          arrow
                        >
                          <WarningAmberIcon
                            sx={{ fontSize: 16, color: "warning.main", cursor: "help" }}
                          />
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: 13 }}>
                    {s.universityStudentId || s.studentId}
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>
                    {s.universityEmail || s.email}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.batchCode || s.batch || "—"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{s.groupCode || s.group || "—"}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: "text.disabled" }}>
                  No students match your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function ImportStudentsPage() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [actionError, setActionError] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const breadcrumbs = useMemo(() => [{ label: "Import Students" }], []);

  const warningsByRow = useMemo(
    () => parseWarningsByRow(result?.warnings),
    [result?.warnings]
  );

  const handleImport = useCallback(async () => {
    if (!file) return;
    setImporting(true);
    setActionError("");
    setResult(null);

    try {
      const data = await importStudents(file);
      setResult(data);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  }, [file]);

  const handleCopyPassword = useCallback(async () => {
    if (!result?.temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(result.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard unavailable */
    }
  }, [result?.temporaryPassword]);

  const handleReset = useCallback(() => {
    setFile(null);
    setResult(null);
    setActionError("");
    setCopied(false);
  }, []);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      await downloadImportTemplate();
    } catch {
      /* silently fail — user will retry */
    }
  }, []);

  const noStudentsImported = result && (result.imported ?? 0) === 0;
  const importedStudents = result?.importedCredentials ?? result?.importedStudents ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Students"
        breadcrumbs={breadcrumbs}
        action={
          <IconButton onClick={() => setHelpOpen(true)} title="Help">
            <HelpOutlineIcon />
          </IconButton>
        }
      />

      {/* ── Upload form — hidden after successful import ── */}
      {!result && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Step 1 */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
            Step 1 — Prepare your file
          </Typography>
          <ColumnGuide onDownloadTemplate={handleDownloadTemplate} />

          {/* Step 2 */}
          <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1.5 }}>
            Step 2 — Upload file
          </Typography>
          <ImportDropzone file={file} onFile={setFile} disabled={importing} />

          {actionError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {actionError}
            </Alert>
          )}

          <Divider sx={{ my: 3 }} />

          <Stack direction="row" spacing={1.5} justifyContent="flex-end">
            <Button variant="outlined" onClick={handleReset} disabled={importing || !file}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleImport}
              disabled={importing || !file}
              startIcon={importing ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {importing ? "Importing…" : "Import Students →"}
            </Button>
          </Stack>

          {importing && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", textAlign: "right", mt: 1 }}
            >
              Processing rows…
            </Typography>
          )}
        </Paper>
      )}

      {/* ── Import result ── */}
      {result && (
        <Stack spacing={2.5}>
          {/* Summary banner */}
          {!noStudentsImported && (
            <ImportSummaryBanner
              result={result}
              onCopy={handleCopyPassword}
              copied={copied}
            />
          )}

          {noStudentsImported && (
            <Alert severity="error">
              No students were imported. All {result.totalRows} rows were skipped. Fix the
              errors below and try again.
            </Alert>
          )}

          {/* Warnings */}
          {result.warnings?.length > 0 && (
            <WarningsPanel warnings={result.warnings} />
          )}

          {/* Errors */}
          {result.errors?.length > 0 && (
            <ErrorsPanel errors={result.errors} />
          )}

          {/* Students table + download */}
          {!noStudentsImported && importedStudents.length > 0 && (
            <>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={() => exportCredentialsXlsx(result)}
                  color="success"
                >
                  تحميل ملف البيانات ({importedStudents.length}) — Excel
                </Button>
              </Stack>
              <ImportedStudentsTable
                students={importedStudents}
                warningsByRow={warningsByRow}
              />
            </>
          )}

          {/* Re-import action */}
          <Box>
            <Button variant="outlined" onClick={handleReset}>
              Import Another File
            </Button>
          </Box>
        </Stack>
      )}

      <ImportHelpDialog open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default ImportStudentsPage;
