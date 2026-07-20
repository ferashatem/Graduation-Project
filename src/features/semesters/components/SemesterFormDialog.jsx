import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
} from "@mui/material";

const emptyValues = { name: "", startDate: "", endDate: "" };

function SemesterFormDialog({ open, initialValues, onClose, onSubmit, submitting, error }) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  const isEdit = useMemo(() => Boolean(initialValues?.id), [initialValues]);
  const title = isEdit ? "Edit Semester" : "Add Semester";
  const submitLabel = isEdit ? "Save Changes" : "Create Semester";

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        startDate: initialValues?.startDate ? initialValues.startDate.slice(0, 10) : "",
        endDate: initialValues?.endDate ? initialValues.endDate.slice(0, 10) : "",
      });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!values.name.trim()) next.name = "Semester name is required.";
    if (!values.startDate) next.startDate = "Start date is required.";
    if (!values.endDate) next.endDate = "End date is required.";
    if (values.startDate && values.endDate && values.endDate <= values.startDate)
      next.endDate = "End date must be after start date.";
    return next;
  }, [values]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit({
      name: values.name.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
    });
  }, [onSubmit, validate, values]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Semester Name (e.g. Fall 2025)"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={values.startDate}
            onChange={handleChange}
            error={Boolean(errors.startDate)}
            helperText={errors.startDate}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={values.endDate}
            onChange={handleChange}
            error={Boolean(errors.endDate)}
            helperText={errors.endDate}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>{submitLabel}</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default SemesterFormDialog;
