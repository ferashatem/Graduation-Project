import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Avatar, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, InputAdornment, MenuItem, Switch, Tab, Tabs, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import SearchIcon from "@mui/icons-material/Search";
import LockResetIcon from "@mui/icons-material/LockReset";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import DownloadIcon from "@mui/icons-material/Download";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { filterStudents, fetchStrugglingStudents } from "../../features/students/api/studentsApi";
import { fetchAllDepartments } from "../../features/departments/api/departmentsApi";
import { fetchBatchesByDepartment } from "../../features/batches/api/batchesApi";
import { fetchColleges } from "../../features/colleges/api/collegesApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { adminResetPassword } from "../../api/authApi";

const exportToXlsx = (rows, filename) => {
  const ws = XLSX.utils.json_to_sheet(
    rows.map((s, i) => ({
      "#": i + 1,
      "الاسم": s.fullName || "",
      "الرقم الجامعي": s.universityId || s.universityStudentId || "",
      "الإيميل الجامعي": s.email || s.universityEmail || "",
      "الكلية": s.collegeName || "",
      "القسم": s.departmentName || "",
      "الدفعة": s.batchName || "",
      "المجموعة": s.groupName || "",
      "الحالة": s.isActive ? "نشط" : "غير نشط",
    }))
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");
  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  saveAs(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename
  );
};

const breadcrumbs = [{ label: "Student Affairs" }, { label: "Students" }];
const PAGE_SIZE = 25;

function StudentsPage() {
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Struggling tab state
  const [struggling, setStruggling] = useState([]);
  const [strugglingLoading, setStrugglingLoading] = useState(false);
  const [strugglingError, setStrugglingError] = useState("");
  const [strugglingPage, setStrugglingPage] = useState(0);
  const [strugglingTotal, setStrugglingTotal] = useState(0);

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
  const [colleges, setColleges] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [groups, setGroups] = useState([]);
  const [collegeId, setCollegeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const result = await filterStudents({
        collegeId: collegeId || undefined,
        departmentId: departmentId || undefined,
        batchId: batchId || undefined,
        groupId: groupId || undefined,
        isActive: activeOnly ? true : undefined,
        search,
        page: 1,
        size: 500,
      });
      const rows = result.items.map((s) => ({
        ...s,
        fullName: s.fullName ?? s.name ?? "",
        email: s.universityEmail ?? s.email ?? "",
        universityId: s.universityStudentId ?? s.universityId ?? "",
        batchName: s.batchName ?? "—",
        departmentName: s.departmentName ?? "—",
        groupName: s.groupName ?? "—",
      }));
      const date = new Date().toISOString().slice(0, 10);
      const label = departmentId
        ? (departments.find((d) => d.id === departmentId)?.name ?? "filtered")
        : "all";
      exportToXlsx(rows, `students_${label}_${date}.xlsx`);
    } catch {
      // silently fail
    } finally {
      setExporting(false);
    }
  }, [collegeId, departmentId, batchId, groupId, activeOnly, search, departments]);

  const debounceRef = useRef(null);

  // Load colleges and departments once
  useEffect(() => {
    fetchColleges().then((data) => setColleges(Array.isArray(data) ? data : [])).catch(() => {});
    fetchAllDepartments().then(setDepartments).catch(() => {});
  }, []);

  const handleDeptChange = useCallback(async (id) => {
    setDepartmentId(id);
    setBatchId("");
    setBatches([]);
    setGroupId("");
    setGroups([]);
    setPage(0);
    if (!id) return;
    const dept = departments.find((d) => d.id === id);
    if (dept?.id) {
      fetchBatchesByDepartment(dept.id).then(setBatches).catch(() => {});
    }
  }, [departments]);

  const handleBatchChange = useCallback(async (id) => {
    setBatchId(id);
    setGroupId("");
    setGroups([]);
    setPage(0);
    if (!id) return;
    fetchGroupsByBatch(id).then((data) => setGroups(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const loadStruggling = useCallback(async (pg = 0) => {
    setStrugglingLoading(true);
    setStrugglingError("");
    try {
      const result = await fetchStrugglingStudents({ page: pg + 1, size: PAGE_SIZE });
      setStruggling(result.items.map((s) => ({ ...s, id: s.id ?? s.code })));
      setStrugglingTotal(result.total);
    } catch (err) {
      setStrugglingError(getErrorMessage(err));
    } finally {
      setStrugglingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 1) loadStruggling(strugglingPage);
  }, [tab, strugglingPage, loadStruggling]);

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

  const buildParams = useCallback((pg = page) => ({
    collegeId: collegeId || undefined,
    departmentId: departmentId || undefined,
    batchId: batchId || undefined,
    groupId: groupId || undefined,
    isActive: activeOnly ? true : undefined,
    search,
    page: pg + 1,
    size: PAGE_SIZE,
  }), [collegeId, departmentId, batchId, groupId, activeOnly, search, page]);

  // Reload whenever page / filters change immediately (not search — that's debounced)
  useEffect(() => {
    load(buildParams());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, collegeId, departmentId, batchId, groupId, activeOnly]);

  // Debounce search input — 300 ms
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(0);
      load({ ...buildParams(0) });
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

  const strugglingColumns = useMemo(
    () => [
      {
        field: "avatar", headerName: "", width: 50, sortable: false,
        renderCell: (params) => (
          <Avatar sx={{ width: 30, height: 30, fontSize: 13 }}>
            {(params.row.fullName || "S")[0].toUpperCase()}
          </Avatar>
        ),
      },
      { field: "fullName", headerName: "Name", flex: 1, minWidth: 200 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
      { field: "universityStudentId", headerName: "University ID", flex: 1, minWidth: 160 },
      { field: "departmentName", headerName: "Department", flex: 1, minWidth: 160 },
      { field: "batchName", headerName: "Batch", flex: 1, minWidth: 140 },
      {
        field: "averageGradePoints", headerName: "Avg GPA", width: 110,
        renderCell: (params) => (
          <Chip
            size="small"
            icon={<WarningAmberIcon fontSize="small" />}
            label={(params.row.averageGradePoints ?? 0).toFixed(2)}
            color="warning"
          />
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-5">
      <PageHeader title="Students" breadcrumbs={breadcrumbs} />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tab label="All Students" />
        <Tab label="Struggling Students" icon={<WarningAmberIcon fontSize="small" />} iconPosition="start" />
      </Tabs>

      {tab === 0 && (
        <div className="flex flex-wrap items-center gap-3">
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
            sx={{ width: 300 }}
          />
          <TextField
            select size="small" label="College" value={collegeId}
            onChange={(e) => { setCollegeId(e.target.value); setPage(0); }} sx={{ width: 180 }}
          >
            <MenuItem value="">All colleges</MenuItem>
            {colleges.map((c) => (
              <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select size="small" label="Department" value={departmentId}
            onChange={(e) => handleDeptChange(e.target.value)} sx={{ width: 180 }}
          >
            <MenuItem value="">All departments</MenuItem>
            {departments.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
            ))}
          </TextField>
          {batches.length > 0 && (
            <TextField
              select size="small" label="Batch" value={batchId}
              onChange={(e) => handleBatchChange(e.target.value)}
              sx={{ width: 160 }}
            >
              <MenuItem value="">All batches</MenuItem>
              {batches.map((b) => (
                <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
              ))}
            </TextField>
          )}
          {groups.length > 0 && (
            <TextField
              select size="small" label="Group" value={groupId}
              onChange={(e) => { setGroupId(e.target.value); setPage(0); }}
              sx={{ width: 130 }}
            >
              <MenuItem value="">All groups</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
              ))}
            </TextField>
          )}
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={activeOnly}
                onChange={(e) => { setActiveOnly(e.target.checked); setPage(0); }}
              />
            }
            label="Active only"
            sx={{ ml: 0 }}
          />
          <div className="ml-auto">
            <Button
              variant="outlined"
              size="small"
              startIcon={exporting ? <CircularProgress size={14} color="inherit" /> : <DownloadIcon />}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? "Exporting…" : `Export Excel${rowCount ? ` (${rowCount})` : ""}`}
            </Button>
          </div>
        </div>
      )}

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

      {tab === 0 && (
        <>
          {error && !loading ? <ErrorState message={error} onRetry={() => load(buildParams())} /> : null}
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
        </>
      )}

      {tab === 1 && (
        <>
          <p className="text-sm text-slate-500">
            Students with average GPA below <strong>2.0</strong> based on finalized grades.
          </p>
          {strugglingError ? <ErrorState message={strugglingError} onRetry={() => loadStruggling(strugglingPage)} /> : null}
          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
            <DataGrid
              autoHeight
              rows={struggling}
              columns={strugglingColumns}
              loading={strugglingLoading}
              rowCount={strugglingTotal}
              paginationMode="server"
              paginationModel={{ page: strugglingPage, pageSize: PAGE_SIZE }}
              onPaginationModelChange={(m) => setStrugglingPage(m.page)}
              pageSizeOptions={[PAGE_SIZE]}
              disableRowSelectionOnClick
            />
          </div>
        </>
      )}
    </div>
  );
}

export default StudentsPage;
