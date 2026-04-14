import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
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
  colleges = [],
  collegesLoading = false,
  collegesError = "",
  onRequestMaterials,
  onClose,
  onSubmit,
  disableDay = true,
}) {
  const isEdit = Boolean(initialValues?.id);
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState("");

  const dayOptions = useMemo(() => DAY_OPTIONS, []);
  const collegeOptions = useMemo(() => colleges || [], [colleges]);
  const materialOptions = useMemo(() => materials || [], [materials]);

  const resolvePermissionError = useCallback((error, path) => {
    const message = error?.message || "";
    if (
      error?.code === "permission-denied" ||
      /missing or insufficient permissions/i.test(message)
    ) {
      console.error("[permissions] access denied", { path, error });
      return "Missing or insufficient permissions. Please contact an administrator.";
    }
    return "";
  }, []);

  const getCollegeLabel = useCallback((option) => {
    if (!option) return "";
    if (typeof option === "string") return option;
    return (
      option.name ||
      option.title ||
      option.label ||
      option.code ||
      option.id ||
      ""
    );
  }, []);

  const getMaterialLabel = useCallback((option) => {
    if (!option) return "";
    if (typeof option === "string") return option;
    return (
      option.title ||
      option.name ||
      option.label ||
      option.code ||
      option.id ||
      ""
    );
  }, []);

  const loadMaterials = useCallback(
    async (collegeId, presetMaterialId, presetMaterialTitle) => {
      if (!collegeId || !onRequestMaterials) {
        setMaterials([]);
        return;
      }
      setMaterialsLoading(true);
      setMaterialsError("");
      try {
        const data = await onRequestMaterials(collegeId);
        const safeData = Array.isArray(data) ? data : [];
        setMaterials(safeData);
        if (presetMaterialId) {
          const matched = safeData.find((item) => item.id === presetMaterialId);
          setSelectedMaterial(
            matched || {
              id: presetMaterialId,
              title: presetMaterialTitle || "",
            }
          );
        }
      } catch (err) {
        const permissionMessage = resolvePermissionError(
          err,
          `colleges/${collegeId}/materials`
        );
        setMaterialsError(
          permissionMessage || err?.message || "Failed to load materials."
        );
        setMaterials([]);
      } finally {
        setMaterialsLoading(false);
      }
    },
    [onRequestMaterials, resolvePermissionError]
  );

  useEffect(() => {
    if (!open) return;
    const initialDay = initialValues?.day || selectedDay || "Monday";
    setDay(initialDay);
    setStartTime(initialValues?.startTime || "09:00");
    setEndTime(initialValues?.endTime || "10:00");
    setNotes(initialValues?.notes || "");
    setValidationError("");
    setMaterialsError("");

    if (!initialValues?.collegeId) {
      setSelectedCollege(null);
      setSelectedMaterial(null);
      setMaterials([]);
    }
  }, [initialValues, open, selectedDay]);

  useEffect(() => {
    if (!open) return;
    if (!initialValues?.collegeId) return;
    const matchedCollege =
      collegeOptions.find((item) => item.id === initialValues.collegeId) || {
        id: initialValues.collegeId,
        name: initialValues.collegeName || "",
      };
    setSelectedCollege(matchedCollege);
    loadMaterials(
      initialValues.collegeId,
      initialValues.materialId,
      initialValues.materialTitle
    );
  }, [
    collegeOptions,
    initialValues?.collegeId,
    initialValues?.collegeName,
    initialValues?.materialId,
    initialValues?.materialTitle,
    loadMaterials,
    open,
  ]);

  const handleClose = useCallback(() => {
    if (loading) return;
    if (onClose) onClose();
  }, [loading, onClose]);

  const handleCollegeChange = useCallback(
    (_event, newValue) => {
      setSelectedCollege(newValue);
      setSelectedMaterial(null);
      setMaterials([]);
      setMaterialsError("");
      if (newValue?.id) {
        loadMaterials(newValue.id);
      }
    },
    [loadMaterials]
  );

  const handleMaterialChange = useCallback((_event, newValue) => {
    setSelectedMaterial(newValue);
  }, []);

  const isSaveDisabled = useMemo(() => {
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const timeValid =
      Number.isFinite(startMinutes) &&
      Number.isFinite(endMinutes) &&
      startMinutes < endMinutes;
    return (
      loading ||
      collegesLoading ||
      materialsLoading ||
      !day ||
      !timeValid ||
      !selectedCollege?.id ||
      !selectedMaterial?.id
    );
  }, [
    collegesLoading,
    day,
    endTime,
    loading,
    materialsLoading,
    selectedCollege?.id,
    selectedMaterial?.id,
    startTime,
  ]);

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
    if (!selectedCollege?.id) {
      setValidationError("College is required.");
      return;
    }
    if (!selectedMaterial?.id) {
      setValidationError("Material is required.");
      return;
    }

    if (onSubmit) {
      onSubmit({
        day,
        startTime,
        endTime,
        collegeId: selectedCollege.id,
        collegeName: getCollegeLabel(selectedCollege).trim(),
        materialId: selectedMaterial.id,
        materialTitle: getMaterialLabel(selectedMaterial).trim(),
        notes: notes.trim(),
      });
    }
  }, [
    day,
    endTime,
    getCollegeLabel,
    getMaterialLabel,
    notes,
    onSubmit,
    selectedCollege,
    selectedMaterial,
    startTime,
  ]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit Session" : "Add Session"}</DialogTitle>
      <DialogContent className="space-y-4">
        {error ? <Alert severity="error">{error}</Alert> : null}
        {collegesError ? <Alert severity="error">{collegesError}</Alert> : null}
        {materialsError ? <Alert severity="error">{materialsError}</Alert> : null}
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

        <Autocomplete
          options={collegeOptions}
          value={selectedCollege}
          onChange={handleCollegeChange}
          getOptionLabel={getCollegeLabel}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          loading={collegesLoading}
          noOptionsText="No colleges found."
          renderInput={(params) => (
            <TextField
              {...params}
              label="College"
              fullWidth
              disabled={loading || collegesLoading}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {collegesLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <Autocomplete
          options={materialOptions}
          value={selectedMaterial}
          onChange={handleMaterialChange}
          getOptionLabel={getMaterialLabel}
          isOptionEqualToValue={(option, value) => option.id === value?.id}
          loading={materialsLoading}
          noOptionsText={
            selectedCollege
              ? "No materials found for this college."
              : "Select a college first."
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Material"
              fullWidth
              disabled={loading || materialsLoading || !selectedCollege}
              placeholder={
                selectedCollege ? "Select material" : "Select a college first"
              }
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {materialsLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
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
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaveDisabled}
        >
          {loading ? "Saving..." : isEdit ? "Save Changes" : "Create Session"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RoomSessionModal;
