import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import GroupsTable from "../components/GroupsTable";
import GroupFormDialog from "../components/GroupFormDialog";
import { useGroups } from "../hooks/useGroups";
import { fetchBatchesByDepartment } from "../../batches/api/batchesApi";

function GroupsPage() {
  // batchCode = batch's public code (needed for create/update API)
  const { batchId, batchCode } = useParams();

  const { groups, loading, error, reload, addGroup, updateGroup, deleteGroup } =
    useGroups(batchId, batchCode);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: batchCode || "Batch" },
      { label: "Groups" },
    ],
    [batchCode]
  );

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
    // DELETE /api/groups/{code} — use the group's public code
    const result = await deleteGroup(target.code);
    if (!result.ok) setActionError(result.error);
  }, [confirmState.row, deleteGroup, handleCloseConfirm]);

  const handleSubmit = useCallback(async (values) => {
    setActionError("");
    const result = editing
      ? await updateGroup(editing.code, values)  // PUT /api/groups/{code}
      : await addGroup(values);
    if (result.ok) {
      setDialogOpen(false);
      setEditing(null);
    } else {
      setActionError(result.error);
    }
  }, [addGroup, editing, updateGroup]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Groups / Sections"
        breadcrumbs={breadcrumbs}
        action={<Button variant="contained" onClick={handleAdd}>Add Group</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && groups.length === 0 ? (
        <Loading label="Loading groups..." />
      ) : (
        <GroupsTable
          rows={groups}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
        />
      )}

      <GroupFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete group?"
        message="This will permanently remove the group."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default GroupsPage;
