import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";

const emptyValues = { name: "", code: "" };

function DepartmentFormDialog({
  open,
  initialValues,
  onClose,
  onSubmit,
  submitting,
  error,
}) {
  const [values, setValues] = useState(emptyValues);
  const [errors, setErrors] = useState({});

  const isEdit = useMemo(
    () => Boolean(initialValues && initialValues.id),
    [initialValues]
  );
  const title = useMemo(
    () => (isEdit ? "Edit Department" : "Add Department"),
    [isEdit]
  );
  const submitLabel = useMemo(
    () => (isEdit ? "Save Changes" : "Create Department"),
    [isEdit]
  );

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        code: initialValues?.code || "",
      });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback(() => {
    const nextErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = "Department name is required.";
    }
    return nextErrors;
  }, [values.name]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const nextErrors = validate();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      await onSubmit({
        name: values.name.trim(),
        code: values.code.trim(),
      });
    },
    [onSubmit, validate, values.code, values.name]
  );

  const handleClose = useCallback(() => {
    if (onClose) onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent className="space-y-4">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Department Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Department Code (optional)"
            name="code"
            value={values.code}
            onChange={handleChange}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default DepartmentFormDialog;
