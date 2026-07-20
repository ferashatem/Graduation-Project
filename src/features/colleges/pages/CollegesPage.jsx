
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../components/common/PageHeader";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import DeleteBlockedDialog from "../../../components/common/DeleteBlockedDialog";
import Loading from "../../../components/common/Loading";
import ErrorState from "../../../components/common/ErrorState";
import CollegesTable from "../components/CollegesTable";
import CollegeFormDialog from "../components/CollegeFormDialog";
import { useColleges } from "../hooks/useColleges";

function CollegesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { colleges, loading, error, reload, addCollege, updateCollege, deleteCollege } =
    useColleges();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, row: null });
  const [actionError, setActionError] = useState("");
  const [blockedDialog, setBlockedDialog] = useState({ open: false, message: "" });

  const rows = useMemo(() => colleges, [colleges]);
  const breadcrumbs = useMemo(() => [{ label: t("colleges.title") }], [t]);

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
    if (result.ok) {
      reload();
    } else if (result.error?.includes("Cannot delete")) {
      setBlockedDialog({ open: true, message: result.error });
    } else {
      setActionError(result.error);
    }
  }, [confirmState.row, deleteCollege, handleCloseConfirm, reload]);

  const handleSubmit = useCallback(
    async (values) => {
      setActionError("");
      const result = editing
        ? await updateCollege(editing.id, values)
        : await addCollege(values);

      if (result.ok) {
        setDialogOpen(false);
        setEditing(null);
        reload();
      } else {
        setActionError(result.error);
      }
    },
    [addCollege, editing, updateCollege, reload]
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
        title={t("colleges.title")}
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={handleAdd}>
            {t("colleges.addCollege")}
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {error && !loading ? <ErrorState message={error} onRetry={reload} /> : null}
      {loading && rows.length === 0 ? (
        <Loading label={t("colleges.loading")} />
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
        title={t("colleges.deleteTitle")}
        message={t("colleges.deleteMessage")}
        confirmLabel={t("common.delete")}
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

export default CollegesPage;
