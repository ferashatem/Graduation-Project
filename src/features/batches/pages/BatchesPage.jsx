import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DeleteBlockedDialog from "../../../components/common/DeleteBlockedDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import BatchesTable from "../components/BatchesTable";
import BatchFormDialog from "../components/BatchFormDialog";
import { useBatches } from "../hooks/useBatches";
import { getDepartmentById } from "../../departments/api/departmentsApi";

function BatchesPage() {
  const navigate = useNavigate();
  const { deptId, deptCode } = useParams();

  const { batches, loading, error, reload, addBatch, updateBatch, deleteBatch } =
    useBatches(deptId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [blockedDialog, setBlockedDialog] = useState({ open: false, message: "" });
  const [deptName, setDeptName] = useState("");

  useEffect(() => {
    if (!deptId) return;
    getDepartmentById(deptId)
      .then((d) => setDeptName(d?.name || "Department"))
      .catch(() => setDeptName("Department"));
  }, [deptId]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: deptName || "Department" },
      { label: "Batches" },
    ],
    [deptName]
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
    const result = await deleteBatch(target.id);
    if (result.ok) {
      reload();
    } else if (result.error?.includes("Cannot delete")) {
      setBlockedDialog({ open: true, message: result.error });
    } else {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteBatch, handleCloseConfirm, reload]);

  const handleSubmit = useCallback(async (values) => {
    setActionError("");
    const result = editing
      ? await updateBatch(editing.id, values)
      : await addBatch(values);
    if (result.ok) {
      setDialogOpen(false);
      setEditing(null);
    } else {
      setActionError(result.error);
    }
  }, [addBatch, editing, updateBatch]);

  // Navigate to groups: include batchId (ULID) and batchCode
  const handleManageGroups = useCallback(
    (row) => navigate(`/admin/batches/${row.id}/${row.code}/groups`),
    [navigate]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Batches"
        breadcrumbs={breadcrumbs}
        action={<Button variant="contained" onClick={handleAdd}>Add Batch</Button>}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && batches.length === 0 ? (
        <Loading label="Loading batches..." />
      ) : (
        <BatchesTable
          rows={batches}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onManage={handleManageGroups}
        />
      )}

      <BatchFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete batch?"
        message="سيتم حذف الدفعة نهائياً مع كل مجموعاتها والمواد والامتحانات والدرجات. الطلاب لن يُحذفوا."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />

      <DeleteBlockedDialog
        open={blockedDialog.open}
        message={blockedDialog.message}
        onClose={() => setBlockedDialog({ open: false, message: "" })}
      />
    </div>
  );
}

export default BatchesPage;
