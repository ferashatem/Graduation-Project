import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const timeToMinutes = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;
  const [hoursPart, minutesPart] = raw.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
};

function RoomSessionModal({
  open,
  initialValues,
  selectedDay,
  loading,
  error,
  onClose,
  onSubmit,
  disableDay = true,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reservedBy, setReservedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const dayOptions = useMemo(() => DAY_OPTIONS, []);

  useEffect(() => {
    if (!open) return;
    const initialDay = initialValues?.day || selectedDay || "Monday";
    setDay(initialDay);
    setStartTime(initialValues?.startTime || "09:00");
    setEndTime(initialValues?.endTime || "10:00");
    setReservedBy(initialValues?.reservedBy || "");
    setNotes(initialValues?.notes || "");
    setValidationError("");
  }, [initialValues, open, selectedDay]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    if (!day) {
      setValidationError("Day is required.");
      return;
    }
    if (!startTime || !endTime) {
      setValidationError("Start and end time are required.");
      return;
    }
    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      setValidationError("Enter valid time values.");
      return;
    }
    if (startMinutes >= endMinutes) {
      setValidationError("Start time must be before end time.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        day,
        startTime,
        endTime,
        reservedBy: reservedBy.trim(),
        notes: notes.trim(),
      });
    }
  }, [day, endTime, notes, onSubmit, reservedBy, startTime]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Session" : "Add Session"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? (
          <Alert severity="error">{validationError}</Alert>
        ) : null}

        <TextField
          select
          label="Day"
          value={day}
          onChange={(event) => setDay(event.target.value)}
          fullWidth
          disabled={loading || disableDay}
        >
          {dayOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Start time"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            fullWidth
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
          />
          <TextField
            label="End time"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            fullWidth
            disabled={loading}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
          />
        </div>

        <TextField
          label="Reserved by"
          value={reservedBy}
          onChange={(event) => setReservedBy(event.target.value)}
          fullWidth
          disabled={loading}
          placeholder="Course or professor"
        />

        <TextField
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          fullWidth
          multiline
          minRows={3}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoomSessionModal;
