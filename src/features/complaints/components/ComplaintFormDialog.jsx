import { useState } from "react";
import {
  Alert,
  Button,
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

const TARGET_TYPES = ["Doctor", "Exam", "Grade", "SubjectOffering", "Other"];

const defaultForm = { title: "", message: "", targetType: "Doctor", targetId: "" };

function ComplaintFormDialog({ open, onClose, onSubmit, error }) {
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) return;
    setSubmitting(true);
    await onSubmit({
      title: form.title.trim(),
      message: form.message.trim(),
      targetType: form.targetType,
      targetId: form.targetId.trim() || undefined,
    });
    setSubmitting(false);
    setForm(defaultForm);
  };

  const handleClose = () => {
    setForm(defaultForm);
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
        />

        <FormControl fullWidth>
          <InputLabel>Complaint Type</InputLabel>
          <Select value={form.targetType} onChange={handleChange("targetType")} label="Complaint Type">
            {TARGET_TYPES.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {form.targetType !== "Other" && (
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
          disabled={submitting || !form.title.trim() || !form.message.trim()}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ComplaintFormDialog;
