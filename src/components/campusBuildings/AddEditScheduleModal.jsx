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
import {
  generateSlots,
  isOverlapping,
  minutesToTime,
  timeToMinutes,
} from "../../services/campusBuildings.service";

const DAY_OPTIONS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

function AddEditScheduleModal({
  open,
  initialValues,
  existingSchedules = [],
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [day, setDay] = useState("MON");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [validationError, setValidationError] = useState("");

  const timeOptions = useMemo(() => {
    const options = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      options.push(minutesToTime(minutes));
    }
    return options;
  }, []);

  useEffect(() => {
    if (!open) return;
    const initialDay = String(initialValues?.day || "MON").toUpperCase();
    setDay(initialDay || "MON");
    const initialStart = Number.isFinite(Number(initialValues?.startMin))
      ? minutesToTime(Number(initialValues.startMin))
      : "09:00";
    const initialEnd = Number.isFinite(Number(initialValues?.endMin))
      ? minutesToTime(Number(initialValues.endMin))
      : "10:00";
    setStartTime(initialStart);
    setEndTime(initialEnd);
    setCourseName(initialValues?.courseName || "");
    setCourseId(initialValues?.courseId || "");
    setValidationError("");
  }, [initialValues, open]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const dayKey = String(day || "").toUpperCase();

    if (!dayKey) {
      setValidationError("Day is required.");
      return;
    }
    if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
      setValidationError("Select a valid start and end time.");
      return;
    }
    if (startMin >= endMin) {
      setValidationError("Start time must be before end time.");
      return;
    }
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      setValidationError("Times must align with 30-minute steps.");
      return;
    }

    const overlap = existingSchedules.find((schedule) => {
      if (schedule.id === initialValues?.id) return false;
      const scheduleDay = String(schedule.day || "").toUpperCase();
      if (scheduleDay !== dayKey) return false;
      return isOverlapping(startMin, endMin, schedule.startMin, schedule.endMin);
    });

    if (overlap) {
      const conflictStart = minutesToTime(overlap.startMin);
      const conflictEnd = minutesToTime(overlap.endMin);
      setValidationError(
        `Overlaps with ${conflictStart} - ${conflictEnd} on ${dayKey}.`
      );
      return;
    }

    const slots = generateSlots(dayKey, startMin, endMin, 30);
    if (slots.length === 0) {
      setValidationError("Select a valid time range.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        day: dayKey,
        startMin,
        endMin,
        courseId: courseId.trim() || "",
        courseName: courseName.trim() || "",
        slots,
      });
    }
  }, [
    courseId,
    courseName,
    day,
    endTime,
    existingSchedules,
    initialValues?.id,
    onSubmit,
    startTime,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Schedule" : "Add Time Slot"}</DialogTitle>
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
          disabled={loading}
        >
          {DAY_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            select
            label="Start time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            fullWidth
            disabled={loading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`start-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="End time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            fullWidth
            disabled={loading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`end-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </div>

        <TextField
          label="Course name (optional)"
          value={courseName}
          onChange={(event) => setCourseName(event.target.value)}
          fullWidth
          disabled={loading}
        />

        <TextField
          label="Course ID (optional)"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
          fullWidth
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Slot"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddEditScheduleModal;
