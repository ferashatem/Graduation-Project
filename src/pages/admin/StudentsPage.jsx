import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Chip,
  MenuItem,
  TextField,
  InputAdornment,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchAllStudents } from "../../features/students/api/studentsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Student Affairs" }, { label: "Students" }];

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAllStudents();
      setStudents(data.map((s) => ({ ...s, id: s.id ?? s.universityId ?? s.email })));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.universityId?.toLowerCase().includes(q)
    );
  }, [students, search]);

  const columns = useMemo(
    () => [
      {
        field: "avatar",
        headerName: "",
        width: 50,
        sortable: false,
        filterable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.name || params.row.fullName || "S")[0].toUpperCase()}
          </Avatar>
        ),
      },
      {
        field: "fullName",
        headerName: "Name",
        flex: 1,
        minWidth: 200,
        valueGetter: (value, row) => row.fullName || row.name || "",
      },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      { field: "universityId", headerName: "University ID", flex: 1, minWidth: 160 },
      {
        field: "groupName",
        headerName: "Group",
        flex: 1,
        minWidth: 140,
        valueGetter: (value, row) => row.groupName || row.group?.name || "—",
      },
      {
        field: "batchName",
        headerName: "Batch",
        flex: 1,
        minWidth: 140,
        valueGetter: (value, row) => row.batchName || row.batch?.name || "—",
      },
      {
        field: "departmentName",
        headerName: "Department",
        flex: 1,
        minWidth: 160,
        valueGetter: (value, row) => row.departmentName || row.department?.name || "—",
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Students" breadcrumbs={breadcrumbs} />

      <div className="flex gap-4">
        <TextField
          size="small"
          placeholder="Search by name, email or university ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 360 }}
        />
      </div>

      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {loading && students.length === 0 ? (
        <Loading label="Loading students…" />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight
            rows={filtered}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
            }}
          />
        </div>
      )}
    </div>
  );
}

export default StudentsPage;
