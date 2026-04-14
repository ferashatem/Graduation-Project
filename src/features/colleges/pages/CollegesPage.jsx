import { useCallback, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import CollegesTable from "../components/CollegesTable";
import CollegeFormDialog from "../components/CollegeFormDialog";
import { useColleges } from "../hooks/useColleges";

function CollegesPage() {
  const navigate = useNavigate();
  const { colleges, loading, error, reload, addCollege, updateCollege, deleteCollege } =
    useColleges();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");

  const rows = useMemo(() => colleges, [colleges]);
  const breadcrumbs = useMemo(() => [{ label: "Colleges" }], []);

  const handleAdd = useCallback(() => {
    setEditing(null);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((row) => {
    setEditing(row);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleDeletePrompt = useCallback((row) => {
    setConfirmState({ open: true, row });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, row: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.row;
    handleCloseConfirm();
    if (!target) return;
    const result = await deleteCollege(target.id);
    if (!result.ok) {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteCollege, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateCollege(editing.id, values)
        : await addCollege(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
      } else {
        setActionError(result.error);
      }
    },
    [addCollege, editing, updateCollege]
  );

  const handleManageYears = useCallback(
    (row) => {
      navigate(`/admin/colleges/${row.id}/years`);
    },
    [navigate]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Colleges"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={handleAdd}>
            Add College
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && rows.length === 0 ? (
        <Loading label="Loading colleges..." />
      ) : (
        <CollegesTable
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onManage={handleManageYears}
        />
      )}

      <CollegeFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete college?"
        message="This will remove the college. Related years and departments are not deleted automatically."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default CollegesPage;
