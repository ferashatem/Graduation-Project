import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import YearsTable from "../components/YearsTable";
import YearFormDialog from "../components/YearFormDialog";
import { useYears } from "../hooks/useYears";
import { getCollegeById } from "../../colleges/api/collegesApi";
import { getErrorMessage } from "../../../utils/errorHelpers";

function YearsPage() {
  const navigate = useNavigate();
  const { collegeId } = useParams();
  const { years, loading, error, reload, addYear, updateYear, deleteYear } =
    useYears(collegeId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [collegeName, setCollegeName] = useState("");

  const rows = useMemo(
    () => [...years].sort((a, b) => (a.order || 0) - (b.order || 0)),
    [years]
  );

  const loadCollegeName = useCallback(async () => {
    if (!collegeId) return;
    try {
      const college = await getCollegeById(collegeId);
      setCollegeName(college?.name || "College");
    } catch (err) {
      setCollegeName("College");
      setActionError(getErrorMessage(err));
    }
  }, [collegeId]);

  useEffect(() => {
    loadCollegeName();
  }, [loadCollegeName]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: collegeName || "College" },
      { label: "Years" },
    ],
    [collegeName]
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
    const result = await deleteYear(target.id);
    if (!result.ok) {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteYear, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateYear(editing.id, values)
        : await addYear(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
      } else {
        setActionError(result.error);
      }
    },
    [addYear, editing, updateYear]
  );

  const handleManageDepartments = useCallback(
    (row) => {
      navigate(`/admin/colleges/${collegeId}/years/${row.id}/departments`);
    },
    [collegeId, navigate]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Years"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={handleAdd}>
            Add Year
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && rows.length === 0 ? (
        <Loading label="Loading years..." />
      ) : (
        <YearsTable
          rows={rows}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
          onManage={handleManageDepartments}
        />
      )}

      <YearFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete year?"
        message="This will remove the year. Related departments and courses are not deleted automatically."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default YearsPage;
