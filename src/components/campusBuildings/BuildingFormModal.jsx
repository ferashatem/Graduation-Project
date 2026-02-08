import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
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
  const [position3D, setPosition3D] = useState({ x: 0, y: 0, z: 0 });
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initialValues?.name || "");
    setCode(initialValues?.code || "");
    const initialPosition = initialValues?.position3d || {};
    setPosition3D({
      x: Number.isFinite(Number(initialPosition.x))
        ? Number(initialPosition.x)
        : 0,
      y: Number.isFinite(Number(initialPosition.y))
        ? Number(initialPosition.y)
        : 0,
      z: Number.isFinite(Number(initialPosition.z))
        ? Number(initialPosition.z)
        : 0,
    });
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

    const x = Number(position3D.x);
    const y = Number(position3D.y);
    const z = Number(position3D.z);

    if (![x, y, z].every((value) => Number.isFinite(value))) {
      setValidationError("Position coordinates must be valid numbers.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        name: trimmedName,
        code: trimmedCode,
        position3d: { x, y, z },
      });
    }
  }, [code, name, normalizedExistingCodes, onSubmit, position3D]);

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

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="X"
              type="number"
              value={position3D.x}
              onChange={(event) =>
                setPosition3D((prev) => ({
                  ...prev,
                  x: event.target.value === "" ? 0 : Number(event.target.value),
                }))
              }
              fullWidth
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Y"
              type="number"
              value={position3D.y}
              onChange={(event) =>
                setPosition3D((prev) => ({
                  ...prev,
                  y: event.target.value === "" ? 0 : Number(event.target.value),
                }))
              }
              fullWidth
              disabled={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Z"
              type="number"
              value={position3D.z}
              onChange={(event) =>
                setPosition3D((prev) => ({
                  ...prev,
                  z: event.target.value === "" ? 0 : Number(event.target.value),
                }))
              }
              fullWidth
              disabled={loading}
            />
          </Grid>
        </Grid>
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
