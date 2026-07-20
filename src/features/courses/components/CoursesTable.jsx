import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Button, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const formatTimestamp = (value) => {
  if (!value) return "";
  if (value.toDate) {
    return value.toDate().toLocaleString("en-US");
  }
  if (value instanceof Date) {
    return value.toLocaleString("en-US");
  }
  return String(value);
};

function CourseRowActions({ row, onEdit, onDelete, onAssignStaff }) {
  const handleEdit = useCallback(
    (event) => {
      event.stopPropagation();
      onEdit(row);
    },
    [onEdit, row],
  );
  const handleDelete = useCallback(
    (event) => {
      event.stopPropagation();
      onDelete(row);
    },
    [onDelete, row],
  );
  const handleAssignStaff = useCallback(
    (event) => {
      event.stopPropagation();
      onAssignStaff(row);
    },
    [onAssignStaff, row],
  );

  return (
    <div className="flex items-center gap-2">
      <Button size="small" variant="text" onClick={handleAssignStaff}>
        Assign Staff
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

function CoursesTable({
  rows,
  loading,
  onEdit,
  onDelete,
  onAssignStaff,
  onRowClick,
}) {
  const gridRows = useMemo(() => rows || [], [rows]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Course Name", flex: 1, minWidth: 180 },
      { field: "code", headerName: "Code", width: 130 },
      { field: "creditHours", headerName: "Credit Hours", width: 140 },
      {
        field: "createdAt",
        headerName: "Created",
        flex: 1,
        minWidth: 180,
        valueFormatter: ({ value }) => formatTimestamp(value),
      },
      {
        field: "description",
        headerName: "Description",
        flex: 1.5,
        minWidth: 200,
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 220,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <CourseRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onAssignStaff={onAssignStaff}
          />
        ),
      },
    ],
    [onAssignStaff, onDelete, onEdit],
  );

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <DataGrid
        autoHeight
        rows={gridRows}
        columns={columns}
        loading={loading}
        onRowClick={onRowClick}
        disableRowSelectionOnClick
        pageSizeOptions={[5, 10, 25]}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
      />
    </div>
  );
}

export default CoursesTable;
