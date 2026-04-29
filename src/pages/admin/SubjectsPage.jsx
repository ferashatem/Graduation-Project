import { useCallback, useMemo, useState } from "react";
import {
  Alert, Button, Chip, InputAdornment, TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { IconButton } from "@mui/material";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import {
  searchSubjects, createSubject, updateSubject, deleteSubject,
} from "../../features/subjects/api/subjectsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Subjects" }];
const emptyForm = { name: "", code: "", departmentCode: "", batchCode: "" };

function SubjectFormDialog({ open, initialValues, onClose, onSubmit, submitting, error }) {
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const isEdit = useMemo(() => Boolean(initialValues?.id), [initialValues]);

  useMemo(() => {
    if (open) {
      setValues({
        name: initialValues?.name || "",
        code: initialValues?.code || "",
        departmentCode: "",
        batchCode: "",
      });
      setErrors({});
    }
  }, [open, initialValues]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
  }, []);

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (!values.code.trim()) next.code = "Code is required.";
    if (!isEdit && !values.departmentCode.trim()) next.departmentCode = "Department code is required.";
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
        <DialogTitle>{isEdit ? "Edit Subject" : "Add Subject"}</DialogTitle>
        <DialogContent className="space-y-4 pt-2">
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField label="Subject Name" name="name" value={values.name} onChange={handleChange}
            error={Boolean(errors.name)} helperText={errors.name} fullWidth required />
          <TextField label="Subject Code (e.g. CS201)" name="code" value={values.code}
            onChange={handleChange} error={Boolean(errors.code)} helperText={errors.code}
            fullWidth required disabled={isEdit} />
          {!isEdit && (
            <>
              <TextField label="Department Code" name="departmentCode" value={values.departmentCode}
                onChange={handleChange} error={Boolean(errors.departmentCode)}
                helperText={errors.departmentCode || "Required — e.g. CS"} fullWidth required />
              <TextField label="Batch Code (optional)" name="batchCode" value={values.batchCode}
                onChange={handleChange} helperText="e.g. BATCH2024" fullWidth />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {isEdit ? "Save Changes" : "Create Subject"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActionError("");
    try {
      const data = await searchSubjects(query.trim());
      setSubjects(data.map((s) => ({ ...s, id: s.id ?? s.code })));
      setSearched(true);
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === "Enter") handleSearch();
  }, [handleSearch]);

  const handleAdd = useCallback(() => { setEditing(null); setActionError(""); setDialogOpen(true); }, []);
  const handleEdit = useCallback((row) => { setEditing(row); setActionError(""); setDialogOpen(true); }, []);
  const handleDeletePrompt = useCallback((row) => setConfirmState({ open: true, row }), []);
  const handleCloseConfirm = useCallback(() => setConfirmState({ open: false, row: null }), []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.row;
    handleCloseConfirm();
    if (!target) return;
    try {
      await deleteSubject(target.code);
      setSubjects((prev) => prev.filter((s) => s.code !== target.code));
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [confirmState.row, handleCloseConfirm]);

  const handleSubmit = useCallback(async (values) => {
    setActionError("");
    try {
      if (editing) {
        await updateSubject(editing.code, { name: values.name, code: values.code });
        setSubjects((prev) =>
          prev.map((s) => s.code === editing.code ? { ...s, name: values.name } : s)
        );
      } else {
        const created = await createSubject(values);
        setSubjects((prev) => [...prev, { ...created, id: created.id ?? created.code }]);
      }
      setDialogOpen(false);
      setEditing(null);
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [editing]);

  const columns = useMemo(() => [
    { field: "name", headerName: "Subject Name", flex: 1, minWidth: 200 },
    { field: "code", headerName: "Code", width: 140 },
    {
      field: "actions", headerName: "Actions", width: 110, sortable: false, filterable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <IconButton size="small" color="primary" onClick={() => handleEdit(params.row)}>
            <EditIcon fontSize="inherit" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeletePrompt(params.row)}>
            <DeleteIcon fontSize="inherit" />
          </IconButton>
        </div>
      ),
    },
  ], [handleEdit, handleDeletePrompt]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Subjects"
        breadcrumbs={breadcrumbs}
        action={<Button variant="contained" onClick={handleAdd}>Add Subject</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <div className="flex gap-3">
        <TextField
          size="small"
          placeholder="Search by name or code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
          sx={{ width: 360 }}
        />
        <Button variant="outlined" onClick={handleSearch} disabled={!query.trim() || loading}>
          Search
        </Button>
      </div>

      {searched && (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight
            rows={subjects}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          />
        </div>
      )}

      {!searched && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <SearchIcon sx={{ fontSize: 48, mb: 1, opacity: 0.4 }} />
          <p className="text-sm">Search for subjects by name or code to get started.</p>
        </div>
      )}

      <SubjectFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete subject?"
        message="This will permanently remove the subject."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default SubjectsPage;
