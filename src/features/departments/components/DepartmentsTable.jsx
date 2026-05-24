
import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function DepartmentRowActions({ row, onEdit, onDelete, onManageBatches }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleBatches = useCallback(
    () => onManageBatches && onManageBatches(row),
    [onManageBatches, row]
  );

  return (
    <div className="flex items-center gap-2">
      {onManageBatches && (
        <Button size="small" variant="outlined" onClick={handleBatches}>
          Batches
        </Button>
      )}
      <IconButton size="small" color="primary" onClick={handleEdit}>
        <EditIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" color="error" onClick={handleDelete}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </div>
  );
}

function DepartmentsTable({ rows, loading, onEdit, onDelete, onManageBatches }) {
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Department Name", flex: 1, minWidth: 200 },
      { field: "code", headerName: "Code", flex: 1, minWidth: 140 },
      {
        field: "actions",
        headerName: "Actions",
        minWidth: 220,
        flex: 1,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <DepartmentRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onManageBatches={onManageBatches}
          />
        ),
      },
    ],
    [onDelete, onEdit, onManageBatches]
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

export default DepartmentsTable;
