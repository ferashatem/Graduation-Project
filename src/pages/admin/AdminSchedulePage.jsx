import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import { fetchAllBatches } from "../../features/batches/api/batchesApi";
import { fetchAllYears } from "../../features/years/api/yearsApi";
import { fetchSemestersByYear } from "../../features/semesters/api/semestersApi";
import { fetchOfferingsBySemester } from "../../features/subjectOfferings/api/subjectOfferingsApi";
import {
  fetchBatchSchedule,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
} from "../../api/scheduleApi";
import { fetchGroupsByBatch } from "../../features/groups/api/groupsApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const DAYS = [
  { label: "Sunday", short: "Sun", number: 0 },
  { label: "Monday", short: "Mon", number: 1 },
  { label: "Tuesday", short: "Tue", number: 2 },
  { label: "Wednesday", short: "Wed", number: 3 },
  { label: "Thursday", short: "Thu", number: 4 },
  { label: "Friday", short: "Fri", number: 5 },
  { label: "Saturday", short: "Sat", number: 6 },
];

const TYPES = [
  { label: "Lecture", value: 0 },
  { label: "Section", value: 1 },
  { label: "Lab", value: 2 },
];

const WEEK_TYPES = [
  { label: "All Weeks", value: 0 },
  { label: "Week A (Odd)", value: 1 },
  { label: "Week B (Even)", value: 2 },
];

const TYPE_BADGE = {
  Lecture: "bg-blue-100 text-blue-800",
  Section: "bg-green-100 text-green-800",
  Lab: "bg-orange-100 text-orange-800",
};

const EMPTY_FORM = {
  subjectOfferingId: "",
  groupId: "",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:30",
  type: 0,
  location: "",
  weekType: 0,
};

