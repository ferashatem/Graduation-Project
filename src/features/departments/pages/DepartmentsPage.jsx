import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DeleteBlockedDialog from "../../../components/common/DeleteBlockedDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import DepartmentsTable from "../components/DepartmentsTable";
import DepartmentFormDialog from "../components/DepartmentFormDialog";
import { useDepartments } from "../hooks/useDepartments";
import { getCollegeById } from "../../colleges/api/collegesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

function DepartmentsPage() {
  const navigate = useNavigate();
  const { collegeId, collegeCode, yearId } = useParams();
  const [collegeMeta, setCollegeMeta] = useState({ name: "", code: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [blockedDialog, setBlockedDialog] = useState({ open: false, message: "" });

  const {
    departments,
    loading,
    error,
    reload,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments(collegeId, null, yearId);

  useEffect(() => {
    let active = true;

    const loadCollegeMeta = async () => {
      if (!collegeId) return;

      try {
        const college = await getCollegeById(collegeId);
        if (!active) return;

        setCollegeMeta({
          name: college?.name || "College",
          code: college?.code || "",
        });
      } catch (err) {
        if (!active) return;
        setCollegeMeta({ name: "College", code: "" });
        setActionError(getErrorMessage(err));
      }
    };

    loadCollegeMeta();
    return () => {
      active = false;
    };
  }, [collegeId]);

  const rows = useMemo(() => departments, [departments]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: collegeMeta.name || "College" },
      { label: "Departments" },
    ],
    [collegeMeta.name]
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

    const result = await deleteDepartment(target.id);
    if (result.ok) {
      reload();
    } else if (result.error?.includes("Cannot delete")) {
      setBlockedDialog({ open: true, message: result.error });
    } else {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteDepartment, handleCloseConfirm, reload]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateDepartment(editing.id, values)
        : await addDepartment(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
        reload();
      } else {
        setActionError(result.error);
      }
    },
    [addDepartment, editing, reload, updateDepartment]
  );

  const handleManageBatches = useCallback(
    (row) => {
      navigate(`/admin/departments/${row.id}/${row.code}/batches`);
    },
    [navigate]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Departments"
        breadcrumbs={breadcrumbs}
        action={
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!collegeId && !yearId}
          >
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
          onManageBatches={handleManageBatches}
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
        message="سيتم حذف القسم نهائياً مع كل دفعاته ومجموعاته والبيانات الأكاديمية. الطلاب والدكاترة لن يُحذفوا."
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

export default DepartmentsPage;
