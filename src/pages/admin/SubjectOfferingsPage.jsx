import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, InputAdornment, MenuItem, CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchOfferingsBySemester, createOffering } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { searchSubjects } from "../../features/subjects/api/subjectsApi";
import { searchDoctors } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Subject Offerings" }];

const emptyForm = {
  subjectId: "", subjectName: "",
  doctorId: "", doctorName: "",
  departmentId: "", batchId: "", groupId: "",
  maxCapacity: 50,
};

function OfferingFormDialog({ open, semesterId, onClose, onSubmit, error }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Subject search
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectResults, setSubjectResults] = useState([]);
  const [subjectLoading, setSubjectLoading] = useState(false);

  // Doctor search
  const [doctorQuery, setDoctorQuery] = useState("");
  const [doctorResults, setDoctorResults] = useState([]);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const [batches, setBatches] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!open) return;
    setValues(emptyForm);
    setErrors({});
    setSubjectQuery(""); setSubjectResults([]);
    setDoctorQuery(""); setDoctorResults([]);
    setBatches([]); setGroups([]);
  }, [open]);

  const searchForSubject = useCallback(async () => {
    if (!subjectQuery.trim()) return;
    setSubjectLoading(true);
    try {
      const data = await searchSubjects(subjectQuery);
      setSubjectResults(data);
    } finally {
      setSubjectLoading(false);
    }
  }, [subjectQuery]);

  const searchForDoctor = useCallback(async () => {
    if (!doctorQuery.trim()) return;
    setDoctorLoading(true);
    try {
      const data = await searchDoctors(doctorQuery);
      setDoctorResults(data);
    } finally {
      setDoctorLoading(false);
    }
  }, [doctorQuery]);

  const handleDeptChange = useCallback(async (deptId) => {
    setValues((p) => ({ ...p, departmentId: deptId, batchId: "", groupId: "" }));
    setBatches([]); setGroups([]);
    if (!deptId) return;
    try {
      const data = await fetchBatchesByDepartment(deptId);
      setBatches(data);
    } catch { /* ignore */ }
  }, []);

  const handleBatchChange = useCallback(async (batchId) => {
    setValues((p) => ({ ...p, batchId, groupId: "" }));
    setGroups([]);
    if (!batchId) return;
    try {
      const data = await fetchGroupsByBatch(batchId);
      setGroups(data);
    } catch { /* ignore */ }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!values.subjectId) next.subjectId = "Select a subject.";
    if (!values.doctorId) next.doctorId = "Select a doctor.";
    if (!values.departmentId) next.departmentId = "Select a department.";
    if (!values.batchId) next.batchId = "Select a batch.";
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
        subjectId: values.subjectId,
        semesterId,
        doctorId: values.doctorId,
        departmentId: values.departmentId,
        batchId: values.batchId,
        groupId: values.groupId || null,
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
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}

          {/* Subject search */}
          <div className="flex gap-2">
            <TextField label="Search Subject" value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchForSubject()}
              size="small" sx={{ flex: 1 }} error={Boolean(errors.subjectId)}
              helperText={errors.subjectId} />
            <Button size="small" variant="outlined" onClick={searchForSubject}
              disabled={subjectLoading || !subjectQuery.trim()}>
              {subjectLoading ? <CircularProgress size={16} /> : "Find"}
            </Button>
          </div>
          {subjectResults.length > 0 && (
            <TextField select label="Select Subject" name="subjectId"
              value={values.subjectId} onChange={handleChange} fullWidth size="small">
              {subjectResults.map((s) => (
                <MenuItem key={s.id} value={s.id}>{s.name} ({s.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Doctor search */}
          <div className="flex gap-2">
            <TextField label="Search Doctor" value={doctorQuery}
              onChange={(e) => setDoctorQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchForDoctor()}
              size="small" sx={{ flex: 1 }} error={Boolean(errors.doctorId)}
              helperText={errors.doctorId} />
            <Button size="small" variant="outlined" onClick={searchForDoctor}
              disabled={doctorLoading || !doctorQuery.trim()}>
              {doctorLoading ? <CircularProgress size={16} /> : "Find"}
            </Button>
          </div>
          {doctorResults.length > 0 && (
            <TextField select label="Select Doctor" name="doctorId"
              value={values.doctorId} onChange={handleChange} fullWidth size="small">
              {doctorResults.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.fullName} ({d.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Department selector — fetch all */}
          <DepartmentSelector
            value={values.departmentId}
            onChange={handleDeptChange}
            error={errors.departmentId}
          />

          {/* Batch */}
          {batches.length > 0 && (
            <TextField select label="Batch" name="batchId"
              value={values.batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              fullWidth size="small" error={Boolean(errors.batchId)}
              helperText={errors.batchId}>
              {batches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name} ({b.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Group (optional) */}
          {groups.length > 0 && (
            <TextField select label="Group (optional)" name="groupId"
              value={values.groupId} onChange={handleChange} fullWidth size="small">
              <MenuItem value="">— All groups —</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>{g.name} ({g.code})</MenuItem>
              ))}
            </TextField>
          )}

          <TextField label="Max Capacity" name="maxCapacity" type="number"
            value={values.maxCapacity} onChange={handleChange} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>Create Offering</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// Small component to load and display all departments
function DepartmentSelector({ value, onChange, error }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    let active = true;

    const loadDepartments = async () => {
      try {
        const list = await fetchAllDepartments();
        if (active) setDepartments(list);
      } catch {}
    };

    loadDepartments();
    return () => {
      active = false;
    };
  }, []);

  return (
    <TextField select label="Department" value={value}
      onChange={(e) => onChange(e.target.value)}
      fullWidth size="small" error={Boolean(error)} helperText={error}>
      <MenuItem value="">— Select department —</MenuItem>
      {departments.map((d) => (
        <MenuItem key={d.id} value={d.id}>{d.name} ({d.code})</MenuItem>
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
