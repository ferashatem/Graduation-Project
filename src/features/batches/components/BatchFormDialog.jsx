import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Alert,
} from "@mui/material";

const emptyValues = { name: "", code: "" };

function BatchFormDialog({ open, initialValues, onClose, onSubmit, submitting, error }) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  const isEdit = useMemo(() => Boolean(initialValues?.id), [initialValues]);
  const title = isEdit ? "Edit Batch" : "Add Batch";
  const submitLabel = isEdit ? "Save Changes" : "Create Batch";

  useEffect(() => {
    if (open) {
      setValues({ name: initialValues?.name || "", code: initialValues?.code || "" });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    const next = {};
    if (!values.name.trim()) next.name = "Batch name is required.";
    if (!values.code.trim()) next.code = "Batch code is required.";
    return next;
  }, [values]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit({ name: values.name.trim(), code: values.code.trim().toUpperCase() });
  }, [onSubmit, validate, values]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Batch Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Batch Code (e.g. BATCH2024)"
            name="code"
            value={values.code}
            onChange={handleChange}
            error={Boolean(errors.code)}
            helperText={errors.code || "Unique code — used internally to reference this batch"}
            fullWidth
            required
            disabled={isEdit}
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

export default BatchFormDialog;
