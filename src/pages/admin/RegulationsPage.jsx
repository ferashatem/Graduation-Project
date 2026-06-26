import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Button, Card, CardContent, Chip, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, MenuItem, TextField, Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import {
  fetchAllRegulations, createRegulation, updateRegulation, deleteRegulation,
  REGULATION_TYPE_OPTIONS,
} from "../../features/regulations/api/regulationsApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import apiClient from "../../api/apiClient";

const emptyForm = { title: "", content: "", type: 0, isActive: true, departmentId: "", subjectsJson: "" };

const ALLOWED_TYPES = ".pdf,.doc,.docx,.xls,.xlsx";

function RegulationFormDialog({ open, initialValues, onClose, onSubmit, submitting, error }) {
  const [values, setValues]   = useState(emptyForm);
  const [file, setFile]       = useState(null);
  const [errors, setErrors]   = useState({});
  const [departments, setDepartments] = useState([]);
  const fileInputRef          = useRef(null);
  const isEdit = useMemo(() => Boolean(initialValues?.code), [initialValues]);

  useEffect(() => {
    apiClient.get("/departments", { params: { page: 1, pageSize: 200 } })
      .then((r) => {
        const p = r.data?.data ?? r.data;
        setDepartments(Array.isArray(p) ? p : (p?.data ?? []));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) {
      setValues({
        title:        initialValues?.title        || "",
        content:      initialValues?.content      || "",
        type:         initialValues?.type         ?? 0,
        isActive:     initialValues?.isActive     ?? true,
        departmentId: initialValues?.departmentId || "",
        subjectsJson: initialValues?.subjectsJson || "",
      });
      setFile(null);
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validate = () => {
    const next = {};
    if (!values.title.trim()) next.title = "Title is required.";
    if (!values.content.trim() && !file) next.content = "Provide text content, attach a file, or both.";
    if (values.subjectsJson.trim()) {
      try {
        const parsed = JSON.parse(values.subjectsJson);
        if (!Array.isArray(parsed)) next.subjectsJson = 'Must be a JSON array, e.g. ["Math","Physics"]';
      } catch {
        next.subjectsJson = 'Invalid JSON — use format: ["Math","Physics"]';
      }
    }
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    await onSubmit({ ...values, file });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? "Edit Regulation" : "Add Regulation"}</DialogTitle>

        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            label="Title" name="title" value={values.title} onChange={handleChange}
            error={Boolean(errors.title)} helperText={errors.title} fullWidth required
          />

          <TextField select label="Type" name="type" value={values.type} onChange={handleChange} fullWidth>
            {REGULATION_TYPE_OPTIONS.map((t) => (
              <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
            ))}
          </TextField>

          <TextField select label="Department (optional)" name="departmentId"
            value={values.departmentId} onChange={handleChange} fullWidth>
            <MenuItem value="">— All Departments —</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Content (optional if file attached)"
            name="content" value={values.content} onChange={handleChange}
            error={Boolean(errors.content)} helperText={errors.content}
            multiline rows={4} fullWidth
          />

          <TextField
            label="Subjects (JSON, optional)"
            name="subjectsJson" value={values.subjectsJson} onChange={handleChange}
            error={Boolean(errors.subjectsJson)}
            helperText={errors.subjectsJson || 'e.g. ["Math","Physics"]'}
            multiline rows={2} fullWidth
          />

          {/* File attachment */}
          <div>
            <input
              ref={fileInputRef}
              id="reg-file-input"
              type="file"
              accept={ALLOWED_TYPES}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div className="flex items-center gap-2">
              <Button
                variant="outlined"
                size="small"
                startIcon={<AttachFileIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                {file ? "Change File" : "Attach File"}
              </Button>
              {file && (
                <span className="text-sm text-slate-600 flex items-center gap-1">
                  {file.name}
                  <button
                    type="button"
                    onClick={clearFile}
                    className="ml-1 text-red-500 hover:text-red-700 font-bold leading-none"
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </span>
              )}
              {!file && initialValues?.fileUrl && (
                <a
                  href={initialValues.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <OpenInNewIcon fontSize="inherit" /> Current file
                </a>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">PDF, Word, or Excel — max 50 MB</p>
          </div>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : "Create Regulation"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function RegulationCard({ regulation, onEdit, onDelete }) {
  const typeLabel = REGULATION_TYPE_OPTIONS.find((t) => t.value === regulation.type)?.label ?? regulation.type;
  return (
    <Card variant="outlined" className="hover:shadow-md transition-shadow">
      <CardContent>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Typography variant="subtitle1" className="font-semibold truncate">
                {regulation.title}
              </Typography>
              <Chip label={typeLabel} size="small" variant="outlined" />
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
  const { t } = useTranslation();
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
      await deleteRegulation(target.id);
      setRegulations((prev) => prev.filter((r) => r.id !== target.id));
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
        title={t("adminRegulations.title")}
        breadcrumbs={[{ label: t("adminNav.secSettings") }, { label: t("adminRegulations.title") }]}
        action={<Button variant="contained" onClick={handleAdd}>{t("adminRegulations.addRegulation")}</Button>}
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
