import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Chip, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ListAltIcon from "@mui/icons-material/ListAlt";

function SemesterRowActions({ row, onEdit, onDelete, onManageOfferings }) {
  const { t } = useTranslation();
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleOfferings = useCallback(() => onManageOfferings(row), [onManageOfferings, row]);

  return (
    <div className="flex items-center gap-1">
      <Button size="small" variant="outlined" startIcon={<ListAltIcon fontSize="inherit" />}
        onClick={handleOfferings} sx={{ fontSize: 11 }}>
        {t("semesters.offerings")}
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

function SemestersTable({ rows, loading, onEdit, onDelete, onManageOfferings }) {
  const { t } = useTranslation();
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: t("semesters.semesterName"), flex: 1, minWidth: 200 },
      { field: "type", headerName: t("semesters.type"), flex: 1, minWidth: 140 },
      { field: "startDate", headerName: t("semesters.startDate"), flex: 1, minWidth: 140 },
      { field: "endDate", headerName: t("semesters.endDate"), flex: 1, minWidth: 140 },
      {
        field: "isActive",
        headerName: t("semesters.status"),
        width: 110,
        renderCell: (params) =>
          params.value ? (
            <Chip label={t("common.active")} color="success" size="small" />
          ) : (
            <Chip label={t("semesters.closed")} size="small" />
          ),
      },
      {
        field: "actions",
        headerName: t("semesters.actions"),
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <SemesterRowActions row={params.row} onEdit={onEdit} onDelete={onDelete}
            onManageOfferings={onManageOfferings} />
        ),
      },
    ],
    [onDelete, onEdit, onManageOfferings, t]
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

export default SemestersTable;
