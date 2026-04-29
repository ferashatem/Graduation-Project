import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, TextField, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchAllRegulations, createRegulation, updateRegulation, deleteRegulation,
} from "../../features/regulations/api/regulationsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Settings & Reports" }, { label: "Regulations" }];

const TYPES = ["Academic", "Conduct", "Exam", "General"];

const emptyForm = { title: "", content: "", type: "Academic", isActive: true };

function RegulationFormDialog({ open, initialValues, onClose, onSubmit, submitting, error }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isEdit = useMemo(() => Boolean(initialValues?.code), [initialValues]);

  useEffect(() => {
    if (open) {
      setValues({
        title: initialValues?.title || "",
        content: initialValues?.content || "",
        type: initialValues?.type || "Academic",
        isActive: initialValues?.isActive ?? true,
      });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const next = {};
    if (!values.title.trim()) next.title = "Title is required.";
    if (!values.content.trim()) next.content = "Content is required (or upload a file).";
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? "Edit Regulation" : "Add Regulation"}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Title" name="title" value={values.title} onChange={handleChange}
            error={Boolean(errors.title)} helperText={errors.title} fullWidth required />
          <TextField select label="Type" name="type" value={values.type} onChange={handleChange} fullWidth>
            {TYPES.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
          </TextField>
          <TextField label="Content" name="content" value={values.content} onChange={handleChange}
            error={Boolean(errors.content)} helperText={errors.content}
            multiline rows={5} fullWidth required />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? "Save Changes" : "Create Regulation"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function RegulationCard({ regulation, onEdit, onDelete }) {
  return (
    <Card variant="outlined" className="hover:shadow-md transition-shadow">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Typography variant="subtitle1" className="font-semibold truncate">
                {regulation.title}
              </Typography>
              <Chip label={regulation.type} size="small" variant="outlined" />
              {regulation.isActive
                ? <Chip label="Active" size="small" color="success" />
                : <Chip label="Inactive" size="small" />}
            </div>
            {regulation.content && (
              <Typography variant="body2" color="text.secondary"
                className="line-clamp-2 whitespace-pre-line">
                {regulation.content}
              </Typography>
            )}
            {regulation.fileUrl && (
              <a href={regulation.fileUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 text-sm mt-1 hover:underline">
                <OpenInNewIcon fontSize="inherit" /> View attached file
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <IconButton size="small" color="primary" onClick={() => onEdit(regulation)}>
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => onDelete(regulation)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RegulationsPage() {
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllRegulations();
      setRegulations(data.map((r) => ({ ...r, id: r.id ?? r.code })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = useCallback(() => { setEditing(null); setActionError(""); setDialogOpen(true); }, []);
  const handleEdit = useCallback((row) => { setEditing(row); setActionError(""); setDialogOpen(true); }, []);
  const handleDeletePrompt = useCallback((row) => setConfirmState({ open: true, row }), []);
  const handleCloseConfirm = useCallback(() => setConfirmState({ open: false, row: null }), []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.row;
    handleCloseConfirm();
    if (!target) return;
    try {
      await deleteRegulation(target.code);
      setRegulations((prev) => prev.filter((r) => r.code !== target.code));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [confirmState.row, handleCloseConfirm]);

  const handleSubmit = useCallback(async (values) => {
    setActionError("");
    setSubmitting(true);
    try {
      if (editing) {
        await updateRegulation(editing.code, values);
        setRegulations((prev) =>
          prev.map((r) => r.code === editing.code ? { ...r, ...values } : r)
        );
      } else {
        const created = await createRegulation(values);
        setRegulations((prev) => [{ ...created, id: created.id ?? created.code }, ...prev]);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }, [editing]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Regulations"
        breadcrumbs={breadcrumbs}
        action={<Button variant="contained" onClick={handleAdd}>Add Regulation</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {loading ? (
        <Loading label="Loading regulations..." />
      ) : (
        <div className="space-y-3">
          {regulations.length === 0 && (
            <p className="text-center py-12 text-slate-400">No regulations yet. Add one to get started.</p>
          )}
          {regulations.map((r) => (
            <RegulationCard key={r.id} regulation={r} onEdit={handleEdit} onDelete={handleDeletePrompt} />
          ))}
        </div>
      )}

      <RegulationFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete regulation?"
        message="This will permanently remove the regulation."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default RegulationsPage;
