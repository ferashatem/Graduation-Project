import { useCallback, useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddAltIcon from "@mui/icons-material/PersonAddAlt";
import GroupAddIcon from "@mui/icons-material/GroupAdd";

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

function CourseRowActions({
  row,
  onEdit,
  onDelete,
  onAssignProfessor,
  onAssignAssistant,
}) {
  const handleEdit = useCallback(() => onEdit(row), [onEdit, row]);
  const handleDelete = useCallback(() => onDelete(row), [onDelete, row]);
  const handleAssignProfessor = useCallback(
    () => onAssignProfessor(row),
    [onAssignProfessor, row]
  );
  const handleAssignAssistant = useCallback(
    () => onAssignAssistant(row),
    [onAssignAssistant, row]
  );

  return (
    <div className="flex items-center gap-2">
      <Tooltip title="Assign Professor">
        <IconButton size="small" onClick={handleAssignProfessor}>
          <PersonAddAltIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Assign Assistant/TA">
        <IconButton size="small" onClick={handleAssignAssistant}>
          <GroupAddIcon fontSize="inherit" />
        </IconButton>
      </Tooltip>
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
  onAssignProfessor,
  onAssignAssistant,
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
      { field: "description", headerName: "Description", flex: 1.5, minWidth: 200 },
      {
        field: "actions",
        headerName: "Actions",
        width: 180,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <CourseRowActions
            row={params.row}
            onEdit={onEdit}
            onDelete={onDelete}
            onAssignProfessor={onAssignProfessor}
            onAssignAssistant={onAssignAssistant}
          />
        ),
      },
    ],
    [onAssignAssistant, onAssignProfessor, onDelete, onEdit]
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

export default CoursesTable;
