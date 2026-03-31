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

function RoomFormModal({ open, initialValues, loading, error, onClose, onSubmit }) {
  const isEdit = Boolean(initialValues?.id);
  const [roomNumber, setRoomNumber] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRoomNumber(initialValues?.roomNumber || "");
    setValidationError("");
  }, [open, initialValues]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");
    const trimmed = roomNumber.trim();
    if (!trimmed) {
      setValidationError("Room number is required.");
      return;
    }
    if (onSubmit) onSubmit({ roomNumber: trimmed });
  }, [roomNumber, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>{isEdit ? "Edit Room" : "Add Room"}</DialogTitle>
      <DialogContent className="pt-2">
        {error ? <Alert severity="error" className="mb-3">{error}</Alert> : null}
        {validationError ? <Alert severity="error" className="mb-3">{validationError}</Alert> : null}

        <TextField
          label="Room number"
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          fullWidth
          required
          disabled={loading}
          autoFocus
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Room"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoomFormModal;
