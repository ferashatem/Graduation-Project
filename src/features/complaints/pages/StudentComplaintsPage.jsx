import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, MenuItem, Select, FormControl, InputLabel, TextField } from "@mui/material";
import PageHeader from "../../../components/common/PageHeader";
import ErrorState from "../../../components/common/ErrorState";
import ComplaintFormDialog from "../components/ComplaintFormDialog";
import { ComplaintCardList } from "../components/ComplaintCard";
import ComplaintsPagination from "../components/ComplaintsPagination";
import { useStudentComplaints } from "../hooks/useComplaints";

const PAGE_SIZE = 20;
const STATUSES = ["", "Pending", "UnderReview", "Resolved", "Dismissed"];
const STATUS_LABELS = { "": "All Statuses", Pending: "Pending", UnderReview: "Under Review", Resolved: "Resolved", Dismissed: "Dismissed" };
const TARGET_TYPES = ["", "Doctor", "Subject", "Administration", "Technical"];

function StudentComplaintsPage() {
  const { complaints, totalCount, loading, error, reload, submitComplaint, setQuery } = useStudentComplaints();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]   = useState("");
  const [fromDate, setFromDate]       = useState("");
  const [toDate, setToDate]           = useState("");
  const pollRef = useRef(null);

  const breadcrumbs = useMemo(() => [{ label: "My Complaints" }], []);

  // Build and apply filter query
  const applyQuery = useCallback((p, status, type, from, to) => {
    setQuery({
      page: p,
      pageSize: PAGE_SIZE,
      status: status || undefined,
      targetType: type || undefined,
      from: from || undefined,
      to: to || undefined,
    });
  }, [setQuery]);

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
    applyQuery(1, e.target.value, typeFilter, fromDate, toDate);
  };

  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
    applyQuery(1, statusFilter, e.target.value, fromDate, toDate);
  };

  const handleFromChange = (e) => {
    setFromDate(e.target.value);
    setPage(1);
    applyQuery(1, statusFilter, typeFilter, e.target.value, toDate);
  };

  const handleToChange = (e) => {
    setToDate(e.target.value);
    setPage(1);
    applyQuery(1, statusFilter, typeFilter, fromDate, e.target.value);
  };

  const handlePageChange = (p) => {
    setPage(p);
    applyQuery(p, statusFilter, typeFilter, fromDate, toDate);
  };

  const clearFilters = () => {
    setStatusFilter(""); setTypeFilter(""); setFromDate(""); setToDate(""); setPage(1);
    applyQuery(1, "", "", "", "");
  };

  const hasFilters = statusFilter || typeFilter || fromDate || toDate;

  // Poll every 5s while any complaint is awaiting AI analysis
  useEffect(() => {
    const hasPending = complaints.some((c) => !c.analysis && c.status === "Pending");
    if (!hasPending) { clearInterval(pollRef.current); pollRef.current = null; return; }
    if (pollRef.current) return;
    pollRef.current = setInterval(() => reload(), 5000);
    return () => { clearInterval(pollRef.current); pollRef.current = null; };
  }, [complaints, reload]);

  const handleSubmit = useCallback(async (dto) => {
    setSubmitError("");
    const result = await submitComplaint(dto);
    if (result.ok) {
      setDialogOpen(false);
      setSuccessMsg("Complaint submitted. Our AI is analyzing it — analysis will appear automatically.");
      setTimeout(() => setSuccessMsg(""), 8000);
    } else {
      setSubmitError(result.error);
    }
  }, [submitComplaint]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="My Complaints"
        breadcrumbs={breadcrumbs}
        action={
          <Button variant="contained" onClick={() => { setSubmitError(""); setDialogOpen(true); }}>
            + New Complaint
          </Button>
        }
      />

      {successMsg && <Alert severity="success" onClose={() => setSuccessMsg("")}>{successMsg}</Alert>}
      {error && !loading && <ErrorState message={error} onRetry={reload} />}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={handleStatusChange}>
            {STATUSES.map((s) => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Category</InputLabel>
          <Select value={typeFilter} label="Category" onChange={handleTypeChange}>
            {TARGET_TYPES.map((t) => <MenuItem key={t} value={t}>{t || "All Categories"}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField
          size="small"
          type="date"
          label="From"
          value={fromDate}
          onChange={handleFromChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={toDate}
          onChange={handleToChange}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
        />

        {hasFilters && (
          <Button size="small" onClick={clearFilters} sx={{ textTransform: "none" }}>
            Clear filters
          </Button>
        )}
      </div>

      {totalCount > 0 && (
        <p className="text-xs text-slate-400">{totalCount} complaint{totalCount !== 1 ? "s" : ""}</p>
      )}

      <ComplaintCardList
        complaints={complaints}
        loading={loading}
        showStudent={false}
        onRefresh={reload}
        emptyText="You haven't submitted any complaints yet."
      />

      <ComplaintsPagination
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={handlePageChange}
      />

      <ComplaintFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        error={submitError}
      />
    </div>
  );
}

export default StudentComplaintsPage;
