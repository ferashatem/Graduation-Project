import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Avatar, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Snackbar, TextField, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import AddIcon from "@mui/icons-material/Add";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { filterDoctors, patchDoctor, deleteDoctor } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments, fetchDepartmentsByCollege } from "../../features/departments/api/departmentsApi";
import { adminResetPassword, registerDoctor } from "../../api/authApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import apiClient from "../../api/apiClient";

const PAGE_SIZE = 25;

const emptyDoctorForm = { fullName: "", nationalId: "", phone: "", departmentCode: "", universityStaffId: "" };

function RegisterDoctorDialog({ open, onClose, onRegistered }) {
  const { t } = useTranslation();
  const [values, setValues]             = useState(emptyDoctorForm);
  const [errors, setErrors]             = useState({});
  const [submitting, setSubmitting]     = useState(false);
  const [result, setResult]             = useState(null);
  const [apiError, setApiError]         = useState("");
  const [colleges, setColleges]         = useState([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [departments, setDepartments]   = useState([]);
  const [deptLoading, setDeptLoading]   = useState(false);

  useEffect(() => {
    if (open && colleges.length === 0) {
      apiClient.get("/colleges", { params: { page: 1, pageSize: 100 } })
        .then((r) => {
          const p = r.data?.data ?? r.data;
          setColleges(Array.isArray(p) ? p : (p?.items ?? p?.data ?? []));
        }).catch(() => {});
    }
  }, [open, colleges.length]);

  useEffect(() => {
    if (!open) {
      setValues(emptyDoctorForm); setErrors({}); setResult(null); setApiError("");
      setSelectedCollegeId(""); setDepartments([]);
    }
  }, [open]);

  const set = useCallback((field) => (e) => setValues((p) => ({ ...p, [field]: e.target.value })), []);

  const handleCollegeChange = useCallback(async (collegeId) => {
    setSelectedCollegeId(collegeId);
    setDepartments([]);
    setValues((p) => ({ ...p, departmentCode: "" }));
    if (!collegeId) return;
    setDeptLoading(true);
    try { setDepartments(await fetchDepartmentsByCollege(collegeId)); }
    catch { }
    finally { setDeptLoading(false); }
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!values.fullName.trim())    next.fullName    = t("doctors.required");
    if (!values.nationalId.trim())  next.nationalId  = t("doctors.required");
    if (!values.phone.trim())       next.phone       = t("doctors.required");
    if (!values.departmentCode)     next.departmentCode = t("doctors.required");
    return next;
  }, [values, t]);

  const handleSubmit = useCallback(async () => {
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true); setApiError("");
    try {
      const res = await registerDoctor(values);
      setResult(res);
      setValues(emptyDoctorForm); setSelectedCollegeId(""); setDepartments([]);
      onRegistered();
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally { setSubmitting(false); }
  }, [validate, values, onRegistered]);

  return (
    <Dialog open={open} onClose={() => { if (!submitting) onClose(); }} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "90vh" } }}>
      <DialogTitle>{t("doctors.registerNewDoctor")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: "16px !important" }}>
        {result && (
          <Alert severity="success" onClose={() => setResult(null)}>
            <strong>{t("doctors.registeredSuccess")}</strong>
            <div className="mt-1 space-y-0.5 text-sm">
              <p>{t("doctors.email")}: <strong>{result.universityEmail}</strong></p>
              <p>{t("doctors.staffId")}: <strong>{result.generatedUniversityId}</strong></p>
              <p>{t("doctors.tempPassword")}: <strong>{result.temporaryPassword ?? result.generatedPassword ?? "—"}</strong></p>
            </div>
          </Alert>
        )}
        {apiError && <Alert severity="error">{apiError}</Alert>}

        <TextField label={t("doctors.fullName")} value={values.fullName} onChange={set("fullName")} size="small"
          error={Boolean(errors.fullName)} helperText={errors.fullName} fullWidth required />

        <div className="grid grid-cols-2 gap-3">
          <TextField label={t("doctors.nationalId")} value={values.nationalId} onChange={set("nationalId")} size="small"
            error={Boolean(errors.nationalId)} helperText={errors.nationalId} fullWidth required />
          <TextField label={t("doctors.phone")} value={values.phone} onChange={set("phone")} size="small"
            error={Boolean(errors.phone)} helperText={errors.phone || t("doctors.phoneHint")} fullWidth required />
        </div>

        <TextField label={t("doctors.universityStaffIdOptional")} value={values.universityStaffId}
          onChange={set("universityStaffId")} fullWidth size="small" />

        <hr className="border-slate-200" />

        <TextField select label={t("doctors.college")} value={selectedCollegeId} size="small"
          onChange={(e) => handleCollegeChange(e.target.value)} fullWidth required
          helperText={t("doctors.selectCollegeHint")}>
          <MenuItem value="">{t("doctors.selectCollege")}</MenuItem>
          {colleges.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>

        <TextField select label={t("doctors.department")} value={values.departmentCode} size="small"
          onChange={set("departmentCode")} error={Boolean(errors.departmentCode)}
          helperText={deptLoading ? t("doctors.loading") : errors.departmentCode || (!selectedCollegeId ? t("doctors.selectCollegeFirst") : "")}
          fullWidth required disabled={!selectedCollegeId || deptLoading}>
          <MenuItem value="">{t("doctors.selectDepartment")}</MenuItem>
          {deptLoading
            ? <MenuItem disabled><CircularProgress size={14} sx={{ mr: 1 }} /> {t("doctors.loading")}</MenuItem>
            : departments.map((d) => <MenuItem key={d.code} value={d.code}>{d.name} ({d.code})</MenuItem>)}
        </TextField>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={submitting}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t("doctors.registering") : t("doctors.registerDoctor")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditDoctorDialog({ open, doctor, onClose, onSaved }) {
  const { t } = useTranslation();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && doctor) {
      setFullName(doctor.fullName ?? "");
      setPhone(doctor.phone ?? "");
      setError("");
    }
  }, [open, doctor]);

  const handleSave = useCallback(async () => {
    if (!fullName.trim()) { setError(t("doctors.fullNameRequired")); return; }
    setLoading(true);
    setError("");
    try {
      const updated = await patchDoctor(doctor.id, {
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      onSaved(updated ?? { ...doctor, fullName: fullName.trim(), phone: phone.trim() });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, t("doctors.failedUpdate")));
    } finally {
      setLoading(false);
    }
  }, [doctor, fullName, phone, onSaved, onClose, t]);

  return (
    <Dialog open={open} onClose={() => { if (!loading) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle>{t("doctors.editDoctor")}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField label={t("doctors.fullName")} fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} required />
        <TextField label={t("doctors.phone")} fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} helperText={t("doctors.phoneHint")} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>{loading ? t("doctors.saving") : t("common.save")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ResetResultDialog({ open, result, onClose }) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t("doctors.passwordResetSuccess")}</DialogTitle>
      <DialogContent>
        <Alert severity="success">{t("doctors.shareCredentials")}</Alert>
        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p><strong>{t("doctors.newPassword")}</strong> {result?.temporaryPassword ?? result?.newPassword ?? "—"}</p>
          <p className="text-xs text-slate-500">{t("doctors.mustChangeNextLogin")}</p>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">{t("common.close")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function DoctorsPage() {
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("doctors.breadcrumbAffairs") }, { label: t("doctors.breadcrumbDoctors") }];
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteState, setDeleteState] = useState({ open: false, doctor: null });
  const [deleting, setDeleting] = useState(false);
  const [resetState, setResetState] = useState({ open: false, doctor: null });
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  const debounceRef = useRef(null);

  useEffect(() => {
    fetchAllDepartments().then(setDepartments).catch(() => {});
  }, []);

  const normalize = useCallback((d) => ({
    ...d,
    id: d.id ?? d.code,
    fullName: d.fullName ?? d.name ?? "",
    email: d.universityEmail ?? d.email ?? "",
    universityStaffId: d.universityStaffId ?? "—",
    departmentName: d.departmentName ?? "—",
    collegeName: d.collegeName ?? "—",
  }), []);

  const load = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const result = await filterDoctors(params);
      setDoctors(result.items.map(normalize));
      setRowCount(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [normalize]);

  useEffect(() => {
    load({ departmentId: departmentId || undefined, search, page: page + 1, size: PAGE_SIZE });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, departmentId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load({ departmentId: departmentId || undefined, search, page: 1, size: PAGE_SIZE });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleEditSaved = useCallback((updated) => {
    setDoctors((prev) => prev.map((d) => (d.id === updated.id ? { ...d, ...normalize(updated) } : d)));
    setToast({ open: true, message: t("doctors.doctorUpdated"), severity: "success" });
  }, [normalize, t]);

  const handleDelete = useCallback(async () => {
    const target = deleteState.doctor;
    if (!target) return;
    setDeleting(true);
    try {
      await deleteDoctor(target.code ?? target.id);
      setDoctors((prev) => prev.filter((d) => d.id !== target.id));
      setRowCount((c) => c - 1);
      setToast({ open: true, message: t("doctors.doctorDeleted"), severity: "success" });
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, t("doctors.failedDelete")), severity: "error" });
    } finally {
      setDeleting(false);
      setDeleteState({ open: false, doctor: null });
    }
  }, [deleteState.doctor, t]);

  const handleResetPassword = useCallback(async () => {
    const target = resetState.doctor;
    if (!target) return;
    setResetting(true);
    try {
      const res = await adminResetPassword(target.id);
      setResetResult(res);
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, t("doctors.failedReset")), severity: "error" });
    } finally {
      setResetting(false);
      setResetState({ open: false, doctor: null });
    }
  }, [resetState.doctor, t]);

  const columns = useMemo(
    () => [
      {
        field: "avatar", headerName: "", width: 50, sortable: false, filterable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.fullName || "D")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: t("doctors.name"), flex: 1, minWidth: 200 },
      { field: "email", headerName: t("doctors.email"), flex: 1, minWidth: 220 },
      { field: "universityStaffId", headerName: t("doctors.staffId"), flex: 1, minWidth: 160 },
      { field: "departmentName", headerName: t("doctors.department"), flex: 1, minWidth: 180 },
      { field: "collegeName", headerName: t("doctors.college"), flex: 1, minWidth: 160 },
      {
        field: "actions", headerName: t("doctors.actions"), width: 130, sortable: false, filterable: false,
        renderCell: (params) => (
          <div className="flex items-center gap-1">
            <Tooltip title={t("doctors.edit")}>
              <IconButton size="small" onClick={() => setEditTarget(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("doctors.resetPassword")}>
              <IconButton size="small" color="warning" onClick={() => setResetState({ open: true, doctor: params.row })}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={t("doctors.delete")}>
              <IconButton size="small" color="error" onClick={() => setDeleteState({ open: true, doctor: params.row })}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        ),
      },
    ],
    [t]
  );

  return (
    <div className="space-y-5">
      <PageHeader title={t("doctors.title")} breadcrumbs={breadcrumbs} />

      <div className="flex flex-wrap items-center gap-3">
        <TextField
          size="small" placeholder={t("doctors.searchPlaceholder")}
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 320 }}
        />
        <TextField
          select size="small" label={t("doctors.department")} value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">{t("doctors.allDepartments")}</MenuItem>
          {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
        <div className="ml-auto">
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => setRegisterOpen(true)}
            sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
          >
            {t("doctors.registerDoctor")}
          </Button>
        </div>
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => load({ departmentId, search, page: page + 1, size: PAGE_SIZE })} />
      ) : null}

      {loading && doctors.length === 0 ? (
        <Loading label={t("doctors.loadingDoctors")} />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight rows={doctors} columns={columns} loading={loading}
            rowCount={rowCount} paginationMode="server"
            paginationModel={{ page, pageSize: PAGE_SIZE }}
            onPaginationModelChange={(m) => setPage(m.page)}
            pageSizeOptions={[PAGE_SIZE]} disableRowSelectionOnClick
          />
        </div>
      )}

      <RegisterDoctorDialog
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onRegistered={() => { load({ departmentId: departmentId || undefined, search, page: page + 1, size: PAGE_SIZE }); }}
      />

      <EditDoctorDialog
        open={Boolean(editTarget)} doctor={editTarget}
        onClose={() => setEditTarget(null)} onSaved={handleEditSaved}
      />

      <ConfirmDialog
        open={deleteState.open} title={t("doctors.deleteTitle")}
        message={t("doctors.deleteMessage", { name: deleteState.doctor?.fullName ?? t("doctors.thisDoctor") })}
        confirmLabel={t("doctors.delete")} loading={deleting}
        onClose={() => setDeleteState({ open: false, doctor: null })}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={resetState.open} title={t("doctors.resetTitle")}
        message={t("doctors.resetMessage", { name: resetState.doctor?.fullName ?? t("doctors.thisDoctor") })}
        confirmLabel={t("doctors.reset")} loading={resetting}
        onClose={() => setResetState({ open: false, doctor: null })}
        onConfirm={handleResetPassword}
      />

      <ResetResultDialog open={Boolean(resetResult)} result={resetResult} onClose={() => setResetResult(null)} />

      <Snackbar
        open={toast.open} onClose={() => setToast((p) => ({ ...p, open: false }))}
        autoHideDuration={4000} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setToast((p) => ({ ...p, open: false }))} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default DoctorsPage;
