import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

function BuildingFormModal({
  open,
  initialValues,
  colleges = [],
  defaultCollegeId = "",
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [collegeId, setCollegeId] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name || "");
    setCode(initialValues?.code || "");
    setCollegeId(initialValues?.collegeId || defaultCollegeId || "");
    setLocalError("");
  }, [defaultCollegeId, initialValues, open]);

  const showCollegeSelect = useMemo(
    () => colleges.length > 1 || !defaultCollegeId,
    [colleges.length, defaultCollegeId]
  );

  const collegeOptions = useMemo(
    () => (Array.isArray(colleges) ? colleges : []),
    [colleges]
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setLocalError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setLocalError("Building name is required.");
      return;
    }

    const resolvedCollegeId = collegeId || defaultCollegeId;
    if (!resolvedCollegeId) {
      setLocalError("College is required.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        name: trimmedName,
        code: code.trim(),
        collegeId: resolvedCollegeId,
      });
    }
  }, [collegeId, code, defaultCollegeId, name, onSubmit]);

  const collegePlaceholder = useMemo(() => {
    if (collegeOptions.length === 0) return "No colleges found";
    return "Select a college";
  }, [collegeOptions.length]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Building" : "Add Building"}</DialogTitle>

      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {localError ? <Alert severity="error">{localError}</Alert> : null}

        {showCollegeSelect ? (
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            College
            <select
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
              value={collegeId}
              onChange={(event) => setCollegeId(event.target.value)}
              disabled={loading || isEdit}
              required
            >
              <option value="" disabled>
                {collegePlaceholder}
              </option>
              {collegeOptions.map((college) => (
                <option key={college.id} value={college.id}>
                  {college.code
                    ? `${college.name || "College"} (${college.code})`
                    : college.name || "College"}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Building name
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Engineering Building"
            required
            disabled={loading}
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          Building code
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm"
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ENG"
            disabled={loading}
          />
        </label>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Building"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BuildingFormModal;
