import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, TextField, Typography, CircularProgress, Autocomplete,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SchoolIcon from "@mui/icons-material/School";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import LayersIcon from "@mui/icons-material/Layers";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import apiClient from "../../api/apiClient";
import {
  createSubject, deleteSubject, fetchSubjectsByBatch, updateSubject, assignDoctorToSubject,
} from "../../features/subjects/api/subjectsApi";
import { fetchColleges } from "../../features/colleges/api/collegesApi";
import { fetchDepartmentsByCollege } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Subjects" }];

const emptyForm = { name: "", code: "", creditHours: 3 };

// ─── Subject Form Dialog ──────────────────────────────────────────────────────
function SubjectFormDialog({ open, initialValues, onClose, onSubmit, submitting, error, colleges }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [collegeCode, setCollegeCode] = useState("");
  const [departmentCode, setDepartmentCode] = useState("");
  const [batchCode, setBatchCode] = useState("");

  const isEdit = useMemo(() => Boolean(initialValues?.id), [initialValues]);

  useEffect(() => {
    if (!open) return;
    setValues({ name: initialValues?.name || "", code: initialValues?.code || "", creditHours: initialValues?.creditHours ?? 3 });
    setErrors({});
    setCollegeCode(""); setDepartmentCode(""); setBatchCode("");
    setDepartments([]); setBatches([]);
  }, [open, initialValues]);

  const handleCollegeChange = useCallback(async (code) => {
    setCollegeCode(code);
    setDepartmentCode(""); setBatchCode("");
    setDepartments([]); setBatches([]);
    if (!code) return;
    const college = colleges.find((c) => c.code === code);
    if (!college) return;
    setDeptLoading(true);
    try {
      const data = await fetchDepartmentsByCollege(college.id);
      setDepartments(data);
    } catch { /* ignore */ } finally { setDeptLoading(false); }
  }, [colleges]);

  const handleDeptChange = useCallback(async (code) => {
    setDepartmentCode(code);
    setBatchCode(""); setBatches([]);
    if (!code) return;
    const dept = departments.find((d) => d.code === code);
    if (!dept) return;
    setBatchLoading(true);
    try {
      const data = await fetchBatchesByDepartment(dept.id);
      setBatches(data);
    } catch { /* ignore */ } finally { setBatchLoading(false); }
  }, [departments]);

  const validate = useCallback(() => {
    const next = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!values.code.trim()) next.code = "Code is required.";
    if (!isEdit && Number(values.creditHours) < 1) next.creditHours = "Credit hours must be at least 1.";
    if (!isEdit && !collegeCode) next.collegeCode = "College is required.";
    if (!isEdit && !departmentCode) next.departmentCode = "Department is required.";
    return next;
  }, [values, isEdit, collegeCode, departmentCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit({
      name: values.name.trim(),
      code: values.code.trim(),
      creditHours: Number(values.creditHours) || 3,
      collegeCode,
      departmentCode,
      batchCode: batchCode || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? "Edit Subject" : "Add Subject"}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert> : null}

          <TextField
            label="Subject Name" name="name" value={values.name}
            onChange={(e) => setValues((p) => ({ ...p, name: e.target.value }))}
            error={Boolean(errors.name)} helperText={errors.name}
            fullWidth required autoFocus
          />
          <TextField
            label="Subject Code (e.g. CS201)" name="code" value={values.code}
            onChange={(e) => setValues((p) => ({ ...p, code: e.target.value }))}
            error={Boolean(errors.code)} helperText={errors.code}
            fullWidth required disabled={isEdit}
          />
          <TextField
            label="Credit Hours" name="creditHours" type="number"
            value={values.creditHours}
            onChange={(e) => setValues((p) => ({ ...p, creditHours: e.target.value }))}
            error={Boolean(errors.creditHours)} helperText={errors.creditHours}
            fullWidth required inputProps={{ min: 1, max: 6 }}
            disabled={isEdit}
          />

          {!isEdit && (
            <>
              <TextField
                select label="College" value={collegeCode}
                onChange={(e) => handleCollegeChange(e.target.value)}
                error={Boolean(errors.collegeCode)} helperText={errors.collegeCode || "Select college first"}
                fullWidth required
              >
                <MenuItem value="">— Select college —</MenuItem>
                {colleges.map((c) => (
                  <MenuItem key={c.code} value={c.code}>{c.name} ({c.code})</MenuItem>
                ))}
              </TextField>

              <TextField
                select label="Department" value={departmentCode}
                onChange={(e) => handleDeptChange(e.target.value)}
                error={Boolean(errors.departmentCode)}
                helperText={
                  deptLoading ? "Loading departments…" :
                  errors.departmentCode || (!collegeCode ? "Select a college first" : "")
                }
                fullWidth required disabled={!collegeCode || deptLoading}
              >
                <MenuItem value="">— Select department —</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.code} value={d.code}>{d.name} ({d.code})</MenuItem>
                ))}
              </TextField>

              <TextField
                select label="Batch (optional)" value={batchCode}
                onChange={(e) => setBatchCode(e.target.value)}
                helperText={
                  batchLoading ? "Loading batches…" :
                  !departmentCode ? "Select a department first" : "Leave empty for department-level subject"
                }
                fullWidth disabled={!departmentCode || batchLoading}
              >
                <MenuItem value="">— No specific batch —</MenuItem>
                {batches.map((b) => (
                  <MenuItem key={b.code} value={b.code}>{b.name} ({b.code})</MenuItem>
                ))}
              </TextField>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={18} /> : (isEdit ? "Save Changes" : "Create Subject")}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ─── Assign Doctor Dialog ─────────────────────────────────────────────────────
