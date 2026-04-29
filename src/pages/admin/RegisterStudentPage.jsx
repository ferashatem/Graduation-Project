import { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Card, CardContent, Chip,
  Divider, TextField, Typography, MenuItem,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { registerStudent } from "../../api/authApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import apiClient from "../../api/apiClient";

const breadcrumbs = [{ label: "Student Affairs" }, { label: "Register Student" }];

const emptyForm = {
  fullName: "", nationalId: "", phone: "",
  collegeCode: "", departmentCode: "", batchCode: "", groupCode: "",
  universityStudentId: "",
};

function RegisterStudentPage() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  // Cascading selectors
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    apiClient.get("/colleges", { params: { page: 1, pageSize: 100 } })
      .then((r) => {
        const p = r.data?.data ?? r.data;
        setColleges(Array.isArray(p) ? p : (p?.data ?? []));
      })
      .catch(() => {});
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleCollegeChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, collegeCode: code, departmentCode: "", batchCode: "", groupCode: "" }));
    setDepartments([]); setBatches([]); setGroups([]);
    if (!code) return;
    try {
      const college = colleges.find((c) => c.code === code);
      if (!college) return;
      const r = await apiClient.get(`/departments/by-college/${college.id}`);
      const p = r.data?.data ?? r.data;
      setDepartments(Array.isArray(p) ? p : []);
    } catch { /* ignore */ }
  }, [colleges]);

  const handleDeptChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, departmentCode: code, batchCode: "", groupCode: "" }));
    setBatches([]); setGroups([]);
    if (!code) return;
    try {
      const dept = departments.find((d) => d.code === code);
      if (!dept) return;
      const r = await apiClient.get(`/batches/by-department/${dept.id}`);
      const p = r.data?.data ?? r.data;
      setBatches(Array.isArray(p) ? p : []);
    } catch { /* ignore */ }
  }, [departments]);

  const handleBatchChange = useCallback(async (code) => {
    setValues((p) => ({ ...p, batchCode: code, groupCode: "" }));
    setGroups([]);
    if (!code) return;
    try {
      const batch = batches.find((b) => b.code === code);
      if (!batch) return;
      const r = await apiClient.get(`/groups/by-batch/${batch.id}`);
      const p = r.data?.data ?? r.data;
      setGroups(Array.isArray(p) ? p : []);
    } catch { /* ignore */ }
  }, [batches]);

  const validate = useCallback(() => {
    const next = {};
    if (!values.fullName.trim()) next.fullName = "Full name is required.";
    if (!values.nationalId.trim()) next.nationalId = "National ID is required.";
    if (!values.phone.trim()) next.phone = "Phone is required.";
    if (!values.collegeCode) next.collegeCode = "College is required.";
    if (!values.departmentCode) next.departmentCode = "Department is required.";
    if (!values.batchCode) next.batchCode = "Batch is required.";
    if (!values.groupCode) next.groupCode = "Group is required.";
    return next;
  }, [values]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSubmitting(true);
    setApiError("");
    setResult(null);
    try {
      const res = await registerStudent(values);
      setResult(res);
      setValues(emptyForm);
      setDepartments([]); setBatches([]); setGroups([]);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [validate, values]);

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Register Student" breadcrumbs={breadcrumbs} />

      {result && (
        <Alert severity="success" onClose={() => setResult(null)}>
          <p className="font-semibold">Student registered successfully!</p>
          <p>University Email: <strong>{result.universityEmail}</strong></p>
          <p>University ID: <strong>{result.generatedUniversityId}</strong></p>
          <p>Temporary Password: <strong>{result.temporaryPassword || result.generatedPassword || "—"}</strong></p>
          <p className="text-xs mt-1 text-slate-500">Share these credentials with the student.</p>
        </Alert>
      )}

      {apiError ? <Alert severity="error">{apiError}</Alert> : null}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Typography variant="h6" className="font-semibold">Personal Information</Typography>

            <TextField label="Full Name" name="fullName" value={values.fullName}
              onChange={handleChange} error={Boolean(errors.fullName)}
              helperText={errors.fullName} fullWidth required />

            <div className="grid grid-cols-2 gap-4">
              <TextField label="National ID" name="nationalId" value={values.nationalId}
                onChange={handleChange} error={Boolean(errors.nationalId)}
                helperText={errors.nationalId} fullWidth required />
              <TextField label="Phone" name="phone" value={values.phone}
                onChange={handleChange} error={Boolean(errors.phone)}
                helperText={errors.phone || "e.g. +201001234567"} fullWidth required />
            </div>

            <TextField label="University Student ID (optional)" name="universityStudentId"
              value={values.universityStudentId} onChange={handleChange} fullWidth />

            <Divider />
            <Typography variant="h6" className="font-semibold">Academic Placement</Typography>

            <TextField select label="College" name="collegeCode" value={values.collegeCode}
              onChange={(e) => handleCollegeChange(e.target.value)}
              error={Boolean(errors.collegeCode)} helperText={errors.collegeCode} fullWidth required>
              <MenuItem value="">— Select college —</MenuItem>
              {colleges.map((c) => <MenuItem key={c.code} value={c.code}>{c.name}</MenuItem>)}
            </TextField>

            <TextField select label="Department" name="departmentCode" value={values.departmentCode}
              onChange={(e) => handleDeptChange(e.target.value)}
              error={Boolean(errors.departmentCode)} helperText={errors.departmentCode}
              fullWidth required disabled={!departments.length}>
              <MenuItem value="">— Select department —</MenuItem>
              {departments.map((d) => <MenuItem key={d.code} value={d.code}>{d.name}</MenuItem>)}
            </TextField>

            <TextField select label="Batch" name="batchCode" value={values.batchCode}
              onChange={(e) => handleBatchChange(e.target.value)}
              error={Boolean(errors.batchCode)} helperText={errors.batchCode}
              fullWidth required disabled={!batches.length}>
              <MenuItem value="">— Select batch —</MenuItem>
              {batches.map((b) => <MenuItem key={b.code} value={b.code}>{b.name}</MenuItem>)}
            </TextField>

            <TextField select label="Group / Section" name="groupCode" value={values.groupCode}
              onChange={handleChange}
              error={Boolean(errors.groupCode)} helperText={errors.groupCode}
              fullWidth required disabled={!groups.length}>
              <MenuItem value="">— Select group —</MenuItem>
              {groups.map((g) => <MenuItem key={g.code} value={g.code}>{g.name}</MenuItem>)}
            </TextField>

            <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
              {submitting ? "Registering..." : "Register Student"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterStudentPage;
