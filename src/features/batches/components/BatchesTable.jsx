import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataGrid } from "@mui/x-data-grid";
import { Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function BatchRowActions({ row, onEdit, onDelete, onManage }) {
  const { t } = useTranslation();
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleManage = useCallback(() => onManage(row), [onManage, row]);

  return (
    <div className="flex items-center gap-2">
      <Button size="small" variant="outlined" onClick={handleManage}>
        {t("batches.manageGroups")}
      </Button>
      <IconButton size="small" color="primary" onClick={handleEdit}>
        <EditIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" color="error" onClick={handleDelete}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </div>
  );
}

function BatchesTable({ rows, loading, onEdit, onDelete, onManage }) {
  const { t } = useTranslation();
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("batches.batchName"), flex: 1, minWidth: 200 },
      { field: "year", headerName: t("batches.year"), flex: 1, minWidth: 120 },
      {
        field: "actions",
        headerName: t("batches.actions"),
        flex: 1,
        minWidth: 320,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <BatchRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onManage={onManage}
          />
        ),
      },
    ],
    [onDelete, onEdit, onManage, t]
  );

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <DataGrid
        autoHeight
        rows={gridRows}
        columns={columns}
        loading={loading}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
      />
    </div>
  );
}

export default BatchesTable;
