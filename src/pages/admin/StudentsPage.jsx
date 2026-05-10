import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, Chip, InputAdornment, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchAllStudents } from "../../features/students/api/studentsApi";
import { fetchAllBatches } from "../../features/batches/api/batchesApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
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
      const [studentResponse, batches, departments] = await Promise.all([
        fetchAllStudents({ size: 100 }),
        fetchAllBatches(),
        fetchAllDepartments(),
      ]);

      const departmentMap = new Map(
        departments.map((department) => [String(department.id), department])
      );
      const batchMap = new Map(
        batches.map((batch) => [String(batch.id), batch])
      );

      const nextStudents = studentResponse.items.map((student) => {
        const batchId = student.BatchId ?? student.batchId;
        const batch = batchMap.get(String(batchId));
        const department = batch
          ? departmentMap.get(String(batch.departmentId ?? batch.DepartmentId))
          : null;

        const code = student.Code ?? student.code;
        const fullName = student.FullName ?? student.fullName ?? student.name;
        return {
          ...student,
          id: code ?? student.UniversityStudentId ?? student.universityStudentId ?? student.UniversityEmail ?? student.universityEmail,
          code,
          fullName,
          email: student.UniversityEmail || student.universityEmail || student.Email || student.email || "",
          universityId: student.UniversityStudentId || student.universityStudentId || "",
          batchName: batch?.name || "—",
          departmentName: department?.name || "—",
        };
      });

      setStudents(nextStudents);
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

    const query = search.toLowerCase();
    return students.filter((student) =>
      [
        student.fullName,
        student.email,
        student.universityId,
        student.code,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
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
        valueGetter: (params) => params.row.fullName || params.row.name || "",
      },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      {
        field: "universityId",
        headerName: "University ID",
        flex: 1,
        minWidth: 160,
      },
      { field: "batchName", headerName: "Batch", flex: 1, minWidth: 140 },
      {
        field: "departmentName",
        headerName: "Department",
        flex: 1,
        minWidth: 160,
      },
      {
        field: "isActive",
        headerName: "Status",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.isActive ? "Active" : "Inactive"}
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
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
          placeholder="Search by name, email, code, or university ID..."
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
        <Loading label="Loading students..." />
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
