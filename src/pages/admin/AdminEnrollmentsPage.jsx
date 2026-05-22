import { useCallback, useEffect, useState } from "react";
import {
  Alert, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, InputAdornment, List, ListItemButton,
  ListItemText, MenuItem, TextField,
} from "@mui/material";
import { HiSearch, HiUserAdd, HiTrash, HiRefresh } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import apiClient from "../../api/apiClient";
import { fetchOfferingsBySemester } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Enrollments" }];

// ── Enroll Student Dialog ─────────────────────────────────────────────────────
function EnrollDialog({ open, offering, onClose, onDone }) {
  const [query,     setQuery]     = useState("");
  const [results,   setResults]   = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [error,     setError]     = useState("");
  const [success,   setSuccess]   = useState("");

  useEffect(() => {
    if (!open) { setQuery(""); setResults([]); setSelected(null); setError(""); setSuccess(""); }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true); setError("");
      try {
        const res = await apiClient.get(`/students/search?q=${encodeURIComponent(query.trim())}&size=20`);
        const p = res.data?.data ?? res.data;
        setResults(Array.isArray(p) ? p : p?.items ?? []);
      } catch { setError("Search failed."); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  const search = useCallback(() => {}, []);

  const enroll = useCallback(async () => {
    if (!selected || !offering) return;
    setEnrolling(true); setError("");
    try {
      await apiClient.post(`/enrollments/${offering.id}/admin-enroll`, { studentId: selected.id });
      setSuccess(`${selected.fullName ?? selected.name} enrolled!`);
      setSelected(null); setResults([]);
      onDone();
    } catch (err) {
      setError(err?.response?.data?.message ?? err?.message ?? "Enrollment failed.");
    } finally { setEnrolling(false); }
  }, [selected, offering, onDone]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Enroll Student — {offering?.subjectName ?? ""}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {success && <Alert severity="success">{success}</Alert>}
        {error   && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Search by name, email, or student ID"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
          onKeyDown={(e) => e.key === "Enter" && search()}
          fullWidth size="small"
          autoComplete="off"
          inputProps={{ autoComplete: "off" }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button size="small" onClick={search} disabled={searching}>
                  {searching ? <CircularProgress size={16} /> : <HiSearch />}
                </Button>
              </InputAdornment>
            ),
          }}
        />
        {results.length > 0 && (
          <List dense sx={{ maxHeight: 220, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 2 }}>
            {results.map((s) => (
              <ListItemButton key={s.id} selected={selected?.id === s.id} onClick={() => setSelected(s)}>
                <ListItemText
                  primary={s.fullName ?? s.name}
                  secondary={`${s.universityStudentId ?? s.code ?? ""} · ${s.email ?? ""}`}
                />
                {selected?.id === s.id && <Chip label="Selected" size="small" color="primary" />}
              </ListItemButton>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={!selected || enrolling} onClick={enroll}>
          {enrolling ? "Enrolling…" : "Enroll"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Enrolled Students Panel ───────────────────────────────────────────────────
function EnrolledStudentsPanel({ offering, refreshKey }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busy,        setBusy]        = useState(null);

  const load = useCallback(() => {
    if (!offering?.id) return;
    setLoading(true);
    apiClient.get(`/enrollments/by-offering/${offering.id}`)
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setEnrollments(Array.isArray(p) ? p : p?.items ?? []);
      })
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, [offering?.id]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const handleRemove = async (id) => {
    if (!window.confirm("Remove this enrollment?")) return;
    setBusy(id);
    try { await apiClient.delete(`/enrollments/${id}`); load(); }
    catch { /* silently fail */ }
    finally { setBusy(null); }
  };

  const handleReactivate = async (id) => {
    setBusy(id);
    try { await apiClient.put(`/enrollments/${id}/reactivate`); load(); }
    catch { /* silently fail */ }
    finally { setBusy(null); }
  };

  if (loading) return <div className="py-4 text-center text-xs text-slate-400">Loading…</div>;
  if (enrollments.length === 0) return (
    <div className="py-4 text-center text-xs text-slate-400">No students enrolled yet.</div>
  );

  return (
    <div className="divide-y divide-slate-100">
      {enrollments.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 py-2.5 px-4">
          <div>
            <p className="text-sm font-medium text-slate-800">{e.studentName ?? "—"}</p>
            <p className="text-xs text-slate-400">{e.studentCode ?? e.studentId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              e.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-500"
            }`}>
              {e.isActive ? "Active" : "Inactive"}
            </span>
            {e.isActive ? (
              <button type="button" disabled={busy === e.id}
                onClick={() => handleRemove(e.id)}
                className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40">
                {busy === e.id ? <CircularProgress size={14} /> : <HiTrash className="h-4 w-4" />}
              </button>
            ) : (
              <button type="button" disabled={busy === e.id}
                onClick={() => handleReactivate(e.id)}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40">
                {busy === e.id ? "…" : "Reactivate"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Offering Card ─────────────────────────────────────────────────────────────
function OfferingCard({ offering }) {
  const [expanded,   setExpanded]   = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <article className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-800">{offering.subjectName ?? offering.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {[offering.doctorName, offering.semesterName, offering.batchName].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => { setExpanded((o) => !o); }}
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {expanded ? "Hide" : "Students"}
          </button>
          <button type="button" onClick={() => setEnrollOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153a63]">
            <HiUserAdd className="h-3.5 w-3.5" /> Enroll
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Enrolled Students</p>
            <button type="button" onClick={() => setRefreshKey((k) => k + 1)}
              className="text-slate-400 hover:text-slate-600">
              <HiRefresh className="h-4 w-4" />
            </button>
          </div>
          <EnrolledStudentsPanel offering={offering} refreshKey={refreshKey} />
        </div>
      )}

      <EnrollDialog
        open={enrollOpen}
        offering={offering}
        onClose={() => setEnrollOpen(false)}
        onDone={() => { setRefreshKey((k) => k + 1); setEnrollOpen(false); }}
      />
    </article>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function AdminEnrollmentsPage() {
  const [semesters,    setSemesters]    = useState([]);
  const [semesterId,   setSemesterId]   = useState("");
  const [offerings,    setOfferings]    = useState([]);
  const [loadingOff,   setLoadingOff]   = useState(false);
  const [error,        setError]        = useState("");

  useEffect(() => {
    apiClient.get("/semesters")
      .then((res) => {
        const p = res.data?.data ?? res.data;
        setSemesters(Array.isArray(p) ? p : p?.items ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!semesterId) { setOfferings([]); return; }
    setLoadingOff(true); setError("");
    fetchOfferingsBySemester(semesterId)
      .then(setOfferings)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingOff(false));
  }, [semesterId]);

  return (
    <div className="space-y-5">
      <PageHeader title="Enrollment Management" breadcrumbs={breadcrumbs} />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <TextField
          select label="Select Semester" value={semesterId}
          onChange={(e) => setSemesterId(e.target.value)}
          size="small" sx={{ minWidth: 300 }}
        >
          <MenuItem value="">— Choose a semester —</MenuItem>
          {semesters.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name ?? s.semesterName ?? s.id}</MenuItem>
          ))}
        </TextField>
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {loadingOff ? (
        <Loading label="Loading offerings…" />
      ) : offerings.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offerings.map((o) => <OfferingCard key={o.id} offering={o} />)}
        </div>
      ) : semesterId ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400 ring-1 ring-slate-200">
          No offerings found for this semester.
        </div>
      ) : null}
    </div>
  );
}

export default AdminEnrollmentsPage;
