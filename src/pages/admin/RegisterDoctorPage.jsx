import { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Card, CardContent, Divider, MenuItem, TextField, Typography,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import { registerDoctor } from "../../api/authApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import apiClient from "../../api/apiClient";

const breadcrumbs = [{ label: "Staff Affairs" }, { label: "Register Doctor" }];
const emptyForm = {
  fullName: "", nationalId: "", phone: "",
  departmentCode: "", universityStaffId: "",
};

function RegisterDoctorPage() {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    apiClient.get("/departments", { params: { page: 1, pageSize: 100 } })
      .then((r) => {
        const p = r.data?.data ?? r.data;
        setDepartments(Array.isArray(p) ? p : (p?.data ?? []));
      })
      .catch(() => {});
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!values.fullName.trim()) next.fullName = "Full name is required.";
    if (!values.nationalId.trim()) next.nationalId = "National ID is required.";
    if (!values.phone.trim()) next.phone = "Phone is required.";
    if (!values.departmentCode) next.departmentCode = "Department is required.";
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
      const res = await registerDoctor(values);
      setResult(res);
      setValues(emptyForm);
    } catch (err) {
      setApiError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [validate, values]);

  return (
    <div className="space-y-5 max-w-2xl">
      <PageHeader title="Register Doctor" breadcrumbs={breadcrumbs} />

      {result && (
        <Alert severity="success" onClose={() => setResult(null)}>
          <p className="font-semibold">Doctor registered successfully!</p>
          <p>University Email: <strong>{result.universityEmail}</strong></p>
          <p>Staff ID: <strong>{result.generatedUniversityId}</strong></p>
          <p>Temporary Password: <strong>{result.temporaryPassword || result.generatedPassword || "—"}</strong></p>
          <p className="text-xs mt-1 text-slate-500">Share these credentials with the doctor.</p>
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

            <TextField label="University Staff ID (optional)" name="universityStaffId"
              value={values.universityStaffId} onChange={handleChange} fullWidth />

            <Divider />
            <Typography variant="h6" className="font-semibold">Academic Placement</Typography>

            <TextField select label="Department" name="departmentCode"
              value={values.departmentCode} onChange={handleChange}
              error={Boolean(errors.departmentCode)} helperText={errors.departmentCode}
              fullWidth required>
              <MenuItem value="">— Select department —</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.code} value={d.code}>{d.name} ({d.code})</MenuItem>
              ))}
            </TextField>

            <Button type="submit" variant="contained" size="large" disabled={submitting} fullWidth>
              {submitting ? "Registering..." : "Register Doctor"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterDoctorPage;
