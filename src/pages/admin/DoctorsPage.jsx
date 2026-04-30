import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, InputAdornment, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchAllDoctors } from "../../features/doctors/api/doctorsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Staff Affairs" }, { label: "Doctors" }];

function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [doctorResponse, departments] = await Promise.all([
        fetchAllDoctors({ size: 100 }),
        fetchAllDepartments(),
      ]);

      const departmentMap = new Map(
        departments.map((department) => [String(department.id), department])
      );

      const nextDoctors = doctorResponse.items.map((doctor) => ({
        ...doctor,
        id:
          doctor.id ??
          doctor.code ??
          doctor.universityEmail ??
          doctor.email,
        email: doctor.universityEmail || doctor.email || "",
        departmentName:
          departmentMap.get(String(doctor.departmentId))?.name || "—",
      }));

      setDoctors(nextDoctors);
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
    if (!search.trim()) return doctors;

    const query = search.toLowerCase();
    return doctors.filter((doctor) =>
      [
        doctor.name,
        doctor.fullName,
        doctor.email,
        doctor.universityStaffId,
        doctor.code,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [doctors, search]);

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
            {(params.row.name || params.row.fullName || "D")[0].toUpperCase()}
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
        field: "universityStaffId",
        headerName: "Staff ID",
        flex: 1,
        minWidth: 160,
        valueGetter: (params) => params.row.universityStaffId || "—",
      },
      {
        field: "departmentName",
        headerName: "Department",
        flex: 1,
        minWidth: 180,
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Doctors / Professors" breadcrumbs={breadcrumbs} />

      <div className="flex gap-4">
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
      </div>

      {error && !loading ? <ErrorState message={error} onRetry={load} /> : null}
      {loading && doctors.length === 0 ? (
        <Loading label="Loading doctors..." />
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

export default DoctorsPage;
