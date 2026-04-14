import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

function FloorFormModal({
  open,
  initialValues,
  existingFloors = [],
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [floorNumber, setFloorNumber] = useState("");
  const [label, setLabel] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;
    setFloorNumber(
      Number.isFinite(Number(initialValues?.floorNumber))
        ? String(initialValues.floorNumber)
        : ""
    );
    setLabel(initialValues?.label || "");
    setValidationError("");
  }, [initialValues, open]);

  const existingNumbers = useMemo(() => {
    return existingFloors
      .filter((floor) => floor?.id !== initialValues?.id)
      .map((floor) => Number(floor?.floorNumber))
      .filter((value) => Number.isFinite(value));
  }, [existingFloors, initialValues?.id]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");

    const parsedFloor = Number(floorNumber);
    if (!Number.isFinite(parsedFloor) || parsedFloor < 1) {
      setValidationError("Floor number must be a positive number.");
      return;
    }

    if (existingNumbers.includes(parsedFloor)) {
      setValidationError("Floor number must be unique in this building.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        floorNumber: parsedFloor,
        label: label.trim(),
      });
    }
  }, [existingNumbers, floorNumber, label, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Floor" : "Add Floor"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? <Alert severity="error">{validationError}</Alert> : null}

        <TextField
          label="Floor number"
          type="number"
          value={floorNumber}
          onChange={(event) => setFloorNumber(event.target.value)}
          fullWidth
          required
          inputProps={{ min: 1 }}
          disabled={loading}
        />

        <TextField
          label="Label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          fullWidth
          placeholder="First floor"
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Floor"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default FloorFormModal;
