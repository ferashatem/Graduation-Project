import { useCallback, useEffect, useMemo, useState } from "react";
import { Avatar, InputAdornment, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchAllDoctors } from "../../features/doctors/api/doctorsApi";
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
      const data = await fetchAllDoctors();
      setDoctors(data.map((d) => ({ ...d, id: d.id ?? d.email })));
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
    const q = search.toLowerCase();
    return doctors.filter(
      (d) =>
        d.name?.toLowerCase().includes(q) ||
        d.fullName?.toLowerCase().includes(q) ||
        d.email?.toLowerCase().includes(q)
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
        valueGetter: (value, row) => row.fullName || row.name || "",
      },
      { field: "email", headerName: "Email", flex: 1, minWidth: 200 },
      {
        field: "departmentName",
        headerName: "Department",
        flex: 1,
        minWidth: 180,
        valueGetter: (value, row) => row.departmentName || row.department?.name || "—",
      },
      {
        field: "specialization",
        headerName: "Specialization",
        flex: 1,
        minWidth: 180,
        valueGetter: (value, row) => row.specialization || "—",
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
          placeholder="Search by name or email…"
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
        <Loading label="Loading doctors…" />
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
