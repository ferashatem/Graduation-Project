import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Alert } from "@mui/material";
import { useParams } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import SemestersTable from "../components/SemestersTable";
import SemesterFormDialog from "../components/SemesterFormDialog";
import { useSemesters } from "../hooks/useSemesters";
import { getYearById } from "../../years/api/yearsApi";

function SemestersPage() {
  const { yearId } = useParams();
  const { semesters, loading, error, reload, addSemester, updateSemester, deleteSemester } =
    useSemesters(yearId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [yearName, setYearName] = useState("");

  useEffect(() => {
    if (!yearId) return;
    getYearById(yearId)
      .then((y) => setYearName(y?.name || "Academic Year"))
      .catch(() => setYearName("Academic Year"));
  }, [yearId]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Colleges", to: "/admin/colleges" },
      { label: yearName || "Academic Year" },
      { label: "Semesters" },
    ],
    [yearName]
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
    const result = await deleteSemester(target.id);
    if (!result.ok) setActionError(result.error);
  }, [confirmState.row, deleteSemester, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateSemester(editing.id, values)
        : await addSemester(values);
      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
      } else {
        setActionError(result.error);
      }
    },
    [addSemester, editing, updateSemester]
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Semesters"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={handleAdd}>
            Add Semester
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && semesters.length === 0 ? (
        <Loading label="Loading semesters..." />
      ) : (
        <SemestersTable
          rows={semesters}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDeletePrompt}
        />
      )}

      <SemesterFormDialog
        open={dialogOpen}
        initialValues={editing}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={actionError}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete semester?"
        message="This will permanently remove the semester and may affect subject offerings."
        confirmLabel="Delete"
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirm}
      />
    </div>
  );
}

export default SemestersPage;
