import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, InputAdornment, List, ListItemButton,
  ListItemText, TextField, MenuItem,
} from "@mui/material";
import { HiSearch } from "react-icons/hi";
import apiClient from "../../api/apiClient";
import { DataGrid } from "@mui/x-data-grid";
import { useParams, useLocation } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchOfferingsBySemester, createOffering, updateOffering, deleteOffering } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { fetchSubjectsByDepartment } from "../../features/subjects/api/subjectsApi";
import { filterDoctors } from "../../features/doctors/api/doctorsApi";
import { fetchDepartmentsByCollege } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

// breadcrumbs are built inside the component using t()

const emptyForm = {
  subjectCode: "",
  doctorCode: "",
  departmentCode: "", batchCode: "", groupCode: "",
  maxCapacity: 50,
};

function OfferingFormDialog({ open, semesterId, onClose, onSubmit, error, collegeId }) {
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
            collegeId={collegeId}
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
function DepartmentSelector({ value, onChange, error, collegeId }) {
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    let active = true;
    fetchDepartmentsByCollege(collegeId)
      .then((list) => { if (active) setDepartments(list); })
      .catch(() => {});
    return () => { active = false; };
  }, [collegeId]);

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

function EditOfferingDialog({ open, offering, onClose, onSubmit, error }) {
  const [values, setValues] = useState({ doctorId: "", maxCapacity: 50, groupId: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && offering) {
      setValues({
        doctorId: offering.doctorId ?? "",
        maxCapacity: offering.maxCapacity ?? 50,
        groupId: offering.groupId ?? "",
      });
    }
  }, [open, offering]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(offering.id, {
        doctorId: values.doctorId || null,
        maxCapacity: Number(values.maxCapacity) || 50,
        groupId: values.groupId || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Offering</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Doctor ID" name="doctorId" value={values.doctorId}
            onChange={handleChange} fullWidth size="small" />
          <TextField label="Max Capacity" name="maxCapacity" type="number"
            value={values.maxCapacity} onChange={handleChange} fullWidth size="small" />
          <TextField label="Group ID (optional)" name="groupId" value={values.groupId}
            onChange={handleChange} fullWidth size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving…" : "Save Changes"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function EnrollStudentDialog({ open, offering, onClose }) {
  const [query,       setQuery]       = useState("");
  const [results,     setResults]     = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [selected,    setSelected]    = useState(null);
  const [enrolling,   setEnrolling]   = useState(false);
  const [success,     setSuccess]     = useState("");
  const [error,       setError]       = useState("");

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setSelected(null); setSuccess(""); setError(""); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true); setError("");
      try {
        const res = await apiClient.get(`/students/search?q=${encodeURIComponent(query.trim())}&size=20`);
        const payload = res.data?.data ?? res.data;
        setResults(Array.isArray(payload) ? payload : payload?.items ?? []);
      } catch { setError("Search failed."); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const handleSearch = useCallback(() => {}, []);

  const handleEnroll = useCallback(async () => {
    if (!selected || !offering) return;
    setEnrolling(true); setError(""); setSuccess("");
    try {
      await apiClient.post(`/enrollments/${offering.id}/admin-enroll`, { studentId: selected.id });
      setSuccess(`${selected.fullName ?? selected.name} enrolled successfully!`);
      setSelected(null); setResults([]);
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? "Enrollment failed.");
    } finally { setEnrolling(false); }
  }, [selected, offering]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enroll Student — {offering?.subjectName ?? ""}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {success && <Alert severity="success">{success}</Alert>}
        {error   && <Alert severity="error">{error}</Alert>}

        <TextField
          label="Search student by name, email, or ID"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          fullWidth size="small"
          autoComplete="off"
          inputProps={{ autoComplete: "off" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={handleSearch} disabled={searching}>
                  {searching ? <CircularProgress size={16} /> : <HiSearch />}
                </Button>
              </InputAdornment>
            ),
          }}
        />

        {results.length > 0 && (
          <List dense sx={{ maxHeight: 220, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            {results.map((s) => (
              <ListItemButton
                key={s.id}
                selected={selected?.id === s.id}
                onClick={() => setSelected(s)}
              >
                <ListItemText
                  primary={s.fullName ?? s.name}
                  secondary={`${s.universityStudentId ?? s.code ?? ""} · ${s.email ?? ""}`}
                />
                {selected?.id === s.id && <Chip label="Selected" size="small" color="primary" />}
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selected || enrolling}
          onClick={handleEnroll}
        >
          {enrolling ? "Enrolling…" : "Enroll"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SubjectOfferingsPage() {
  const { t } = useTranslation();
  const { semesterId } = useParams();
  const { state } = useLocation();
  const collegeId = state?.collegeId ?? null;
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [enrollTarget, setEnrollTarget] = useState(null);
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

  const handleEditSubmit = useCallback(async (id, dto) => {
    setActionError("");
    try {
      const updated = await updateOffering(id, dto);
      setOfferings((prev) => prev.map((o) => o.id === id ? { ...o, ...updated, id } : o));
      setEditTarget(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm("Delete this offering?")) return;
    setActionError("");
    try {
      await deleteOffering(id);
      setOfferings((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, []);

  const columns = useMemo(() => [
    { field: "subjectName", headerName: t("subjectOfferings.subject"), flex: 1, minWidth: 180 },
    { field: "doctorName", headerName: t("subjectOfferings.doctor"), flex: 1, minWidth: 180 },
    { field: "semesterName", headerName: t("subjectOfferings.semester"), flex: 1, minWidth: 140 },
    { field: "maxCapacity", headerName: t("subjectOfferings.capacity"), width: 100 },
    {
      field: "actions", headerName: t("subjectOfferings.actions"), width: 260, sortable: false,
      renderCell: ({ row }) => (
        <div className="flex gap-2">
          <Button size="small" variant="outlined" color="success" onClick={() => setEnrollTarget(row)}>{t("subjectOfferings.enroll")}</Button>
          <Button size="small" variant="outlined" onClick={() => { setActionError(""); setEditTarget(row); }}>{t("subjectOfferings.edit")}</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => handleDelete(row.id)}>{t("subjectOfferings.delete")}</Button>
        </div>
      ),
    },
  ], [handleDelete, t]);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("subjectOfferings.title")}
        breadcrumbs={[
          { label: t("adminNav.subjectsRegistration") },
          { label: t("subjectOfferings.title") },
        ]}
        action={<Button variant="contained" onClick={() => setDialogOpen(true)}>{t("subjectOfferings.addOffering")}</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? (
        <Loading label={t("subjectOfferings.loading")} />
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
        collegeId={collegeId}
      />

      <EditOfferingDialog
        open={Boolean(editTarget)}
        offering={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
        error={actionError}
      />

      <EnrollStudentDialog
        open={Boolean(enrollTarget)}
        offering={enrollTarget}
        onClose={() => setEnrollTarget(null)}
      />
    </div>
  );
}

export default SubjectOfferingsPage;
