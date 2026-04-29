import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Chip, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function SemesterRowActions({ row, onEdit, onDelete }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);

  return (
    <div className="flex items-center gap-2">
      <IconButton size="small" color="primary" onClick={handleEdit}>
        <EditIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" color="error" onClick={handleDelete}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </div>
  );
}

function SemestersTable({ rows, loading, onEdit, onDelete }) {
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
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <SemesterRowActions row={params.row} onEdit={onEdit} onDelete={onDelete} />
        ),
      },
    ],
    [onDelete, onEdit]
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
