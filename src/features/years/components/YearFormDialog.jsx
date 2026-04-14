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

const emptyValues = { name: "", order: "" };

function YearFormDialog({
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
  const title = useMemo(() => (isEdit ? "Edit Year" : "Add Year"), [isEdit]);
  const submitLabel = useMemo(
    () => (isEdit ? "Save Changes" : "Create Year"),
    [isEdit]
  );

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        order:
          typeof initialValues?.order === "number"
            ? String(initialValues.order)
            : "",
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
      nextErrors.name = "Year name is required.";
    }
    const orderNumber = Number(values.order);
    if (!values.order.trim()) {
      nextErrors.order = "Order is required.";
    } else if (!Number.isInteger(orderNumber)) {
      nextErrors.order = "Order must be an integer.";
    }
    return nextErrors;
  }, [values.name, values.order]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const nextErrors = validate();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      await onSubmit({
        name: values.name.trim(),
        order: Number(values.order),
      });
    },
    [onSubmit, validate, values.name, values.order]
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
            label="Year Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={Boolean(errors.name)}
            helperText={errors.name}
            fullWidth
            required
          />
          <TextField
            label="Order"
            name="order"
            type="number"
            value={values.order}
            onChange={handleChange}
            error={Boolean(errors.order)}
            helperText={errors.order}
            fullWidth
            required
            inputProps={{ min: 1, step: 1 }}
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

export default YearFormDialog;
