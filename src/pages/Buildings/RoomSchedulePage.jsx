import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ScheduleCellModal from "../../components/Buildings/ScheduleCellModal";
import ConfirmDeleteModal from "../../components/Buildings/ConfirmDeleteModal";
import { getBuilding } from "../../firebase/buildingsApi";
import { getRoom } from "../../firebase/roomsApi";
import {
  createSchedule,
  deleteSchedule,
  subscribeSchedules,
  updateSchedule,
} from "../../firebase/scheduleApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { useAuth } from "../../context/AuthContext";
import { DAY_OPTIONS, TIME_SLOTS, getDayLabel, getDefaultDayKey } from "./scheduleConstants";

function RoomSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildingId, roomId } = useParams();
  const { role } = useAuth();
  const canManage = useMemo(() => role === "admin", [role]);

  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const collegeId = useMemo(
    () => location.state?.collegeId || searchParams.get("collegeId") || "",
    [location.state, searchParams]
  );

  const [building, setBuilding] = useState(
    location.state?.buildingName ? { name: location.state.buildingName } : null
  );
  const [room, setRoom] = useState(
    location.state?.roomName ? { name: location.state.roomName } : null
  );
  const [metaLoading, setMetaLoading] = useState(false);
  const [metaError, setMetaError] = useState("");

  const [selectedDayKey, setSelectedDayKey] = useState(getDefaultDayKey());
  const [schedules, setSchedules] = useState([]);
  const [scheduleError, setScheduleError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [activeSchedule, setActiveSchedule] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, schedule: null });
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!collegeId || !buildingId || !roomId) return;
    setMetaLoading(true);
    setMetaError("");

    Promise.all([getBuilding(collegeId, buildingId), getRoom(collegeId, buildingId, roomId)])
      .then(([buildingDoc, roomDoc]) => {
        if (buildingDoc) setBuilding(buildingDoc);
        if (roomDoc) setRoom(roomDoc);
      })
      .catch((err) => setMetaError(getErrorMessage(err)))
      .finally(() => setMetaLoading(false));
  }, [buildingId, collegeId, roomId]);

  useEffect(() => {
    if (!collegeId || !buildingId || !roomId) {
      setSchedules([]);
      return;
    }
    const unsubscribe = subscribeSchedules(
      collegeId,
      buildingId,
      roomId,
      { dayKey: selectedDayKey },
      (data) => setSchedules(data),
      (error) => setScheduleError(getErrorMessage(error))
    );
    return () => unsubscribe();
  }, [buildingId, collegeId, roomId, selectedDayKey]);

  const scheduleBySlot = useMemo(() => {
    return schedules.reduce((acc, schedule) => {
      if (schedule?.slotKey) acc[schedule.slotKey] = schedule;
      return acc;
    }, {});
  }, [schedules]);

  const slotRows = useMemo(() => {
    return TIME_SLOTS.map((slot) => ({
      ...slot,
      slotKey: slot.key,
      dayKey: selectedDayKey,
      dayLabel: getDayLabel(selectedDayKey),
    }));
  }, [selectedDayKey]);

  const breadcrumbs = useMemo(() => {
    const buildingLabel = building?.name || "Building";
    const roomLabel = room?.name || "Room schedule";
    return [
      { label: "Buildings", to: "/buildings" },
      { label: buildingLabel, to: `/buildings/${buildingId}/rooms?collegeId=${collegeId}` },
      { label: roomLabel },
    ];
  }, [building?.name, buildingId, collegeId, room?.name]);

  const handleDayChange = useCallback((event) => {
    setSelectedDayKey(event.target.value);
  }, []);

  const handleOpenSlot = useCallback(
    (slot, schedule) => {
      setActiveSlot(slot);
      setActiveSchedule(schedule || null);
      setActionError("");
      setModalOpen(true);
    },
    []
  );

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setActiveSlot(null);
    setActiveSchedule(null);
  }, []);

  const handleSaveSchedule = useCallback(
    async (payload) => {
      if (!collegeId || !buildingId || !roomId || !activeSlot) {
        setActionError("Missing schedule context.");
        return;
      }
      setSaving(true);
      setActionError("");
      try {
        if (activeSchedule?.id) {
          await updateSchedule(collegeId, buildingId, roomId, activeSchedule.id, {
            courseId: payload.courseId,
            courseName: payload.courseName,
            instructorId: payload.instructorId,
            instructorName: payload.instructorName,
            section: payload.section,
          });
        } else {
          await createSchedule(collegeId, buildingId, roomId, payload);
        }
        handleCloseModal();
      } catch (err) {
        setActionError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [
      activeSchedule,
      activeSlot,
      buildingId,
      collegeId,
      handleCloseModal,
      roomId,
    ]
  );

  const handleDeletePrompt = useCallback((schedule) => {
    if (!schedule) return;
    setConfirmState({ open: true, schedule });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, schedule: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.schedule;
    if (!target || !collegeId || !buildingId || !roomId) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteSchedule(collegeId, buildingId, roomId, target.id);
      handleCloseConfirm();
      handleCloseModal();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }, [buildingId, collegeId, confirmState.schedule, handleCloseConfirm, roomId, handleCloseModal]);

  if (!collegeId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Room schedule" />
        <Alert severity="warning">
          College context is missing. Please return to the rooms page.
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/buildings")}>
          Back to Buildings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={room?.name || "Room schedule"}
        breadcrumbs={breadcrumbs}
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              {building?.name || "Building"} · {room?.name || "Room"}
            </h2>
            <p className="text-sm text-slate-500">
              {`Schedule for ${getDayLabel(selectedDayKey)}`}
            </p>
          </div>
          <div className="w-full sm:w-52">
            <select
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm"
              value={selectedDayKey}
              onChange={handleDayChange}
            >
              {DAY_OPTIONS.map((day) => (
                <option key={day.key} value={day.key}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}
      {/* {scheduleError ? <Alert severity="warning">{scheduleError}</Alert> : null} */}
      {metaError && !metaLoading ? <ErrorState message={metaError} /> : null}

      {metaLoading && (!building || !room) ? (
        <Loading label="Loading room..." />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-[160px_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <div className="px-4 py-3">Time</div>
            <div className="px-4 py-3">{getDayLabel(selectedDayKey)}</div>
          </div>

          {slotRows.map((slot) => {
            const schedule = scheduleBySlot[slot.slotKey];
            return (
              <div
                key={slot.slotKey}
                className="grid grid-cols-[160px_1fr] border-b border-slate-100"
              >
                <div className="px-4 py-4 text-sm text-slate-600">{slot.label}</div>
                <div className="px-4 py-4">
                  {schedule ? (
                    <div className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          {schedule.courseName || "Untitled course"}
                        </p>
                        <p className="text-xs text-emerald-700">
                          {schedule.instructorName || "Instructor TBD"}
                        </p>
                        {schedule.section ? (
                          <p className="text-xs text-emerald-700">
                            Section {schedule.section}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSlot(slot, schedule)}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          View
                        </button>
                        {canManage ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenSlot(slot, schedule)}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePrompt(schedule)}
                              className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
                      <span className="text-sm text-slate-500">Available</span>
                      {canManage ? (
                        <button
                          type="button"
                          onClick={() => handleOpenSlot(slot, null)}
                          className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Add Course
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ScheduleCellModal
        open={modalOpen}
        slot={activeSlot}
        schedule={activeSchedule}
        canManage={canManage}
        loading={saving}
        error={actionError}
        onClose={handleCloseModal}
        onSave={handleSaveSchedule}
        onDelete={handleDeletePrompt}
      />

      <ConfirmDeleteModal
        open={confirmState.open}
        title="Delete booking?"
        message="This will remove the course booking from the schedule."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default RoomSchedulePage;

