import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function YearRowActions({ row, onEdit, onDelete, onManage, onManageSemesters }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleManage = useCallback(() => onManage(row), [onManage, row]);
  const handleSemesters = useCallback(
    () => onManageSemesters && onManageSemesters(row),
    [onManageSemesters, row]
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button size="small" variant="outlined" onClick={handleManage}>
        Departments
      </Button>
      <Button size="small" variant="outlined" color="secondary" onClick={handleSemesters}>
        Semesters
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

function YearsTable({ rows, loading, onEdit, onDelete, onManage, onManageSemesters }) {
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Year Name", flex: 1, minWidth: 200 },
      { field: "order", headerName: "Order", width: 120 },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        minWidth: 260,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <YearRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onManage={onManage}
            onManageSemesters={onManageSemesters}
          />
        ),
      },
    ],
    [onDelete, onEdit, onManage]
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

export default YearsTable;
