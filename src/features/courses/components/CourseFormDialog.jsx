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

const emptyValues = {
  name: "",
  code: "",
  creditHours: "",
  description: "",
};

function CourseFormDialog({
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
    () => (isEdit ? "Edit Course" : "Add Course"),
    [isEdit]
  );
  const submitLabel = useMemo(
    () => (isEdit ? "Save Changes" : "Create Course"),
    [isEdit]
  );

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        code: initialValues?.code || "",
        creditHours:
          typeof initialValues?.creditHours === "number"
            ? String(initialValues.creditHours)
            : "",
        description: initialValues?.description || "",
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
      nextErrors.name = "Course name is required.";
    }
    if (!values.code.trim()) {
      nextErrors.code = "Course code is required.";
    }
    const creditHoursNumber = Number(values.creditHours);
    if (!values.creditHours.trim()) {
      nextErrors.creditHours = "Credit hours are required.";
    } else if (!Number.isFinite(creditHoursNumber)) {
      nextErrors.creditHours = "Credit hours must be a number.";
    }
    return nextErrors;
  }, [values.code, values.creditHours, values.name]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const nextErrors = validate();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      await onSubmit({
        name: values.name.trim(),
        code: values.code.trim(),
        creditHours: Number(values.creditHours),
        description: values.description.trim(),
      });
    },
    [onSubmit, validate, values.code, values.creditHours, values.description, values.name]
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
            label="Course Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Course Code"
            name="code"
            value={values.code}
            onChange={handleChange}
            error={Boolean(errors.code)}
            helperText={errors.code}
            fullWidth
            required
          />
          <TextField
            label="Credit Hours"
            name="creditHours"
            type="number"
            value={values.creditHours}
            onChange={handleChange}
            error={Boolean(errors.creditHours)}
            helperText={errors.creditHours}
            fullWidth
            required
            inputProps={{ min: 0, step: 0.5 }}
          />
          <TextField
            label="Description (optional)"
            name="description"
            value={values.description}
            onChange={handleChange}
            fullWidth
            multiline
            minRows={3}
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

export default CourseFormDialog;
