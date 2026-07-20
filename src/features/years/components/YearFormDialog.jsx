import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  FormControlLabel,
  Switch,
} from "@mui/material";

const emptyValues = { name: "", order: "", isActive: true };

function YearFormDialog({
  open,
  initialValues,
  existingYears = [],
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

  const suggestedOrder = useMemo(() => {
    if (existingYears.length === 0) return 1;
    const maxOrder = Math.max(...existingYears.map((y) => y.order || 0));
    return maxOrder + 1;
  }, [existingYears]);

  useEffect(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        order:
          typeof initialValues?.order === "number"
            ? String(initialValues.order)
            : String(suggestedOrder),
        isActive: initialValues?.isActive ?? true,
      });
      setErrors({});
    }
  }, [open, initialValues, suggestedOrder]);

  const handleChange = useCallback((event) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }, []);

  const validate = useCallback(() => {
    const nextErrors = {};
    if (!values.name.trim()) {
      nextErrors.name = "Year name is required.";
    }
    const orderNumber = Number(values.order);
    if (!values.order.toString().trim()) {
      nextErrors.order = "Order is required.";
    } else if (!Number.isInteger(orderNumber) || orderNumber < 1) {
      nextErrors.order = "Order must be a positive integer.";
    } else {
      const duplicate = existingYears.find(
        (y) => y.order === orderNumber && y.id !== initialValues?.id
      );
      if (duplicate) {
        nextErrors.order = `Order ${orderNumber} is already used by "${duplicate.name}". Use a different order.`;
      }
    }
    return nextErrors;
  }, [values.name, values.order, existingYears, initialValues?.id]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const nextErrors = validate();
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      await onSubmit({
        name: values.name.trim(),
        order: Number(values.order),
        isActive: values.isActive,
      });
    },
    [onSubmit, validate, values.name, values.order, values.isActive]
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
            helperText={errors.order || (!isEdit ? `Suggested: ${suggestedOrder}` : "")}
            fullWidth
            required
            inputProps={{ min: 1, step: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                name="isActive"
                checked={values.isActive}
                onChange={handleChange}
              />
            }
            label="Active"
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
