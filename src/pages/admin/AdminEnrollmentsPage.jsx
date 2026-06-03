import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, InputAdornment, List, ListItemButton,
  ListItemText,
} from "@mui/material";
import { HiSearch, HiUserAdd, HiTrash, HiChevronDown, HiChevronUp } from "react-icons/hi";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import apiClient from "../../api/apiClient";
import { fetchColleges } from "../../features/colleges/api/collegesApi";
import { fetchYears } from "../../features/years/api/yearsApi";
import { fetchSemestersByYear } from "../../features/semesters/api/semestersApi";
import { fetchOfferingsBySemester } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const breadcrumbs = [{ label: "Subjects & Registration" }, { label: "Enrollments" }];

// ── Step selector ─────────────────────────────────────────────────────────────
function StepSelect({ label, value, onChange, options, disabled, placeholder }) {
  return (
    <div className="flex-1 min-w-0">
      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || options.length === 0}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{options.length === 0 ? "No options" : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

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
      <DialogTitle>
        Enroll Student
        <div className="text-xs font-normal text-slate-500 mt-0.5">
          {offering?.subjectName ?? ""} — {offering?.batchName ?? ""} {offering?.departmentName ? `· ${offering.departmentName}` : ""}
        </div>
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {success && <Alert severity="success">{success}</Alert>}
        {error   && <Alert severity="error">{error}</Alert>}
        <div className="relative flex items-center">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder="Search by name, email, or student ID…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
          {searching && <CircularProgress size={16} className="absolute right-3" />}
        </div>
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

// ── Enrolled Students Dialog ──────────────────────────────────────────────────
function EnrolledStudentsDialog({ open, offering, onClose, onEnrolled }) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [busy,        setBusy]        = useState(null);
  const [search,      setSearch]      = useState("");

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

  useEffect(() => {
    if (open) { setSearch(""); load(); }
  }, [open, load]);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return enrollments;
    return enrollments.filter((e) =>
      (e.studentName ?? "").toLowerCase().includes(q) ||
      (e.studentCode ?? e.studentId ?? "").toLowerCase().includes(q)
    );
  }, [enrollments, search]);

  const activeCount   = enrollments.filter((e) => e.isActive).length;
  const inactiveCount = enrollments.length - activeCount;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, maxHeight: "85vh" } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-slate-800">
              {offering?.subjectName ?? "Offering"} — Enrolled Students
            </p>
            <p className="text-xs text-slate-400 mt-0.5 font-normal">
              {offering?.subjectCode && <span className="font-mono mr-2">{offering.subjectCode}</span>}
              {offering?.batchName && <span>{offering.batchName}</span>}
              {offering?.departmentName && <span> · {offering.departmentName}</span>}
            </p>
          </div>
          <div className="flex gap-2 shrink-0 pt-0.5">
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              {activeCount} Active
            </span>
            {inactiveCount > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-500">
                {inactiveCount} Inactive
              </span>
            )}
          </div>
        </div>
      </DialogTitle>

      <DialogContent sx={{ pt: "8px !important", px: 2 }}>
        {/* Search bar */}
        <div className="relative mb-3">
          <HiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or student ID…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center"><CircularProgress size={28} /></div>
        ) : enrollments.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No students enrolled yet.</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400">No results for "{search}".</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl ring-1 ring-slate-200 overflow-hidden">
            {filtered.map((e, idx) => (
              <div key={e.id}
                className={`flex items-center justify-between gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-sm font-bold text-blue-600">
                    {(e.studentName ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.studentName ?? "—"}</p>
                    <p className="text-xs text-slate-400 font-mono">{e.studentCode ?? e.studentId ?? "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    e.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-500"
                  }`}>
                    {e.isActive ? "Active" : "Inactive"}
                  </span>
                  {e.isActive ? (
                    <button type="button" disabled={busy === e.id}
                      onClick={() => handleRemove(e.id)}
                      title="Remove enrollment"
                      className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 disabled:opacity-40 transition">
                      {busy === e.id ? <CircularProgress size={14} /> : <HiTrash className="h-4 w-4" />}
                    </button>
                  ) : (
                    <button type="button" disabled={busy === e.id}
                      onClick={() => handleReactivate(e.id)}
                      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 disabled:opacity-40 transition">
                      {busy === e.id ? "…" : "Reactivate"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          variant="contained"
          startIcon={<HiUserAdd />}
          onClick={() => { onClose(); onEnrolled(); }}
          sx={{ borderRadius: 2, textTransform: "none", fontSize: 13 }}
        >
          Enroll New Student
        </Button>
        <Button onClick={onClose} sx={{ borderRadius: 2, textTransform: "none", fontSize: 13 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Offering Row (compact) ────────────────────────────────────────────────────
function OfferingRow({ offering }) {
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [enrollOpen,   setEnrollOpen]   = useState(false);

  return (
    <div className="rounded-xl bg-white ring-1 ring-slate-200 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">
            {offering.subjectName ?? offering.name ?? "—"}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap gap-x-2">
            {offering.subjectCode && <span className="font-mono">{offering.subjectCode}</span>}
            {offering.doctorName  && <span>Dr. {offering.doctorName}</span>}
            {offering.creditHours != null && <span>{offering.creditHours} cr</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setEnrollOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-[#0b2c4a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153a63] transition">
            <HiUserAdd className="h-3.5 w-3.5" /> Enroll
          </button>
          <button type="button" onClick={() => setStudentsOpen(true)}
            title="View enrolled students"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
            <HiSearch className="h-3.5 w-3.5" /> Students
          </button>
        </div>
      </div>

      <EnrolledStudentsDialog
        open={studentsOpen}
        offering={offering}
        onClose={() => setStudentsOpen(false)}
        onEnrolled={() => setEnrollOpen(true)}
      />

      <EnrollDialog
        open={enrollOpen}
        offering={offering}
        onClose={() => setEnrollOpen(false)}
        onDone={() => setEnrollOpen(false)}
      />
    </div>
  );
}

// ── Batch Group ───────────────────────────────────────────────────────────────
function BatchGroup({ batchName, offerings }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-slate-50 px-5 py-3 hover:bg-slate-100 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-slate-800">{batchName}</p>
            <p className="text-xs text-slate-400">{offerings.length} subject{offerings.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
        {open ? <HiChevronUp className="h-4 w-4 text-slate-400" /> : <HiChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-3 space-y-2 bg-white">
          {offerings.map((o) => <OfferingRow key={o.id} offering={o} />)}
        </div>
      )}
    </div>
  );
}

// ── Department Group ──────────────────────────────────────────────────────────
function DepartmentGroup({ deptName, batches }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-base font-bold text-slate-800">{deptName}</p>
            <p className="text-xs text-slate-400">{Object.keys(batches).length} batch{Object.keys(batches).length !== 1 ? "es" : ""}</p>
          </div>
        </div>
        {open ? <HiChevronUp className="h-5 w-5 text-slate-400" /> : <HiChevronDown className="h-5 w-5 text-slate-400" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 p-4 space-y-3">
          {Object.entries(batches).map(([batchName, offs]) => (
            <BatchGroup key={batchName} batchName={batchName} offerings={offs} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function AdminEnrollmentsPage() {
  const { t } = useTranslation();
  const breadcrumbs = [{ label: t("adminNav.secSubjects") }, { label: t("adminEnrollments.title") }];
  // Cascade state
  const [colleges,    setColleges]    = useState([]);
  const [collegeId,   setCollegeId]   = useState("");
  const [years,       setYears]       = useState([]);
  const [yearId,      setYearId]      = useState("");
  const [semesters,   setSemesters]   = useState([]);
  const [semesterId,  setSemesterId]  = useState("");

  // Offerings
  const [offerings,   setOfferings]   = useState([]);
  const [loadingOff,  setLoadingOff]  = useState(false);
  const [error,       setError]       = useState("");

  // Step 1: load colleges
  useEffect(() => {
    fetchColleges().then(setColleges).catch(() => {});
  }, []);

  // Step 2: load years when college changes
  useEffect(() => {
    setYearId(""); setYears([]);
    setSemesterId(""); setSemesters([]);
    setOfferings([]);
    if (!collegeId) return;
    fetchYears(collegeId).then(setYears).catch(() => {});
  }, [collegeId]);

  // Step 3: load semesters when year changes
  useEffect(() => {
    setSemesterId(""); setSemesters([]);
    setOfferings([]);
    if (!yearId) return;
    fetchSemestersByYear(yearId).then(setSemesters).catch(() => {});
  }, [yearId]);

  // Step 4: load offerings when semester changes
  useEffect(() => {
    setOfferings([]);
    if (!semesterId) return;
    setLoadingOff(true); setError("");
    fetchOfferingsBySemester(semesterId)
      .then(setOfferings)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoadingOff(false));
  }, [semesterId]);

  // Group offerings: { deptName → { batchName → offering[] } }
  const grouped = useMemo(() => {
    const map = {};
    for (const o of offerings) {
      const dept  = o.departmentName ?? o.department ?? "Unknown Department";
      const batch = o.batchName      ?? o.batch      ?? "Unknown Batch";
      if (!map[dept]) map[dept] = {};
      if (!map[dept][batch]) map[dept][batch] = [];
      map[dept][batch].push(o);
    }
    return map;
  }, [offerings]);

  const selectedCollege  = colleges.find((c) => String(c.id) === String(collegeId));
  const selectedYear     = years.find((y)    => String(y.id) === String(yearId));
  const selectedSemester = semesters.find((s) => String(s.id) === String(semesterId));

  return (
    <div className="space-y-5">
      <PageHeader title={t("adminEnrollments.title")} breadcrumbs={breadcrumbs} />

      {/* Cascade selectors */}
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">Select Context</h2>
        <div className="flex flex-wrap gap-4">
          <StepSelect
            label="College"
            value={collegeId}
            onChange={setCollegeId}
            options={colleges.map((c) => ({ value: c.id, label: c.name ?? c.collegeName ?? c.id }))}
            placeholder="— Select College —"
          />
          <StepSelect
            label="Academic Year"
            value={yearId}
            onChange={setYearId}
            options={years.map((y) => ({ value: y.id, label: y.name ?? y.yearName ?? y.id }))}
            disabled={!collegeId}
            placeholder="— Select Year —"
          />
          <StepSelect
            label="Semester"
            value={semesterId}
            onChange={setSemesterId}
            options={semesters.map((s) => ({ value: s.id, label: s.name ?? s.semesterName ?? s.id }))}
            disabled={!yearId}
            placeholder="— Select Semester —"
          />
        </div>

        {/* Breadcrumb trail */}
        {(selectedCollege || selectedYear || selectedSemester) && (
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {selectedCollege && (
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                🏛 {selectedCollege.name ?? selectedCollege.collegeName}
              </span>
            )}
            {selectedYear && (
              <>
                <span className="text-slate-300">›</span>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  📅 {selectedYear.name ?? selectedYear.yearName}
                </span>
              </>
            )}
            {selectedSemester && (
              <>
                <span className="text-slate-300">›</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  📚 {selectedSemester.name ?? selectedSemester.semesterName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Content */}
      {loadingOff ? (
        <Loading label="Loading offerings…" />
      ) : semesterId && offerings.length === 0 && !loadingOff ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="text-sm text-slate-400">No offerings found for this semester.</p>
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-slate-500">
              <strong className="text-slate-800">{offerings.length}</strong> offerings across{" "}
              <strong className="text-slate-800">{Object.keys(grouped).length}</strong> department{Object.keys(grouped).length !== 1 ? "s" : ""}
            </span>
          </div>
          {/* Department groups */}
          <div className="space-y-4">
            {Object.entries(grouped).map(([deptName, batches]) => (
              <DepartmentGroup key={deptName} deptName={deptName} batches={batches} />
            ))}
          </div>
        </>
      ) : !semesterId ? (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-400">Select a college, year, and semester to view enrollment data.</p>
        </div>
      ) : null}
    </div>
  );
}

export default AdminEnrollmentsPage;
