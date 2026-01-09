import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function RoomFormModal({
  open,
  initialValues,
  buildingName,
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");
  const [floor, setFloor] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name || "");
    setCapacity(
      initialValues?.capacity === null || initialValues?.capacity === undefined
        ? ""
        : String(initialValues.capacity)
    );
    setFloor(initialValues?.floor || "");
    setLocalError("");
  }, [initialValues, open]);

  const subtitle = useMemo(() => {
    if (!buildingName) return null;
    return `Building: ${buildingName}`;
  }, [buildingName]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setLocalError("");
    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("Room name is required.");
      return;
    }
    const parsedCapacity =
      capacity === "" ? null : Number.parseInt(capacity, 10);
    if (capacity !== "" && Number.isNaN(parsedCapacity)) {
      setLocalError("Capacity must be a number.");
      return;
    }
    if (onSubmit)
      onSubmit({
        name: trimmedName,
        capacity: parsedCapacity,
        floor: floor.trim(),
      });
  }, [capacity, floor, name, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Room" : "Add Room"}</DialogTitle>
      <DialogContent className="space-y-4">
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        {error ? <Alert severity="error">{error}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Room name / number
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Room 210"
            required
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Capacity
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="number"
            value={capacity}
            onChange={(event) => setCapacity(event.target.value)}
            placeholder="40"
            min="0"
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Floor
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={floor}
            onChange={(event) => setFloor(event.target.value)}
            placeholder="2nd floor"
            disabled={loading}
          />
        </label>
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

