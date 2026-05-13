import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, InputAdornment, MenuItem, Snackbar, TextField, Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { filterDoctors, patchDoctor, deleteDoctor } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { adminResetPassword } from "../../api/authApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Staff Affairs" }, { label: "Doctors" }];
const PAGE_SIZE = 25;

function EditDoctorDialog({ open, doctor, onClose, onSaved }) {
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
    if (!fullName.trim()) { setError("Full name is required."); return; }
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
      setError(getErrorMessage(err, "Failed to update doctor."));
    } finally {
      setLoading(false);
    }
  }, [doctor, fullName, phone, onSaved, onClose]);

  return (
    <Dialog open={open} onClose={() => { if (!loading) onClose(); }} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Doctor</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField label="Full Name" fullWidth value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} required />
        <TextField label="Phone" fullWidth value={phone} onChange={(e) => setPhone(e.target.value)} disabled={loading} helperText="e.g. 01012345678" />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ResetResultDialog({ open, result, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Password Reset Successfully</DialogTitle>
      <DialogContent>
        <Alert severity="success">Share these credentials with the doctor.</Alert>
        <div className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
          <p><strong>New Password:</strong> {result?.temporaryPassword ?? result?.newPassword ?? "—"}</p>
          <p className="text-xs text-slate-500">The doctor must change this password on next login.</p>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

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
    setToast({ open: true, message: "Doctor updated.", severity: "success" });
  }, [normalize]);

  const handleDelete = useCallback(async () => {
    const target = deleteState.doctor;
    if (!target) return;
    setDeleting(true);
    try {
      await deleteDoctor(target.code ?? target.id);
      setDoctors((prev) => prev.filter((d) => d.id !== target.id));
      setRowCount((c) => c - 1);
      setToast({ open: true, message: "Doctor deleted.", severity: "success" });
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, "Failed to delete."), severity: "error" });
    } finally {
      setDeleting(false);
      setDeleteState({ open: false, doctor: null });
    }
  }, [deleteState.doctor]);

  const handleResetPassword = useCallback(async () => {
    const target = resetState.doctor;
    if (!target) return;
    setResetting(true);
    try {
      const res = await adminResetPassword(target.id);
      setResetResult(res);
    } catch (err) {
      setToast({ open: true, message: getErrorMessage(err, "Failed to reset password."), severity: "error" });
    } finally {
      setResetting(false);
      setResetState({ open: false, doctor: null });
    }
  }, [resetState.doctor]);

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
      { field: "fullName", headerName: "Name", flex: 1, minWidth: 200 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      { field: "universityStaffId", headerName: "Staff ID", flex: 1, minWidth: 160 },
      { field: "departmentName", headerName: "Department", flex: 1, minWidth: 180 },
      { field: "collegeName", headerName: "College", flex: 1, minWidth: 160 },
      {
        field: "actions", headerName: "Actions", width: 130, sortable: false, filterable: false,
        renderCell: (params) => (
          <div className="flex items-center gap-1">
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => setEditTarget(params.row)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Password">
              <IconButton size="small" color="warning" onClick={() => setResetState({ open: true, doctor: params.row })}>
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" color="error" onClick={() => setDeleteState({ open: true, doctor: params.row })}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Doctors / Professors" breadcrumbs={breadcrumbs} />

      <div className="flex flex-wrap gap-3">
        <TextField
          size="small" placeholder="Search by name, email, code, or staff ID..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 320 }}
        />
        <TextField
          select size="small" label="Department" value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All departments</MenuItem>
          {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
        </TextField>
      </div>

      {error && !loading ? (
        <ErrorState message={error} onRetry={() => load({ departmentId, search, page: page + 1, size: PAGE_SIZE })} />
      ) : null}

      {loading && doctors.length === 0 ? (
        <Loading label="Loading doctors..." />
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

      <EditDoctorDialog
        open={Boolean(editTarget)} doctor={editTarget}
        onClose={() => setEditTarget(null)} onSaved={handleEditSaved}
      />

      <ConfirmDialog
        open={deleteState.open} title="Delete doctor?"
        message={`Permanently delete ${deleteState.doctor?.fullName ?? "this doctor"}?`}
        confirmLabel="Delete" loading={deleting}
        onClose={() => setDeleteState({ open: false, doctor: null })}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={resetState.open} title="Reset password?"
        message={`Generate a new temporary password for ${resetState.doctor?.fullName ?? "this doctor"}?`}
        confirmLabel="Reset" loading={resetting}
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
