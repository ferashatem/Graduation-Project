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
  }, [initialValues, open]);

  const normalizedExistingCodes = useMemo(() => {
    return existingBuildings
      .filter((building) => building?.id !== initialValues?.id)
      .map((building) => String(building?.code || "").trim().toLowerCase())
      .filter(Boolean);
  }, [existingBuildings, initialValues?.id]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleSave = useCallback(() => {
    setValidationError("");

    const trimmedName = name.trim();
    const trimmedCode = code.trim();

    if (!trimmedName) {
      setValidationError("Building name is required.");
      return;
    }
    if (!trimmedCode) {
      setValidationError("Building code is required.");
      return;
    }

    const normalizedCode = trimmedCode.toLowerCase();
    if (normalizedExistingCodes.includes(normalizedCode)) {
      setValidationError("Building code must be unique.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        name: trimmedName,
        code: trimmedCode,
      });
    }
  }, [code, name, normalizedExistingCodes, onSubmit]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Building" : "Add Building"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {validationError ? <Alert severity="error">{validationError}</Alert> : null}

        <TextField
          label="Building name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          required
          disabled={loading}
        />

        <TextField
          label="Building code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
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
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Building"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BuildingFormModal;
