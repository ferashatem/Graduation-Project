import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function ScheduleCellModal({
  open,
  slot,
  schedule,
  canManage,
  loading,
  error,
  onClose,
  onSave,
  onDelete,
}) {
  const isEdit = Boolean(schedule?.id);
  const [courseName, setCourseName] = useState("");
  const [courseId, setCourseId] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [section, setSection] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setCourseName(schedule?.courseName || "");
    setCourseId(schedule?.courseId || "");
    setInstructorName(schedule?.instructorName || "");
    setInstructorId(schedule?.instructorId || "");
    setSection(schedule?.section || "");
    setLocalError("");
  }, [open, schedule]);

  const title = useMemo(() => {
    if (!slot) return "Schedule";
    return `${slot.dayLabel} ${slot.label}`;
  }, [slot]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    if (!slot) return;
    setLocalError("");
    const trimmedCourseName = courseName.trim();
    if (!trimmedCourseName) {
      setLocalError("Course name is required.");
      return;
    }
    if (onSave) {
      onSave({
        dayKey: slot.dayKey,
        slotKey: slot.slotKey,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseId: courseId.trim(),
        courseName: trimmedCourseName,
        instructorId: instructorId.trim(),
        instructorName: instructorName.trim(),
        section: section.trim(),
      });
    }
  }, [
    courseId,
    courseName,
    instructorId,
    instructorName,
    onSave,
    section,
    slot,
  ]);

  const handleDelete = useCallback(() => {
    if (onDelete && schedule?.id) onDelete(schedule);
  }, [onDelete, schedule]);

  const readOnly = useMemo(() => !canManage, [canManage]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Course name
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Calculus I"
              disabled={loading || readOnly}
              required
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Course ID
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              placeholder="MATH101"
              disabled={loading || readOnly}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Instructor name
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={instructorName}
              onChange={(event) => setInstructorName(event.target.value)}
              placeholder="Dr. Sarah Ahmed"
              disabled={loading || readOnly}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Instructor ID
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={instructorId}
              onChange={(event) => setInstructorId(event.target.value)}
              placeholder="prof_123"
              disabled={loading || readOnly}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            Section
            <input
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              type="text"
              value={section}
              onChange={(event) => setSection(event.target.value)}
              placeholder="Section A"
              disabled={loading || readOnly}
            />
          </label>
        </div>

        {slot ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            Time slot: {slot.label}
          </div>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
        {canManage ? (
          <>
            {isEdit ? (
              <Button
                color="error"
                variant="outlined"
                onClick={handleDelete}
                disabled={loading}
              >
                Delete
              </Button>
            ) : null}
            <Button variant="contained" onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Course"}
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

export default ScheduleCellModal;

