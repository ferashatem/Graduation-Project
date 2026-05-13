import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Avatar, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import LockResetIcon from "@mui/icons-material/LockReset";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { filterStudents } from "../../features/students/api/studentsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { adminResetPassword } from "../../api/authApi";

const breadcrumbs = [{ label: "Student Affairs" }, { label: "Students" }];
const PAGE_SIZE = 25;

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reset password dialog state
  const [resetTarget, setResetTarget] = useState(null); // { id, name }
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetResult, setResetResult] = useState(""); // new password from server

  const handleResetPassword = useCallback(async () => {
    if (!resetTarget) return;
    setResetLoading(true);
    setResetError("");
    try {
      const res = await adminResetPassword(resetTarget.id);
      const newPassword = res?.temporaryPassword ?? res?.newPassword ?? "";
      setResetResult(newPassword);
    } catch (err) {
      setResetError(getErrorMessage(err));
    } finally {
      setResetLoading(false);
    }
  }, [resetTarget]);

  const closeResetDialog = useCallback(() => {
    setResetTarget(null);
    setResetError("");
    setResetResult("");
  }, []);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0); // DataGrid is 0-based
  const [rowCount, setRowCount] = useState(0);

  // Filter state
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");

  const debounceRef = useRef(null);

  // Load departments once
  useEffect(() => {
    fetchAllDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleDeptChange = useCallback(async (id) => {
    setDepartmentId(id);
    setBatchId("");
    setBatches([]);
    setPage(0);
    if (!id) return;
    const dept = departments.find((d) => d.id === id);
    if (dept?.id) {
      fetchBatchesByDepartment(dept.id).then(setBatches).catch(() => {});
    }
  }, [departments]);

  const load = useCallback(async (params) => {
    setLoading(true);
    setError("");
    try {
      const result = await filterStudents(params);
      // StudentDetailDto already includes batchName, departmentName, collegeName, groupName
      setStudents(result.items.map((s) => ({
        ...s,
        id: s.id ?? s.code,
        systemUserId: s.userId ?? s.systemUserId ?? s.id ?? s.code,
        fullName: s.fullName ?? s.FullName ?? s.name ?? "",
        email: s.universityEmail ?? s.email ?? "",
        universityId: s.universityStudentId ?? s.universityId ?? "",
        batchName: s.batchName ?? "—",
        departmentName: s.departmentName ?? "—",
        groupName: s.groupName ?? "—",
      })));
      setRowCount(result.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever page / dept / batch changes immediately
  useEffect(() => {
    load({ departmentId: departmentId || undefined, batchId: batchId || undefined, search, page: page + 1, size: PAGE_SIZE });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, departmentId, batchId]);

  // Debounce search input — 300 ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load({ departmentId: departmentId || undefined, batchId: batchId || undefined, search, page: 1, size: PAGE_SIZE });
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
            {(params.row.fullName || "S")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: "Name", flex: 1, minWidth: 200 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      { field: "universityId", headerName: "University ID", flex: 1, minWidth: 160 },
      { field: "batchName", headerName: "Batch", flex: 1, minWidth: 140 },
      { field: "departmentName", headerName: "Department", flex: 1, minWidth: 160 },
      { field: "groupName", headerName: "Group", width: 100 },
      {
        field: "isActive", headerName: "Status", width: 120, sortable: false,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.row.isActive ? "Active" : "Inactive"}
            color={params.row.isActive ? "success" : "default"}
            variant={params.row.isActive ? "filled" : "outlined"}
          />
        ),
      },
      {
        field: "actions", headerName: "", width: 160, sortable: false, filterable: false,
        renderCell: (params) => (
          <Button
            size="small"
            variant="outlined"
            color="warning"
            startIcon={<LockResetIcon fontSize="small" />}
            onClick={() => setResetTarget({ id: params.row.systemUserId, name: params.row.fullName })}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Reset Password
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Students" breadcrumbs={breadcrumbs} />

      <div className="flex flex-wrap gap-3">
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
          sx={{ width: 340 }}
        />
        <TextField
          select size="small" label="Department" value={departmentId}
          onChange={(e) => handleDeptChange(e.target.value)} sx={{ width: 200 }}
        >
          <MenuItem value="">All departments</MenuItem>
          {departments.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
          ))}
        </TextField>
        {batches.length > 0 && (
          <TextField
            select size="small" label="Batch" value={batchId}
            onChange={(e) => { setBatchId(e.target.value); setPage(0); }}
            sx={{ width: 180 }}
          >
            <MenuItem value="">All batches</MenuItem>
            {batches.map((b) => (
              <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
            ))}
          </TextField>
        )}
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={Boolean(resetTarget)} onClose={resetResult ? closeResetDialog : undefined} maxWidth="xs" fullWidth>
        <DialogTitle>Reset Password</DialogTitle>
        <DialogContent>
          {resetResult ? (
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-700">
                Password for <strong>{resetTarget?.name}</strong> has been reset successfully.
              </p>
              <p className="text-xs text-slate-500">Copy this temporary password and share it with the student:</p>
              <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 font-mono text-base font-semibold text-slate-900 ring-1 ring-slate-200">
                {resetResult}
                <button
                  onClick={() => navigator.clipboard.writeText(resetResult)}
                  className="ml-auto text-xs text-[#1d5fa3] hover:underline"
                >
                  Copy
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 py-2">
              <p className="text-sm text-slate-700">
                Are you sure you want to reset the password for <strong>{resetTarget?.name}</strong>?
                A new temporary password will be generated.
              </p>
              {resetError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{resetError}</p>
              ) : null}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {resetResult ? (
            <Button onClick={closeResetDialog}>Close</Button>
          ) : (
            <>
              <Button onClick={closeResetDialog} disabled={resetLoading}>Cancel</Button>
              <Button onClick={handleResetPassword} disabled={resetLoading} color="warning" variant="contained">
                {resetLoading ? "Resetting…" : "Reset Password"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {error && !loading ? <ErrorState message={error} onRetry={() => load({ departmentId, batchId, search, page: page + 1, size: PAGE_SIZE })} /> : null}
      {loading && students.length === 0 ? (
        <Loading label="Loading students..." />
      ) : (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
          <DataGrid
            autoHeight
            rows={students}
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

export default StudentsPage;
