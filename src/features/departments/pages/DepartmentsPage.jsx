import { useCallback, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import DepartmentsTable from "../components/DepartmentsTable";
import DepartmentFormDialog from "../components/DepartmentFormDialog";
import { useDepartments } from "../hooks/useDepartments";

function DepartmentsPage() {
  const navigate = useNavigate();
  // collegeId = ULID (for fetching), collegeCode = code (for POST/PUT)
  const { collegeId, collegeCode } = useParams();

  const {
    departments,
    loading,
    error,
    reload,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments(collegeId, collegeCode);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");

  const rows = useMemo(() => departments, [departments]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: "Departments" },
    ],
    []
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

  const handleCloseDialog = useCallback(() => setDialogOpen(false), []);

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
    const result = await deleteDepartment(target.code);
    if (result.ok) {
      reload();
    } else {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteDepartment, handleCloseConfirm, reload]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateDepartment(editing.code, values)
        : await addDepartment(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
        reload();
      } else {
        setActionError(result.error);
      }
    },
    [addDepartment, editing, updateDepartment, reload]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={handleAdd}>
            Add Department
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && rows.length === 0 ? (
        <Loading label="Loading departments..." />
      ) : (
        <DepartmentsTable
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
        />
      )}

      <DepartmentFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete department?"
        message="This will permanently remove the department."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default DepartmentsPage;
