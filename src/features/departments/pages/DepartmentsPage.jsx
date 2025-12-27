import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import DepartmentsTable from "../components/DepartmentsTable";
import DepartmentFormDialog from "../components/DepartmentFormDialog";
import { useDepartments } from "../hooks/useDepartments";
import { getCollegeById } from "../../colleges/api/collegesApi";
import { getYearById } from "../../years/api/yearsApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

function DepartmentsPage() {
  const navigate = useNavigate();
  const { collegeId, yearId } = useParams();
  const {
    departments,
    loading,
    error,
    reload,
    addDepartment,
    updateDepartment,
    deleteDepartment,
  } = useDepartments(collegeId, yearId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [collegeName, setCollegeName] = useState("");
  const [yearName, setYearName] = useState("");

  const rows = useMemo(() => departments, [departments]);

  const loadBreadcrumbs = useCallback(async () => {
    if (!collegeId || !yearId) return;
    try {
      const [college, year] = await Promise.all([
        getCollegeById(collegeId),
        getYearById(collegeId, yearId),
      ]);
      setCollegeName(college?.name || "College");
      setYearName(year?.name || "Year");
    } catch (err) {
      setActionError(getErrorMessage(err));
    }
  }, [collegeId, yearId]);

  useEffect(() => {
    loadBreadcrumbs();
  }, [loadBreadcrumbs]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      {
        label: collegeName || "College",
        to: `/admin/colleges/${collegeId}/years`,
      },
      { label: yearName || "Year" },
      { label: "Departments" },
    ],
    [collegeId, collegeName, yearName]
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
    const result = await deleteDepartment(target.id);
    if (!result.ok) {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteDepartment, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateDepartment(editing.id, values)
        : await addDepartment(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
      } else {
        setActionError(result.error);
      }
    },
    [addDepartment, editing, updateDepartment]
  );

  const handleManageCourses = useCallback(
    (row) => {
      navigate(
        `/admin/colleges/${collegeId}/years/${yearId}/departments/${row.id}/courses`
      );
    },
    [collegeId, navigate, yearId]
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
          onManage={handleManageCourses}
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
        message="This will remove the department. Related courses are not deleted automatically."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default DepartmentsPage;
