import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function CollegeRowActions({ row, onEdit, onDelete, onManage, onManageDepartments }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleManage = useCallback(() => onManage(row), [onManage, row]);
  const handleManageDepartments = useCallback(() => onManageDepartments(row), [onManageDepartments, row]);

  return (
    <div className="flex items-center gap-2">
      <Button size="small" variant="outlined" onClick={handleManageDepartments}>
        Departments
      </Button>
      <Button size="small" variant="outlined" onClick={handleManage}>
        Manage Years
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

function CollegesTable({ rows, loading, onEdit, onDelete, onManage, onManageDepartments }) {
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "College Name", flex: 1, minWidth: 200 },
      { field: "code", headerName: "Code", flex: 1, minWidth: 140 },
      {
        field: "actions",
        headerName: "Actions",
        flex: 1,
        minWidth: 360,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <CollegeRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onManage={onManage}
            onManageDepartments={onManageDepartments}
          />
        ),
      },
    ],
    [onDelete, onEdit, onManage, onManageDepartments]
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

export default CollegesTable;
