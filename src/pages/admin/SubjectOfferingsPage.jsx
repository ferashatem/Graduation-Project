import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, MenuItem,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchOfferingsBySemester, createOffering } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { fetchSubjectsByDepartment } from "../../features/subjects/api/subjectsApi";
import { filterDoctors } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Subject Offerings" }];

const emptyForm = {
  subjectCode: "",
  doctorCode: "",
  departmentCode: "", batchCode: "", groupCode: "",
  maxCapacity: 50,
};

function OfferingFormDialog({ open, semesterId, onClose, onSubmit, error }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  const [batches, setBatches] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    setValues(emptyForm);
    setErrors({});
    setSubjects([]); setDoctors([]);
    setBatches([]); setGroups([]);
  }, [open]);

  const handleDeptChange = useCallback(async (dept) => {
    setValues((p) => ({ ...p, departmentCode: dept?.code ?? "", subjectCode: "", doctorCode: "", batchCode: "", groupCode: "" }));
    setSubjects([]); setDoctors([]);
    setBatches([]); setGroups([]);
    if (!dept?.id) return;

    setLoadingSubjects(true);
    fetchSubjectsByDepartment(dept.id)
      .then(setSubjects)
      .catch(() => {})
      .finally(() => setLoadingSubjects(false));

    setLoadingDoctors(true);
    filterDoctors({ departmentId: dept.id, size: 200 })
      .then((res) => setDoctors(res.items ?? []))
      .catch(() => {})
      .finally(() => setLoadingDoctors(false));

    fetchBatchesByDepartment(dept.id).then(setBatches).catch(() => {});
  }, []);

  const handleBatchChange = useCallback(async (batchCode) => {
    setValues((p) => ({ ...p, batchCode, groupCode: "" }));
    setGroups([]);
    if (!batchCode) return;
    setBatches((prev) => {
      const batch = prev.find((b) => b.code === batchCode);
      if (batch?.id) fetchGroupsByBatch(batch.id).then(setGroups).catch(() => {});
      return prev;
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!values.subjectCode) next.subjectCode = "Select a subject.";
    if (!values.doctorCode) next.doctorCode = "Select a doctor.";
    if (!values.departmentCode) next.departmentCode = "Select a department.";
    if (!values.batchCode) next.batchCode = "Select a batch.";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    try {
      await onSubmit({
        subjectCode: values.subjectCode,
        semesterId,
        doctorCode: values.doctorCode,
        departmentCode: values.departmentCode,
        batchCode: values.batchCode,
        groupCode: values.groupCode || null,
        maxCapacity: Number(values.maxCapacity) || 50,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Add Subject Offering</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          {/* Step 1: Department */}
          <DepartmentSelector
            value={values.departmentCode}
            onChange={handleDeptChange}
            error={errors.departmentCode}
          />

          {/* Step 2: Subject — filtered by department */}
          <TextField select label="Subject" name="subjectCode"
            value={values.subjectCode} onChange={handleChange}
            fullWidth size="small"
            disabled={!values.departmentCode || loadingSubjects}
            error={Boolean(errors.subjectCode)}
            helperText={errors.subjectCode || (!values.departmentCode ? "Select a department first" : "")}>
            <MenuItem value="">
              {loadingSubjects ? "Loading subjects…" : subjects.length === 0 && values.departmentCode ? "No subjects found" : "— Select subject —"}
            </MenuItem>
            {subjects.map((s) => (
              <MenuItem key={s.code} value={s.code}>{s.name} ({s.code})</MenuItem>
            ))}
          </TextField>

          {/* Step 3: Doctor — filtered by department */}
          <TextField select label="Doctor" name="doctorCode"
            value={values.doctorCode} onChange={handleChange}
            fullWidth size="small"
            disabled={!values.departmentCode || loadingDoctors}
            error={Boolean(errors.doctorCode)}
            helperText={errors.doctorCode || (!values.departmentCode ? "Select a department first" : "")}>
            <MenuItem value="">
              {loadingDoctors ? "Loading doctors…" : doctors.length === 0 && values.departmentCode ? "No doctors found" : "— Select doctor —"}
            </MenuItem>
            {doctors.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.fullName} ({d.code || d.universityStaffId || "—"})</MenuItem>
            ))}
          </TextField>

          {/* Step 4: Batch */}
          {batches.length > 0 && (
            <TextField select label="Batch" name="batchCode"
              value={values.batchCode}
              onChange={(e) => handleBatchChange(e.target.value)}
              fullWidth size="small" error={Boolean(errors.batchCode)}
              helperText={errors.batchCode}>
              <MenuItem value="">— Select batch —</MenuItem>
              {batches.map((b) => (
                <MenuItem key={b.code} value={b.code}>{b.name} ({b.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Step 5: Group (optional) */}
          {groups.length > 0 && (
            <TextField select label="Group (optional)" name="groupCode"
              value={values.groupCode} onChange={handleChange} fullWidth size="small">
              <MenuItem value="">— All groups —</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.code} value={g.code}>{g.name} ({g.code})</MenuItem>
              ))}
            </TextField>
          )}

          <TextField label="Max Capacity" name="maxCapacity" type="number"
            value={values.maxCapacity} onChange={handleChange} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Creating…" : "Create Offering"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Small component to load and display all departments
// value = department code (string); onChange = (deptObject) => void
function DepartmentSelector({ value, onChange, error }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    let active = true;
    fetchAllDepartments()
      .then((list) => { if (active) setDepartments(list); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleChange = (e) => {
    const code = e.target.value;
    const dept = departments.find((d) => d.code === code) ?? null;
    onChange(dept);
  };

  return (
    <TextField select label="Department" value={value}
      onChange={handleChange}
      fullWidth size="small" error={Boolean(error)} helperText={error}>
      <MenuItem value="">— Select department —</MenuItem>
      {departments.map((d) => (
        <MenuItem key={d.code} value={d.code}>{d.name} ({d.code})</MenuItem>
      ))}
    </TextField>
  );
}

function SubjectOfferingsPage() {
  const { semesterId } = useParams();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    if (!semesterId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchOfferingsBySemester(semesterId);
      setOfferings(data.map((o) => ({ ...o, id: o.id ?? o.code })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [semesterId]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = useCallback(async (dto) => {
    setActionError("");
    try {
      const created = await createOffering(dto);
      setOfferings((prev) => [...prev, { ...created, id: created.id ?? created.code }]);
      setDialogOpen(false);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, []);

  const columns = useMemo(() => [
    { field: "subjectName", headerName: "Subject", flex: 1, minWidth: 180 },
    { field: "doctorName", headerName: "Doctor", flex: 1, minWidth: 180 },
    { field: "semesterName", headerName: "Semester", flex: 1, minWidth: 140 },
    { field: "maxCapacity", headerName: "Capacity", width: 100 },
  ], []);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subject Offerings"
        breadcrumbs={[...breadcrumbs, { label: "Offerings" }]}
        action={<Button variant="contained" onClick={() => setDialogOpen(true)}>Add Offering</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? (
        <Loading label="Loading offerings..." />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight rows={offerings} columns={columns}
            loading={loading} disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          />
        </div>
      )}

      <OfferingFormDialog
        open={dialogOpen}
        semesterId={semesterId}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={actionError}
      />
    </div>
  );
}

export default SubjectOfferingsPage;
