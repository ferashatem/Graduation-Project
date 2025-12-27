import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const formatTimestamp = (value) => {
  if (!value) return "";
  if (value.toDate) {
    return value.toDate().toLocaleString("en-US");
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  return String(value);
};

function CourseRowActions({ row, onEdit, onDelete }) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);

  return (
    <div className="flex items-center gap-2">
      <IconButton size="small" onClick={handleEdit}>
        <EditIcon fontSize="inherit" />
      </IconButton>
      <IconButton size="small" color="error" onClick={handleDelete}>
        <DeleteIcon fontSize="inherit" />
      </IconButton>
    </div>
  );
}

function CoursesTable({ rows, loading, onEdit, onDelete }) {
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
      { field: "description", headerName: "Description", flex: 1.5, minWidth: 200 },
      {
        field: "actions",
        headerName: "Actions",
        width: 120,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <CourseRowActions row={params.row} onEdit={onEdit} onDelete={onDelete} />
        ),
      },
    ],
    [onDelete, onEdit]
  );

  return (
    <div className="rounded-xl bg-white shadow">
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

export default CoursesTable;
