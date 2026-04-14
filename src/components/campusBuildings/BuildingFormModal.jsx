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

function BuildingFormModal({
  open,
  initialValues,
  existingBuildings = [],
  loading,
  error,
  onClose,
  onSubmit,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name || "");
    setCode(initialValues?.code || "");
    setValidationError("");
  }, [open, initialValues]);

  const existingCodes = useMemo(
    () =>
      existingBuildings
        .filter((b) => b.id !== initialValues?.id)
        .map((b) => String(b.code || "").trim().toLowerCase()),
    [existingBuildings, initialValues?.id]
  );

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");
    const trimName = name.trim();
    const trimCode = code.trim();
    if (!trimName) {
      setValidationError("Building name is required.");
      return;
    }
    if (!trimCode) {
      setValidationError("Building code is required.");
      return;
    }
    if (existingCodes.includes(trimCode.toLowerCase())) {
      setValidationError("Building code must be unique.");
      return;
    }
    if (onSubmit) onSubmit({ name: trimName, code: trimCode });
  }, [name, code, existingCodes, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Building" : "Add Building"}</DialogTitle>
      <DialogContent className="space-y-4 pt-2">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? <Alert severity="error">{validationError}</Alert> : null}

        <TextField
          label="Building name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          disabled={loading}
          autoFocus
        />
        <TextField
          label="Building code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          required
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Building"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BuildingFormModal;