function SlotCard({ entry, onEdit, onDelete }) {
  const badge = TYPE_BADGE[entry.type] || "bg-slate-100 text-slate-700";
  return (
    <div className="flex items-start justify-between rounded-xl bg-white p-3 ring-1 ring-slate-200 gap-2">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">
          {entry.subjectName || entry.subjectCode}
        </p>
        <p className="text-xs text-slate-500">{entry.doctorName}</p>
        <div className="mt-1 flex flex-wrap gap-1 text-xs">
          <span className={`rounded-full px-2 py-0.5 font-medium ${badge}`}>{entry.type}</span>
          <span className="text-slate-600">{entry.startTime}–{entry.endTime}</span>
          {entry.location && <span className="text-slate-500">· {entry.location}</span>}
          {entry.weekType && entry.weekType !== "All" && (
            <span className="text-slate-500">· {entry.weekType === "Odd" ? "Week A" : "Week B"}</span>
          )}
          {entry.groupName && <span className="text-slate-500">· {entry.groupName}</span>}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => onEdit(entry)}
          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium hover:bg-slate-200"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(entry)}
          className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function SlotFormModal({ open, onClose, onSave, initial, batchId }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Cascade: years → semesters → offerings
  const [years, setYears] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [offerings, setOfferings] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSemesters, setLoadingSemesters] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Load years + groups when modal opens
  useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            subjectOfferingId: initial.subjectOfferingId || "",
            groupId: initial.groupId || "",
            dayOfWeek: initial.dayOfWeekNumber ?? 1,
            startTime: initial.startTime || "09:00",
            endTime: initial.endTime || "10:30",
            type: TYPES.find((t) => t.label === initial.type)?.value ?? 0,
            location: initial.location || "",
            weekType:
              WEEK_TYPES.find(
                (w) =>
                  w.label === initial.weekType ||
                  (initial.weekType === "All" && w.value === 0)
              )?.value ?? 0,
          }
        : EMPTY_FORM
    );
    setSaveError("");
    setSelectedYearId("");
    setSelectedSemesterId("");
    setSemesters([]);
    setOfferings([]);
    setGroups([]);

    setLoadingYears(true);
    fetchAllYears()
      .then(setYears)
      .catch(() => setYears([]))
      .finally(() => setLoadingYears(false));

    if (batchId) {
      setLoadingGroups(true);
      fetchGroupsByBatch(batchId)
        .then(setGroups)
        .catch(() => setGroups([]))
        .finally(() => setLoadingGroups(false));
    }
  }, [open, initial, batchId]);

  // Load semesters when year changes
  useEffect(() => {
    if (!selectedYearId) { setSemesters([]); setSelectedSemesterId(""); setOfferings([]); return; }
    setLoadingSemesters(true);
    setSemesters([]);
    setSelectedSemesterId("");
    setOfferings([]);
    fetchSemestersByYear(selectedYearId)
      .then(setSemesters)
      .catch(() => setSemesters([]))
      .finally(() => setLoadingSemesters(false));
  }, [selectedYearId]);

  // Load offerings when semester changes
  useEffect(() => {
    if (!selectedSemesterId) { setOfferings([]); return; }
    setLoadingOfferings(true);
    setOfferings([]);
    setForm((f) => ({ ...f, subjectOfferingId: "" }));
    fetchOfferingsBySemester(selectedSemesterId)
      .then(setOfferings)
      .catch(() => setOfferings([]))
      .finally(() => setLoadingOfferings(false));
  }, [selectedSemesterId]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setNum = (field) => (e) => setForm((f) => ({ ...f, [field]: Number(e.target.value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaving(true);
    try {
      const dto = {
        subjectOfferingId: form.subjectOfferingId,
        groupId: form.groupId || null,
        dayOfWeek: Number(form.dayOfWeek),
        startTime: form.startTime,
        endTime: form.endTime,
        type: Number(form.type),
        location: form.location,
        weekType: Number(form.weekType),
      };
      await onSave(dto, initial?.id);
      onClose();
    } catch (err) {
      setSaveError(getErrorMessage(err, "Failed to save schedule entry."));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const inputCls =
    "w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:text-slate-400";
  const labelCls = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <h2 className="text-base font-semibold text-slate-800">
            {initial ? "Edit Schedule Slot" : "Add Schedule Slot"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 px-6 py-4">

          {/* ── Step 1: Academic Year ── */}
          <div>
            <label className={labelCls}>Academic Year</label>
            <select
              className={inputCls}
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              disabled={loadingYears}
            >
              <option value="">
                {loadingYears ? "Loading years…" : "— Select academic year —"}
              </option>
              {years.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Step 2: Semester ── */}
          <div>
            <label className={labelCls}>Semester</label>
            <select
              className={inputCls}
              value={selectedSemesterId}
              onChange={(e) => setSelectedSemesterId(e.target.value)}
              disabled={!selectedYearId || loadingSemesters}
            >
              <option value="">
                {loadingSemesters
                  ? "Loading semesters…"
                  : !selectedYearId
                  ? "Select a year first"
                  : "— Select semester —"}
              </option>
              {semesters.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* ── Step 3: Subject Offering ── */}
          <div>
            <label className={labelCls}>Subject Offering *</label>
            <select
              required
              className={inputCls}
              value={form.subjectOfferingId}
              onChange={set("subjectOfferingId")}
              disabled={!selectedSemesterId || loadingOfferings}
            >
              <option value="">
                {loadingOfferings
                  ? "Loading offerings…"
                  : !selectedSemesterId
                  ? "Select a semester first"
                  : offerings.length === 0
                  ? "No offerings found"
                  : "— Select offering —"}
              </option>
              {offerings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.subjectName || o.subjectCode}
                  {o.doctorName ? ` — ${o.doctorName}` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ── Slot details ── */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Day of Week *</label>
              <select
                required
                className={inputCls}
                value={form.dayOfWeek}
                onChange={setNum("dayOfWeek")}
              >
                {DAYS.map((d) => (
                  <option key={d.number} value={d.number}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type *</label>
              <select
                required
                className={inputCls}
                value={form.type}
                onChange={setNum("type")}
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Time *</label>
              <input
                required
                type="time"
                className={inputCls}
                value={form.startTime}
                onChange={set("startTime")}
              />
            </div>
            <div>
              <label className={labelCls}>End Time *</label>
              <input
                required
                type="time"
                className={inputCls}
                value={form.endTime}
                onChange={set("endTime")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Location</label>
              <input
                className={inputCls}
                placeholder="Hall A, Lab 3…"
                value={form.location}
                onChange={set("location")}
              />
            </div>
            <div>
              <label className={labelCls}>Week Type</label>
              <select
                className={inputCls}
                value={form.weekType}
                onChange={setNum("weekType")}
              >
                {WEEK_TYPES.map((w) => (
                  <option key={w.value} value={w.value}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Group (leave empty for whole batch)</label>
            <select
              className={inputCls}
              value={form.groupId}
              onChange={set("groupId")}
              disabled={loadingGroups}
            >
              <option value="">
                {loadingGroups ? "Loading groups…" : "— All students in batch —"}
              </option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name || g.code}
                </option>
              ))}
            </select>
          </div>

          {saveError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">
              {saveError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : initial ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminSchedulePage() {
  const [batches, setBatches] = useState([]);
  const [batchId, setBatchId] = useState("");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [batchesLoading, setBatchesLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    fetchAllBatches()
      .then((data) => { if (active) setBatches(data); })
      .catch(() => {})
      .finally(() => { if (active) setBatchesLoading(false); });
    return () => { active = false; };
  }, []);

  const loadSchedule = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    setError("");
    try {
      const data = await fetchBatchSchedule(batchId);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load schedule."));
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => { if (batchId) loadSchedule(); }, [loadSchedule, batchId]);

  const handleSave = useCallback(async (dto, id) => {
    if (id) {
      const updated = await updateScheduleEntry(id, dto);
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    } else {
      const created = await createScheduleEntry(dto);
      setEntries((prev) => [...prev, created]);
    }
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteScheduleEntry(deleteTarget.id);
      setEntries((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      alert(getErrorMessage(err, "Failed to delete entry."));
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget]);

  const byDay = DAYS.map((d) => ({
    ...d,
    slots: entries
      .filter((e) => e.dayOfWeekNumber === d.number)
      .sort((a, b) => a.startTime?.localeCompare(b.startTime)),
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <PageHeader
        title="Timetable Manager"
        action={
          batchId && (
            <button
              type="button"
              onClick={() => { setEditingEntry(null); setModalOpen(true); }}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              + Add Slot
            </button>
          )
        }
      />

      {/* Batch selector */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Select Batch</label>
          {batchesLoading ? (
            <div className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-400 bg-white w-56">
              Loading batches…
            </div>
          ) : (
            <select
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white w-56"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            >
              <option value="">— Choose a batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name || b.code}
                </option>
              ))}
            </select>
          )}
        </div>
        {batchId && !loading && (
          <button
            type="button"
            onClick={loadSchedule}
            className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Refresh
          </button>
        )}
      </div>

      {!batchId && (
        <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200">
          <p className="text-slate-500">Select a batch to view and manage its timetable.</p>
        </div>
      )}

      {batchId && loading && <Loading label="Loading timetable…" />}
      {batchId && !loading && error && <ErrorState message={error} onRetry={loadSchedule} />}

      {batchId && !loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {byDay.map((day) => (
            <div key={day.number} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h3 className="mb-3 text-sm font-bold text-slate-700 uppercase tracking-wide">
                {day.short}
              </h3>
              {day.slots.length === 0 ? (
                <p className="text-xs text-slate-400">No slots</p>
              ) : (
                <div className="space-y-2">
                  {day.slots.map((e) => (
                    <SlotCard
                      key={e.id}
                      entry={e}
                      onEdit={(entry) => { setEditingEntry(entry); setModalOpen(true); }}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SlotFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        initial={editingEntry}
        batchId={batchId}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="mb-2 text-base font-semibold text-slate-800">Delete Slot?</h3>
            <p className="text-sm text-slate-600">
              Remove <strong>{deleteTarget.subjectName}</strong> ({deleteTarget.type}) on{" "}
              {deleteTarget.dayOfWeek} {deleteTarget.startTime}–{deleteTarget.endTime}?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl px-4 py-2 text-sm ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSchedulePage;
