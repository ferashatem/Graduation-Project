import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { fetchDoctorOptions } from "../api/complaintsApi";

const TARGET_TYPES = ["Doctor", "Exam", "Grade", "SubjectOffering", "Other"];

const defaultForm = { title: "", message: "", targetType: "Doctor", targetId: "", doctorOption: null };

function ComplaintFormDialog({ open, onClose, onSubmit, error }) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);

  useEffect(() => {
    if (!open || form.targetType !== "Doctor") return;
    setDoctorsLoading(true);
    fetchDoctorOptions()
      .then(setDoctors)
      .catch(() => setDoctors([]))
      .finally(() => setDoctorsLoading(false));
  }, [open, form.targetType]);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || form.message.trim().length < 5) return;
    setSubmitting(true);
    await onSubmit({
      title: form.title.trim(),
      message: form.message.trim(),
      targetType: form.targetType,
      targetId: form.targetId || undefined,
    });
    setSubmitting(false);
    setForm(defaultForm);
  };

  const handleClose = () => {
    setForm(defaultForm);
    setDoctors([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Submit a Complaint</DialogTitle>
      <DialogContent className="space-y-4 !pt-4">
        {error ? <Alert severity="error">{error}</Alert> : null}

        <TextField
          label="Title"
          value={form.title}
          onChange={handleChange("title")}
          fullWidth
          required
          inputProps={{ maxLength: 200 }}
        />

        <TextField
          label="Message"
          value={form.message}
          onChange={handleChange("message")}
          fullWidth
          required
          multiline
          minRows={4}
          inputProps={{ maxLength: 2000 }}
          helperText={form.message.trim().length > 0 && form.message.trim().length < 5 ? "Message must be at least 5 characters" : ""}
          error={form.message.trim().length > 0 && form.message.trim().length < 5}
        />

        <FormControl fullWidth>
          <InputLabel>Complaint Type</InputLabel>
          <Select
            value={form.targetType}
            onChange={(e) => setForm({ ...defaultForm, targetType: e.target.value })}
            label="Complaint Type"
          >
            {TARGET_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {form.targetType === "Doctor" && (
          <Autocomplete
            options={doctors}
            loading={doctorsLoading}
            filterOptions={(x) => x}
            getOptionLabel={(d) => d.name ?? d.fullName ?? d.id ?? ""}
            isOptionEqualToValue={(opt, val) => opt.id === val.id}
            value={form.doctorOption}
            onChange={(_, newVal) =>
              setForm((prev) => ({ ...prev, doctorOption: newVal, targetId: newVal?.id ?? "" }))
            }
            noOptionsText={doctorsLoading ? "Loading…" : "No doctors found"}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Doctor"
                placeholder="Type doctor name…"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {doctorsLoading ? <CircularProgress size={18} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        )}

        {form.targetType !== "Other" && form.targetType !== "Doctor" && (
          <TextField
            label="Target ID (optional)"
            value={form.targetId}
            onChange={handleChange("targetId")}
            fullWidth
            helperText="Leave blank if you don't have the exact ID"
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !form.title.trim() || form.message.trim().length < 5}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ComplaintFormDialog;
