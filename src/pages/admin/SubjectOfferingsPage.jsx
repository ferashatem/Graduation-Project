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
  subjectCode: "", subjectName: "",
  doctorCode: "", doctorName: "",
  departmentCode: "", batchCode: "", groupCode: "",
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

  // departments list for dept selector
  const [departments, setDepartments] = useState([]);

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

  const handleDeptChange = useCallback(async (dept) => {
    // dept = { id, code, name }
    setValues((p) => ({ ...p, departmentCode: dept?.code ?? "", batchCode: "", groupCode: "" }));
    setBatches([]); setGroups([]);
    if (!dept?.id) return;
    try {
      const data = await fetchBatchesByDepartment(dept.id);
      setBatches(data);
    } catch { /* ignore */ }
  }, []);

  const handleBatchChange = useCallback(async (batchCode) => {
    setValues((p) => ({ ...p, batchCode, groupCode: "" }));
    setGroups([]);
    if (!batchCode) return;
    // find batch id from batches list to fetch groups
    setBatches((prev) => {
      const batch = prev.find((b) => b.code === batchCode);
      if (batch?.id) {
        fetchGroupsByBatch(batch.id).then(setGroups).catch(() => {});
      }
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
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}

          {/* Subject search */}
          <div className="flex gap-2">
            <TextField label="Search Subject" value={subjectQuery}
              onChange={(e) => setSubjectQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchForSubject()}
              size="small" sx={{ flex: 1 }} error={Boolean(errors.subjectCode)}
              helperText={errors.subjectCode} />
            <Button size="small" variant="outlined" onClick={searchForSubject}
              disabled={subjectLoading || !subjectQuery.trim()}>
              {subjectLoading ? <CircularProgress size={16} /> : "Find"}
            </Button>
          </div>
          {subjectResults.length > 0 && (
            <TextField select label="Select Subject" name="subjectCode"
              value={values.subjectCode} onChange={handleChange} fullWidth size="small">
              {subjectResults.map((s) => (
                <MenuItem key={s.code} value={s.code}>{s.name} ({s.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Doctor search */}
          <div className="flex gap-2">
            <TextField label="Search Doctor" value={doctorQuery}
              onChange={(e) => setDoctorQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchForDoctor()}
              size="small" sx={{ flex: 1 }} error={Boolean(errors.doctorCode)}
              helperText={errors.doctorCode} />
            <Button size="small" variant="outlined" onClick={searchForDoctor}
              disabled={doctorLoading || !doctorQuery.trim()}>
              {doctorLoading ? <CircularProgress size={16} /> : "Find"}
            </Button>
          </div>
          {doctorResults.length > 0 && (
            <TextField select label="Select Doctor" name="doctorCode"
              value={values.doctorCode} onChange={handleChange} fullWidth size="small">
              {doctorResults.map((d) => (
                <MenuItem key={d.code} value={d.code}>{d.fullName} ({d.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Department selector — fetch all */}
          <DepartmentSelector
            value={values.departmentCode}
            onChange={handleDeptChange}
            error={errors.departmentCode}
          />

          {/* Batch */}
          {batches.length > 0 && (
            <TextField select label="Batch" name="batchCode"
              value={values.batchCode}
              onChange={(e) => handleBatchChange(e.target.value)}
              fullWidth size="small" error={Boolean(errors.batchCode)}
              helperText={errors.batchCode}>
              {batches.map((b) => (
                <MenuItem key={b.code} value={b.code}>{b.name} ({b.code})</MenuItem>
              ))}
            </TextField>
          )}

          {/* Group (optional) */}
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
          <Button type="submit" variant="contained" disabled={submitting}>Create Offering</Button>
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