function AssignDoctorDialog({ open, subject, colleges, onClose, onAssigned }) {
  const [selectedCollegeId, setSelectedCollegeId] = useState("");
  const [deptIds, setDeptIds] = useState(new Set());
  const [deptLoading, setDeptLoading] = useState(false);

  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setSelectedCollegeId(""); setDeptIds(new Set());
      setAllDoctors([]); setSelectedDoctor(null); setError("");
    }
  }, [open]);

  // When college changes: fetch departments → get their IDs → fetch all doctors
  const handleCollegeChange = useCallback(async (collegeId) => {
    setSelectedCollegeId(collegeId);
    setDeptIds(new Set()); setAllDoctors([]); setSelectedDoctor(null);
    if (!collegeId) return;

    setDeptLoading(true);
    try {
      const { fetchDepartmentsByCollege: fetchDepts } = await import("../../features/departments/api/departmentsApi");
      const { fetchAllDoctors: fetchDocs } = await import("../../features/doctors/api/doctorsApi");

      const [depts, doctorRes] = await Promise.all([
        fetchDepts(collegeId),
        fetchDocs({ size: 200 }),
      ]);

      const ids = new Set(depts.map((d) => String(d.id)));
      setDeptIds(ids);
      const filtered = doctorRes.items.filter((doc) => ids.has(String(doc.departmentId)));
      setAllDoctors(filtered);
    } catch { setAllDoctors([]); }
    finally { setDeptLoading(false); setDoctorsLoading(false); }
  }, []);

  const handleAssign = useCallback(async () => {
    if (!selectedDoctor) return;
    setSubmitting(true);
    setError("");
    try {
      const doctorCode = selectedDoctor.Code ?? selectedDoctor.code ?? "";
      const doctorId   = selectedDoctor.Id   ?? selectedDoctor.id   ?? "";
      const subjectId  = subject.id ?? "";

      if (doctorCode) {
        await assignDoctorToSubject(subject.code, doctorCode);
      } else if (doctorId && subjectId) {
        // fallback: assign by ULID when code is missing
        await apiClient.put("/subjects/assign-doctor-by-id", null, {
          params: { subjectId, doctorId },
        });
      } else {
        throw new Error("Doctor has no code or ID — cannot assign.");
      }

      onAssigned(subject.code, {
        ...selectedDoctor,
        code:     doctorCode || doctorId,
        fullName: selectedDoctor.fullName ?? selectedDoctor.FullName ?? selectedDoctor.name ?? "",
      });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [selectedDoctor, subject, onAssigned, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Doctor — {subject?.name}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
        {error ? <Alert severity="error">{error}</Alert> : null}

        {/* College selector */}
        <TextField
          select label="College" value={selectedCollegeId} size="small" fullWidth autoFocus
          onChange={(e) => handleCollegeChange(e.target.value)}
          helperText="Select college first to filter doctors"
        >
          <MenuItem value="">— Select college —</MenuItem>
          {colleges.map((c) => (
            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
          ))}
        </TextField>

        {/* Doctor selector (filtered by college) */}
        <Autocomplete
          disabled={!selectedCollegeId || deptLoading}
          options={allDoctors}
          getOptionLabel={(o) => `${o.fullName ?? o.FullName ?? o.name ?? ""} (${o.Code ?? o.code ?? ""})`}
          isOptionEqualToValue={(o, v) => (o.Code ?? o.code) === (v.Code ?? v.code)}
          value={selectedDoctor}
          onChange={(_, val) => setSelectedDoctor(val)}
          loading={deptLoading}
          noOptionsText={
            !selectedCollegeId ? "Select a college first" :
            deptLoading ? "Loading doctors…" :
            "No doctors in this college"
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Doctor"
              size="small"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {deptLoading ? <CircularProgress size={16} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        {subject?.doctorName && (
          <p className="text-xs text-slate-500">
            Currently assigned: <span className="font-semibold">{subject.doctorName}</span>
          </p>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAssign}
          disabled={!selectedDoctor || submitting}
        >
          {submitting ? <CircularProgress size={18} /> : "Assign"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────
function FilterBar({ colleges, onBatchSelect }) {
  const [collegeId, setCollegeId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  const selectedCollege = useMemo(() => colleges.find((c) => c.id === collegeId), [colleges, collegeId]);
  const selectedDept = useMemo(() => departments.find((d) => d.id === deptId), [departments, deptId]);
  const selectedBatch = useMemo(() => batches.find((b) => b.id === batchId), [batches, batchId]);

  const handleCollegeChange = useCallback(async (id) => {
    setCollegeId(id); setDeptId(""); setBatchId("");
    setDepartments([]); setBatches([]);
    onBatchSelect(null, null);
    if (!id) return;
    setDeptLoading(true);
    try {
      const data = await fetchDepartmentsByCollege(id);
      setDepartments(data);
    } catch { /* ignore */ } finally { setDeptLoading(false); }
  }, [onBatchSelect]);

  const handleDeptChange = useCallback(async (id) => {
    setDeptId(id); setBatchId(""); setBatches([]);
    onBatchSelect(null, null);
    if (!id) return;
    setBatchLoading(true);
    try {
      const data = await fetchBatchesByDepartment(id);
      setBatches(data);
    } catch { /* ignore */ } finally { setBatchLoading(false); }
  }, [onBatchSelect]);

  const handleBatchChange = useCallback((id) => {
    setBatchId(id);
    const batch = batches.find((b) => b.id === id);
    onBatchSelect(id || null, batch || null);
  }, [batches, onBatchSelect]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
        Browse Subjects by Batch
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* College */}
        <div className="flex items-start gap-3">
          <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <SchoolIcon sx={{ fontSize: 18, color: "#2563eb" }} />
          </div>
          <TextField
            select label="College" value={collegeId} size="small" fullWidth
            onChange={(e) => handleCollegeChange(e.target.value)}
          >
            <MenuItem value="">— Select college —</MenuItem>
            {colleges.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
        </div>

        {/* Department */}
        <div className="flex items-start gap-3">
          <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-50">
            <AccountTreeIcon sx={{ fontSize: 18, color: "#7c3aed" }} />
          </div>
          <TextField
            select label="Department" value={deptId} size="small" fullWidth
            onChange={(e) => handleDeptChange(e.target.value)}
            disabled={!collegeId || deptLoading}
            helperText={deptLoading ? "Loading…" : (!collegeId ? "Select college first" : "")}
          >
            <MenuItem value="">— Select department —</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
        </div>

        {/* Batch */}
        <div className="flex items-start gap-3">
          <div className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <LayersIcon sx={{ fontSize: 18, color: "#059669" }} />
          </div>
          <TextField
            select label="Batch" value={batchId} size="small" fullWidth
            onChange={(e) => handleBatchChange(e.target.value)}
            disabled={!deptId || batchLoading}
            helperText={batchLoading ? "Loading…" : (!deptId ? "Select department first" : "")}
          >
            <MenuItem value="">— Select batch —</MenuItem>
            {batches.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name} ({b.code})</MenuItem>
            ))}
          </TextField>
        </div>
      </div>

      {/* Breadcrumb trail */}
      {(selectedCollege || selectedDept || selectedBatch) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          {selectedCollege && (
            <Chip icon={<SchoolIcon />} label={selectedCollege.name} size="small" color="primary" variant="outlined" />
          )}
          {selectedDept && (
            <><span className="text-slate-400 text-xs">›</span>
            <Chip icon={<AccountTreeIcon />} label={selectedDept.name} size="small" color="secondary" variant="outlined" /></>
          )}
          {selectedBatch && (
            <><span className="text-slate-400 text-xs">›</span>
            <Chip icon={<LayersIcon />} label={`${selectedBatch.name} (${selectedBatch.code})`} size="small" color="success" variant="outlined" /></>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [assignState, setAssignState] = useState({ open: false, subject: null });

  // Load colleges on mount
  useEffect(() => {
    fetchColleges({ pageSize: 100 })
      .then(setColleges)
      .catch(() => {})
      .finally(() => setCollegesLoading(false));
  }, []);

  // Load subjects when batch is selected
  const loadSubjects = useCallback(async (batchId) => {
    if (!batchId) { setSubjects([]); return; }
    setLoading(true);
    setLoadError("");
    try {
      const data = await fetchSubjectsByBatch(batchId);
      setSubjects(data.map((s) => ({
        ...s,
        id: s.id ?? s.Id ?? s.code ?? s.Code,
        code: s.code ?? s.Code ?? "",
        name: s.name ?? s.Name ?? "",
      })));
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleBatchSelect = useCallback((batchId, batch) => {
    setSelectedBatchId(batchId);
    setSelectedBatch(batch);
    setActionError("");
    loadSubjects(batchId);
  }, [loadSubjects]);

  const handleAdd = useCallback(() => {
    setEditing(null); setActionError(""); setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    setEditing(row); setActionError(""); setDialogOpen(true);
  }, []);

  const handleDeletePrompt = useCallback((row) => {
    setConfirmState({ open: true, row });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, row: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.row;
    handleCloseConfirm();
    if (!target) return;
    const code = target.code ?? target.Code;
    if (!code) { setActionError("Cannot delete: subject code is missing."); return; }
    try {
      await deleteSubject(code);
      setSubjects((prev) => prev.filter((s) => (s.code ?? s.Code) !== code));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [confirmState.row, handleCloseConfirm]);

  const handleSubmit = useCallback(async (values) => {
    setActionError(""); setSubmitting(true);
    try {
      if (editing) {
        await updateSubject(editing.code, { name: values.name, code: values.code });
        setSubjects((prev) => prev.map((s) =>
          s.code === editing.code ? { ...s, name: values.name } : s
        ));
      } else {
        const created = await createSubject(values);
        const newRow = { ...created, id: created.id ?? created.code };
        setSubjects((prev) => [...prev, newRow]);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [editing]);

  const handleAssignDoctor = useCallback((row) => {
    setAssignState({ open: true, subject: row });
  }, []);

  const handleDoctorAssigned = useCallback((subjectCode, doctor) => {
    setSubjects((prev) =>
      prev.map((s) =>
        s.code === subjectCode
          ? { ...s, doctorName: doctor.fullName ?? doctor.FullName ?? doctor.name ?? "", doctorCode: doctor.code ?? doctor.Code }
          : s
      )
    );
  }, []);

  const columns = useMemo(() => [
    {
      field: "name", headerName: "Subject Name", flex: 1, minWidth: 200,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50">
            <span className="text-xs font-bold text-blue-600">
              {(params.row.name || "S")[0].toUpperCase()}
            </span>
          </div>
          <span className="font-medium text-slate-800">{params.row.name}</span>
        </div>
      ),
    },
    {
      field: "code", headerName: "Code", width: 130,
      renderCell: (params) => (
        <Chip label={params.row.code} size="small" variant="outlined"
          sx={{ fontFamily: "monospace", fontWeight: 600 }} />
      ),
    },
    {
      field: "doctorName", headerName: "Assigned Doctor", flex: 1, minWidth: 160,
      renderCell: (params) => (
        params.row.doctorName
          ? <span className="text-sm text-slate-700">{params.row.doctorName}</span>
          : <span className="text-xs text-slate-400 italic">Not assigned</span>
      ),
    },
    {
      field: "actions", headerName: "Actions", width: 140,
      sortable: false, filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)} title="Edit">
            <EditIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" color="success" onClick={() => handleAssignDoctor(params.row)} title="Assign Doctor">
            <PersonAddIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeletePrompt(params.row)} title="Delete">
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </div>
      ),
    },
  ], [handleEdit, handleDeletePrompt, handleAssignDoctor]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subjects"
        breadcrumbs={breadcrumbs}
        action={<Button variant="contained" onClick={handleAdd}>Add Subject</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      {/* Filter bar */}
      {collegesLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <CircularProgress size={16} /> Loading colleges…
        </div>
      ) : (
        <FilterBar colleges={colleges} onBatchSelect={handleBatchSelect} />
      )}

      {/* Content area */}
      {!selectedBatchId ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 shadow-sm ring-1 ring-slate-200">
          <LayersIcon sx={{ fontSize: 52, color: "#cbd5e1", mb: 1.5 }} />
          <Typography variant="h6" className="font-semibold text-slate-400">
            Select a Batch to View Subjects
          </Typography>
          <p className="mt-1 text-sm text-slate-400">
            Use the filter above to browse College → Department → Batch
          </p>
        </div>
      ) : loadError ? (
        <ErrorState message={loadError} onRetry={() => loadSubjects(selectedBatchId)} />
      ) : loading ? (
        <Loading label="Loading subjects…" />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          {/* Batch header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <LayersIcon sx={{ fontSize: 18, color: "#059669" }} />
              <span className="text-sm font-semibold text-slate-700">
                {selectedBatch?.name} — {subjects.length} subject{subjects.length !== 1 ? "s" : ""}
              </span>
            </div>
            {subjects.length === 0 && (
              <span className="text-xs text-slate-400">No subjects for this batch yet</span>
            )}
          </div>

          <DataGrid
            autoHeight
            rows={subjects}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
            sx={{ border: 0 }}
          />
        </div>
      )}

      {/* Form Dialog */}
      <SubjectFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={actionError}
        colleges={colleges}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete subject?"
        message="This will permanently remove the subject."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />

      {assignState.subject && (
        <AssignDoctorDialog
          open={assignState.open}
          subject={assignState.subject}
          colleges={colleges}
          onClose={() => setAssignState({ open: false, subject: null })}
          onAssigned={handleDoctorAssigned}
        />
      )}
    </div>
  );
}

export default SubjectsPage;
