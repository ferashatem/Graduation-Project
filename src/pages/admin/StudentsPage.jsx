import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Alert, Avatar, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputAdornment, MenuItem, Switch, Tab, Tabs, TextField } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import LockResetIcon from "@mui/icons-material/LockReset";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DownloadIcon from "@mui/icons-material/Download";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { filterStudents, fetchStrugglingStudents } from "../../features/students/api/studentsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { fetchColleges } from "../../features/colleges/api/collegesApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { adminResetPassword, registerStudent } from "../../api/authApi";
import apiClient from "../../api/apiClient";

const exportToXlsx = (rows, filename) => {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((s, i) => ({
      "#": i + 1,
      "الاسم": s.fullName || "",
      "الرقم الجامعي": s.universityId || s.universityStudentId || "",
      "الإيميل الجامعي": s.email || s.universityEmail || "",
      "الكلية": s.collegeName || "",
      "القسم": s.departmentName || "",
      "الدفعة": s.batchName || "",
      "المجموعة": s.groupName || "",
      "الحالة": s.isActive ? "نشط" : "غير نشط",
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename
  );
};

const PAGE_SIZE = 25;

const emptyStudentForm = {
  fullName: "", email: "", nationalId: "", phone: "",
  collegeCode: "", departmentCode: "", batchCode: "", groupCode: "",
  universityStudentId: "",
};

function RegisterStudentDialog({ open, onClose, onRegistered }) {
  const { t } = useTranslation();
  const [values, setValues]         = useState(emptyStudentForm);
  const [errors, setErrors]         = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]         = useState(null);
  const [apiError, setApiError]     = useState("");
  const [sColleges, setSColleges]   = useState([]);
  const [sDepts, setSDepts]         = useState([]);
  const [sBatches, setSBatches]     = useState([]);
  const [sGroups, setSGroups]       = useState([]);

  useEffect(() => {
    if (open && sColleges.length === 0) {
      fetchColleges().then((d) => setSColleges(Array.isArray(d) ? d : [])).catch(() => {});
    }
  }, [open, sColleges.length]);

  useEffect(() => {
    if (!open) {
      setValues(emptyStudentForm); setErrors({}); setResult(null); setApiError("");
      setSDepts([]); setSBatches([]); setSGroups([]);
    }
  }, [open]);

  const set = useCallback((field) => (e) => setValues((p) => ({ ...p, [field]: e.target.value })), []);

  const handleCollegeChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, collegeCode: code, departmentCode: "", batchCode: "", groupCode: "" }));
    setSDepts([]); setSBatches([]); setSGroups([]);
    if (!code) return;
    try {
      const college = sColleges.find((c) => c.code === code);
      if (!college) return;
      const r = await apiClient.get(`/departments/by-college/${college.id}`);
      const p = r.data?.data ?? r.data;
      setSDepts(Array.isArray(p) ? p : []);
    } catch { }
  }, [sColleges]);

  const handleDeptChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, departmentCode: code, batchCode: "", groupCode: "" }));
    setSBatches([]); setSGroups([]);
    if (!code) return;
    try {
      const dept = sDepts.find((d) => d.code === code);
      if (!dept) return;
      const r = await apiClient.get(`/batches/by-department/${dept.id}`);
      const p = r.data?.data ?? r.data;
      setSBatches(Array.isArray(p) ? p : []);
    } catch { }
  }, [sDepts]);

  const handleBatchChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, batchCode: code, groupCode: "" }));
    setSGroups([]);
    if (!code) return;
    try {
      const batch = sBatches.find((b) => b.code === code);
      if (!batch) return;
      const r = await apiClient.get(`/groups/by-batch/${batch.id}`);
      const p = r.data?.data ?? r.data;
      setSGroups(Array.isArray(p) ? p : []);
    } catch { }
  }, [sBatches]);

  const validate = useCallback(() => {
    const next = {};
    if (!values.fullName.trim())   next.fullName   = t("students.required");
    if (!values.email.trim())      next.email      = t("students.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = t("students.invalidEmail");
    if (!values.nationalId.trim()) next.nationalId = t("students.required");
    if (!values.phone.trim())      next.phone      = t("students.required");
    if (!values.collegeCode)       next.collegeCode    = t("students.required");
    if (!values.departmentCode)    next.departmentCode = t("students.required");
    if (!values.batchCode)         next.batchCode      = t("students.required");
    if (!values.groupCode)         next.groupCode      = t("students.required");
    return next;
  }, [values, t]);

  const handleSubmit = useCallback(async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true); setApiError("");
    try {
      const res = await registerStudent(values);
      setResult(res);
      setValues(emptyStudentForm); setSDepts([]); setSBatches([]); setSGroups([]);
      onRegistered();
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally { setSubmitting(false); }
  }, [validate, values, onRegistered]);

  return (
    <Dialog open={open} onClose={() => { if (!submitting) onClose(); }} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "92vh" } }}>
      <DialogTitle>{t("students.registerNewStudent")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {result && (
          <Alert severity="success" onClose={() => setResult(null)}>
            <strong>{t("students.registeredSuccess")}</strong>
            <div className="mt-1 space-y-0.5 text-sm">
              <p>{t("students.email")}: <strong>{result.universityEmail}</strong></p>
              <p>{t("students.studentId")}: <strong>{result.generatedUniversityId}</strong></p>
              <p>{t("students.tempPassword")}: <strong>{result.temporaryPassword ?? result.generatedPassword ?? "—"}</strong></p>
            </div>
          </Alert>
        )}
        {apiError && <Alert severity="error">{apiError}</Alert>}

        <TextField label={t("students.fullName")} value={values.fullName} onChange={set("fullName")} size="small"
          error={Boolean(errors.fullName)} helperText={errors.fullName} fullWidth required />

        <TextField label={t("students.emailPersonal")} value={values.email} onChange={set("email")} size="small"
          type="email" error={Boolean(errors.email)} helperText={errors.email} fullWidth required />

        <div className="grid grid-cols-2 gap-3">
          <TextField label={t("students.nationalId")} value={values.nationalId} onChange={set("nationalId")} size="small"
            error={Boolean(errors.nationalId)} helperText={errors.nationalId} fullWidth required />
          <TextField label={t("students.phone")} value={values.phone} onChange={set("phone")} size="small"
            error={Boolean(errors.phone)} helperText={errors.phone || t("students.phoneHint")} fullWidth required />
        </div>

        <TextField label={t("students.universityStudentIdOptional")} value={values.universityStudentId}
          onChange={set("universityStudentId")} fullWidth size="small" />

        <hr className="border-slate-200" />

        <TextField select label={t("students.college")} value={values.collegeCode} size="small"
          onChange={(e) => handleCollegeChange(e.target.value)}
          error={Boolean(errors.collegeCode)} helperText={errors.collegeCode} fullWidth required>
          <MenuItem value="">{t("students.selectCollege")}</MenuItem>
          {sColleges.map((c) => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
        </TextField>

        <TextField select label={t("students.department")} value={values.departmentCode} size="small"
          onChange={(e) => handleDeptChange(e.target.value)}
          error={Boolean(errors.departmentCode)} helperText={errors.departmentCode}
          fullWidth required disabled={!sDepts.length}>
          <MenuItem value="">{t("students.selectDepartment")}</MenuItem>
          {sDepts.map((d) => <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>)}
        </TextField>

        <TextField select label={t("students.batch")} value={values.batchCode} size="small"
          onChange={(e) => handleBatchChange(e.target.value)}
          error={Boolean(errors.batchCode)} helperText={errors.batchCode}
          fullWidth required disabled={!sBatches.length}>
          <MenuItem value="">{t("students.selectBatch")}</MenuItem>
          {sBatches.map((b) => <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>)}
        </TextField>

        <TextField select label={t("students.groupSection")} value={values.groupCode} size="small"
          onChange={set("groupCode")}
          error={Boolean(errors.groupCode)} helperText={errors.groupCode}
          fullWidth required disabled={!sGroups.length}>
          <MenuItem value="">{t("students.selectGroup")}</MenuItem>
          {sGroups.map((g) => <MenuItem key={g.code} value={g.code}>{g.name}</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("students.registering") : t("students.registerStudent")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function StudentsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("students.breadcrumbAffairs") }, { label: t("students.title") }];
  const [tab, setTab] = useState(0);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Struggling tab state
  const [struggling, setStruggling] = useState([]);
  const [strugglingLoading, setStrugglingLoading] = useState(false);
  const [strugglingError, setStrugglingError] = useState("");
  const [strugglingPage, setStrugglingPage] = useState(0);
  const [strugglingTotal, setStrugglingTotal] = useState(0);

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState(null); // { id, name }
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState(""); // new password from server

  const handleResetPassword = useCallback(async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetError("");
    try {
      const res = await adminResetPassword(resetTarget.id);
      const newPassword = res?.temporaryPassword ?? res?.newPassword ?? "";
      setResetResult(newPassword);
    } catch (err) {
      setResetError(getErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  }, [resetTarget]);

  const closeResetDialog = useCallback(() => {
    setResetTarget(null);
    setResetError("");
    setResetResult("");
  }, []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [rowCount, setRowCount] = useState(0);

  // Filter state
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await filterStudents({
        collegeId: collegeId || undefined,
        departmentId: departmentId || undefined,
        batchId: batchId || undefined,
        groupId: groupId || undefined,
        isActive: activeOnly ? true : undefined,
        search,
        page: 1,
        size: 500,
      });
      const rows = result.items.map((s) => ({
        ...s,
        fullName: s.fullName ?? s.name ?? "",
        email: s.universityEmail ?? s.email ?? "",
        universityId: s.universityStudentId ?? s.universityId ?? "",
        batchName: s.batchName ?? "—",
        departmentName: s.departmentName ?? "—",
        groupName: s.groupName ?? "—",
      }));
      const date = new Date().toISOString().slice(0, 10);
      const label = departmentId
        ? (departments.find((d) => d.id === departmentId)?.name ?? "filtered")
        : "all";
      exportToXlsx(rows, `students_${label}_${date}.xlsx`);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [collegeId, departmentId, batchId, groupId, activeOnly, search, departments]);

  const debounceRef = useRef(null);

  // Load colleges once
  useEffect(() => {
    fetchColleges().then((data) => setColleges(Array.isArray(data) ? data : [])).catch(() => {});
    fetchAllDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleCollegeChange = useCallback(async (id) => {
    setCollegeId(id);
    setDepartmentId("");
    setBatchId("");
    setGroupId("");
    setBatches([]);
    setGroups([]);
    setPage(0);
    if (!id) {
      fetchAllDepartments().then(setDepartments).catch(() => {});
      return;
    }
    try {
      const r = await apiClient.get(`/departments/by-college/${id}`);
      const data = r.data?.data ?? r.data;
      setDepartments(Array.isArray(data) ? data : []);
    } catch {
      setDepartments([]);
    }
  }, []);

  const handleDeptChange = useCallback(async (id) => {
    setDepartmentId(id);
    setBatchId("");
    setBatches([]);
    setGroupId("");
    setGroups([]);
    setPage(0);
    if (!id) return;
    const dept = departments.find((d) => d.id === id);
    if (dept?.id) {
      fetchBatchesByDepartment(dept.id).then(setBatches).catch(() => {});
    }
  }, [departments]);

  const handleBatchChange = useCallback(async (id) => {
    setBatchId(id);
    setGroupId("");
    setGroups([]);
    setPage(0);
    if (!id) return;
    fetchGroupsByBatch(id).then((data) => setGroups(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const loadStruggling = useCallback(async (pg = 0) => {
    setStrugglingLoading(true);
    setStrugglingError("");
    try {
      const result = await fetchStrugglingStudents({ page: pg + 1, size: PAGE_SIZE });
      setStruggling(result.items.map((s) => ({ ...s, id: s.id ?? s.code })));
      setStrugglingTotal(result.total);
    } catch (err) {
      setStrugglingError(getErrorMessage(err));
    } finally {
      setStrugglingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) loadStruggling(strugglingPage);
  }, [tab, strugglingPage, loadStruggling]);

  const load = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const result = await filterStudents(params);
      // StudentDetailDto already includes batchName, departmentName, collegeName, groupName
      setStudents(result.items.map((s) => ({
        ...s,
        id: s.id ?? s.code,
        systemUserId: s.userId ?? s.systemUserId ?? s.id ?? s.code,
        fullName: s.fullName ?? s.FullName ?? s.name ?? "",
        email: s.universityEmail ?? s.email ?? "",
        universityId: s.universityStudentId ?? s.universityId ?? "",
        batchName: s.batchName ?? "—",
        departmentName: s.departmentName ?? "—",
        groupName: s.groupName ?? "—",
      })));
      setRowCount(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const buildParams = useCallback((pg = page) => ({
    collegeId: collegeId || undefined,
    departmentId: departmentId || undefined,
    batchId: batchId || undefined,
    groupId: groupId || undefined,
    isActive: activeOnly ? true : undefined,
    search,
    page: pg + 1,
    size: PAGE_SIZE,
  }), [collegeId, departmentId, batchId, groupId, activeOnly, search, page]);

  // Reload whenever page / filters change immediately (not search — that's debounced)
  useEffect(() => {
    load(buildParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, collegeId, departmentId, batchId, groupId, activeOnly]);

  // Debounce search input — 300 ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load({ ...buildParams(0) });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = useMemo(
    () => [
      {
        field: "avatar", headerName: "", width: 50,
        sortable: false, filterable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.fullName || "S")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: t("students.name"), flex: 1, minWidth: 200 },
      { field: "email", headerName: t("students.email"), flex: 1, minWidth: 220 },
      { field: "universityId", headerName: t("students.universityId"), flex: 1, minWidth: 160 },
      { field: "batchName", headerName: t("students.batch"), flex: 1, minWidth: 140 },
      { field: "departmentName", headerName: t("students.department"), flex: 1, minWidth: 160 },
      { field: "groupName", headerName: t("students.group"), width: 100 },
      {
        field: "isActive", headerName: t("students.status"), width: 120, sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.isActive ? t("common.active") : t("common.inactive")}
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "actions", headerName: "", width: 160, sortable: false, filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<LockResetIcon fontSize="small" />}
            onClick={() => setResetTarget({ id: params.row.systemUserId, name: params.row.fullName })}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            {t("students.resetPassword")}
          </Button>
        ),
      },
    ],
    [t]
  );

  const strugglingColumns = useMemo(
    () => [
      {
        field: "avatar", headerName: "", width: 50, sortable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.fullName || "S")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: t("students.name"), flex: 1, minWidth: 200 },
      { field: "email", headerName: t("students.email"), flex: 1, minWidth: 220 },
      { field: "universityStudentId", headerName: t("students.universityId"), flex: 1, minWidth: 160 },
      { field: "departmentName", headerName: t("students.department"), flex: 1, minWidth: 160 },
      { field: "batchName", headerName: t("students.batch"), flex: 1, minWidth: 140 },
      {
        field: "averageGradePoints", headerName: t("students.avgGpa"), width: 110,
        renderCell: (params) => (
          <Chip
            size="small"
            icon={<WarningAmberIcon fontSize="small" />}
            label={(params.row.averageGradePoints ?? 0).toFixed(2)}
            color="warning"
          />
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t("students.title")} breadcrumbs={breadcrumbs} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label={t("students.tabAll")} />
        <Tab label={t("students.tabStruggling")} icon={<WarningAmberIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <TextField
            size="small"
            placeholder={t("students.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
          <TextField
            select size="small" label={t("students.college")} value={collegeId}
            onChange={(e) => handleCollegeChange(e.target.value)} sx={{ width: 180 }}
          >
            <MenuItem value="">{t("students.allColleges")}</MenuItem>
            {colleges.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label={t("students.department")} value={departmentId}
            onChange={(e) => handleDeptChange(e.target.value)} sx={{ width: 180 }}
          >
            <MenuItem value="">{t("students.allDepartments")}</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          {batches.length > 0 && (
            <TextField
              select size="small" label={t("students.batch")} value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              sx={{ width: 160 }}
            >
              <MenuItem value="">{t("students.allBatches")}</MenuItem>
              {batches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          )}
          {groups.length > 0 && (
            <TextField
              select size="small" label={t("students.group")} value={groupId}
              onChange={(e) => { setGroupId(e.target.value); setPage(0); }}
              sx={{ width: 130 }}
            >
              <MenuItem value="">{t("students.allGroups")}</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </TextField>
          )}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={activeOnly}
                onChange={(e) => { setActiveOnly(e.target.checked); setPage(0); }}
              />
            }
            label={t("students.activeOnly")}
            sx={{ ml: 0 }}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? t("students.exporting") : `${t("students.exportExcel")}${rowCount ? ` (${rowCount})` : ""}`}
            </Button>
            <Button
              variant="outlined" size="small"
              startIcon={<UploadFileIcon />}
              onClick={() => navigate("/admin/import-students")}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {t("students.bulkImport")}
            </Button>
            <Button
              variant="contained" size="small"
              startIcon={<AddIcon />}
              onClick={() => setRegisterOpen(true)}
              sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
            >
              {t("students.registerStudent")}
            </Button>
          </div>
        </div>
      )}

      <RegisterStudentDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => { setPage(0); load(buildParams(0)); }}
      />

      {/* Reset Password Dialog */}
      <Dialog open={Boolean(resetTarget)} onClose={resetResult ? closeResetDialog : undefined} maxWidth="xs" fullWidth>
        <DialogTitle>{t("students.resetPassword")}</DialogTitle>
        <DialogContent>
          {resetResult ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-700">
                <Trans i18nKey="students.resetDoneFor" values={{ name: resetTarget?.name }} components={{ strong: <strong /> }} />
              </p>
              <p className="text-xs text-slate-500">{t("students.copyShareHint")}</p>
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-mono text-base font-semibold text-slate-900 ring-1 ring-slate-200">
                {resetResult}
                <button
                  onClick={() => navigator.clipboard.writeText(resetResult)}
                  className="ml-auto text-xs text-[#1d5fa3] hover:underline"
                >
                  {t("students.copy")}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-700">
                <Trans i18nKey="students.resetConfirm" values={{ name: resetTarget?.name }} components={{ strong: <strong /> }} />
              </p>
              {resetError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{resetError}</p>
              ) : null}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {resetResult ? (
            <Button onClick={closeResetDialog}>{t("common.close")}</Button>
          ) : (
            <>
              <Button onClick={closeResetDialog} disabled={resetLoading}>{t("common.cancel")}</Button>
              <Button onClick={handleResetPassword} disabled={resetLoading} color="warning" variant="contained">
                {resetLoading ? t("students.resetting") : t("students.resetPassword")}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {tab === 0 && (
        <>
          {error && !loading ? <ErrorState message={error} onRetry={() => load(buildParams())} /> : null}
          {loading && students.length === 0 ? (
            <Loading label={t("students.loadingStudents")} />
          ) : (
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
              <DataGrid
                autoHeight
                rows={students}
                columns={columns}
                loading={loading}
                rowCount={rowCount}
                paginationMode="server"
                paginationModel={{ page, pageSize: PAGE_SIZE }}
                onPaginationModelChange={(m) => setPage(m.page)}
                pageSizeOptions={[PAGE_SIZE]}
                disableRowSelectionOnClick
              />
            </div>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <p className="text-sm text-slate-500">
            <Trans i18nKey="students.strugglingNote" components={{ strong: <strong /> }} />
          </p>
          {strugglingError ? <ErrorState message={strugglingError} onRetry={() => loadStruggling(strugglingPage)} /> : null}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <DataGrid
              autoHeight
              rows={struggling}
              columns={strugglingColumns}
              loading={strugglingLoading}
              rowCount={strugglingTotal}
              paginationMode="server"
              paginationModel={{ page: strugglingPage, pageSize: PAGE_SIZE }}
              onPaginationModelChange={(m) => setStrugglingPage(m.page)}
              pageSizeOptions={[PAGE_SIZE]}
              disableRowSelectionOnClick
            />
          </div>
        </>
      )}
    </div>
  );
}

export default StudentsPage;
