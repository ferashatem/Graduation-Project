import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, Chip, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ListAltIcon from "@mui/icons-material/ListAlt";

function SemesterRowActions({ row, onEdit, onDelete, onManageOfferings }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleOfferings = useCallback(() => onManageOfferings(row), [onManageOfferings, row]);

  return (
    <div className="flex items-center gap-1">
      <Button size="small" variant="outlined" startIcon={<ListAltIcon fontSize="inherit" />}
        onClick={handleOfferings} sx={{ fontSize: 11 }}>
        Offerings
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
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Semester Name", flex: 1, minWidth: 200 },
      { field: "type", headerName: "Type", flex: 1, minWidth: 140 },
      { field: "startDate", headerName: "Start Date", flex: 1, minWidth: 140 },
      { field: "endDate", headerName: "End Date", flex: 1, minWidth: 140 },
      {
        field: "isActive",
        headerName: "Status",
        width: 110,
        renderCell: (params) =>
          params.value ? (
            <Chip label="Active" color="success" size="small" />
          ) : (
            <Chip label="Closed" size="small" />
          ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <SemesterRowActions row={params.row} onEdit={onEdit} onDelete={onDelete}
            onManageOfferings={onManageOfferings} />
        ),
      },
    ],
    [onDelete, onEdit, onManageOfferings]
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
