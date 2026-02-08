import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";

function RoomFormModal({
  open,
  initialValues,
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [roomNumber, setRoomNumber] = useState("");
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [capacity, setCapacity] = useState("40");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRoomNumber(initialValues?.roomNumber || "");
    setName(initialValues?.name || "");
    setLabel(initialValues?.label || "");
    setCapacity(
      Number.isFinite(Number(initialValues?.capacity))
        ? String(initialValues.capacity)
        : "40"
    );
    setValidationError("");
  }, [initialValues, open]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");

    const trimmedRoomNumber = roomNumber.trim();
    const trimmedName = name.trim();
    const parsedCapacity = Number(capacity);

    if (!trimmedRoomNumber) {
      setValidationError("Room number is required.");
      return;
    }
    if (!trimmedName) {
      setValidationError("Room name is required.");
      return;
    }
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setValidationError("Capacity must be at least 1.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        roomNumber: trimmedRoomNumber,
        name: trimmedName,
        label: label.trim(),
        capacity: parsedCapacity,
      });
    }
  }, [capacity, label, name, onSubmit, roomNumber]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Room" : "Add Room"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? <Alert severity="error">{validationError}</Alert> : null}

        <TextField
          label="Room number"
          value={roomNumber}
          onChange={(event) => setRoomNumber(event.target.value)}
          fullWidth
          required
          disabled={loading}
        />

        <TextField
          label="Room name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          required
          disabled={loading}
        />

        <TextField
          label="Label"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          fullWidth
          disabled={loading}
        />

        <TextField
          label="Capacity"
          type="number"
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          fullWidth
          required
          inputProps={{ min: 1 }}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Room"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoomFormModal;
