import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, InputAdornment, MenuItem, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { filterDoctors } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Staff Affairs" }, { label: "Doctors" }];
const PAGE_SIZE = 25;

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowCount, setRowCount] = useState(0);

  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");

  const debounceRef = useRef(null);

  useEffect(() => {
    fetchAllDepartments().then(setDepartments).catch(() => {});
  }, []);

  const load = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const result = await filterDoctors(params);
      // DoctorDetailDto includes departmentName + collegeName
      setDoctors(result.items.map((d) => ({
        ...d,
        id: d.id ?? d.code,
        fullName: d.fullName ?? d.name ?? "",
        email: d.universityEmail ?? d.email ?? "",
        universityStaffId: d.universityStaffId ?? "—",
        departmentName: d.departmentName ?? "—",
        collegeName: d.collegeName ?? "—",
      })));
      setRowCount(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load({ departmentId: departmentId || undefined, search, page: page + 1, size: PAGE_SIZE });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, departmentId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load({ departmentId: departmentId || undefined, search, page: 1, size: PAGE_SIZE });
    }, 300);
    return () => clearTimeout(debounceRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const columns = useMemo(
    () => [
      {
        field: "avatar", headerName: "", width: 50,
        sortable: false, filterable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.fullName || "D")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: "Name", flex: 1, minWidth: 200 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      { field: "universityStaffId", headerName: "Staff ID", flex: 1, minWidth: 160 },
      { field: "departmentName", headerName: "Department", flex: 1, minWidth: 180 },
      { field: "collegeName", headerName: "College", flex: 1, minWidth: 160 },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Doctors / Professors" breadcrumbs={breadcrumbs} />

      <div className="flex flex-wrap gap-3">
        <TextField
          size="small"
          placeholder="Search by name, email, code, or staff ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ width: 320 }}
        />
        <TextField
          select size="small" label="Department" value={departmentId}
          onChange={(e) => { setDepartmentId(e.target.value); setPage(0); }}
          sx={{ width: 200 }}
        >
          <MenuItem value="">All departments</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </TextField>
      </div>

      {error && !loading ? <ErrorState message={error} onRetry={() => load({ departmentId, search, page: page + 1, size: PAGE_SIZE })} /> : null}
      {loading && doctors.length === 0 ? (
        <Loading label="Loading doctors..." />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight
            rows={doctors}
            columns={columns}
            loading={loading}
            rowCount={rowCount}
            paginationMode="server"
            paginationModel={{ page, pageSize: PAGE_SIZE }}
            onPaginationModelChange={(m) => setPage(m.page)}
            pageSizeOptions={[PAGE_SIZE]}
            disableRowSelectionOnClick
          />
        </div>
      )}
    </div>
  );
}

export default DoctorsPage;
