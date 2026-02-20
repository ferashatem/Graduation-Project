import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import ConfirmDialog from "../common/ConfirmDialog";
import AddEditScheduleModal from "./AddEditScheduleModal";
import {
  addSchedule,
  deleteSchedule,
  listSchedules,
  minutesToTime,
  updateSchedule,
} from "../../services/campusBuildings.service";
import { getErrorMessage } from "../../utils/errorHelpers";

const DAY_OPTIONS = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

function RoomSchedulePanel({ selectedBuilding, selectedFloor, selectedRoom }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmState, setConfirmState] = useState({
    open: false,
    schedule: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const roomHeader = useMemo(() => {
    if (!selectedRoom || !selectedFloor || !selectedBuilding) {
      return "Select a room to view its schedule.";
    }
    const roomLabel = selectedRoom.roomNumber || selectedRoom.name || "Room";
    const floorLabel =
      selectedFloor.label || `Floor ${selectedFloor.floorNumber || ""}`;
    const buildingLabel =
      selectedBuilding.code || selectedBuilding.name || "Building";
    return `Schedule for Room ${roomLabel} - ${floorLabel} - ${buildingLabel}`;
  }, [selectedBuilding, selectedFloor, selectedRoom]);

  useEffect(() => {
    let isActive = true;

    if (!selectedBuilding?.id || !selectedFloor?.id || !selectedRoom?.id) {
      setSchedules([]);
      setLoading(false);
      setError("");
      return () => {
        isActive = false;
      };
    }

    setLoading(true);
    setError("");

    listSchedules(selectedBuilding.id, selectedFloor.id, selectedRoom.id)
      .then((data) => {
        if (!isActive) return;
        setSchedules(data);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(getErrorMessage(err, "Failed to load schedules."));
      })
      .finally(() => {
        if (!isActive) return;
        setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [refreshKey, selectedBuilding?.id, selectedFloor?.id, selectedRoom?.id]);

  useEffect(() => {
    setModalOpen(false);
    setEditingSchedule(null);
    setFormError("");
  }, [selectedBuilding?.id, selectedFloor?.id, selectedRoom?.id]);

  const schedulesByDay = useMemo(() => {
    const map = new Map(DAY_OPTIONS.map((day) => [day.value, []]));
    schedules.forEach((schedule) => {
      const dayKey = String(schedule.day || "").toUpperCase();
      if (!map.has(dayKey)) map.set(dayKey, []);
      map.get(dayKey).push(schedule);
    });
    map.forEach((daySchedules) => {
      daySchedules.sort(
        (a, b) => Number(a.startMin || 0) - Number(b.startMin || 0)
      );
    });
    return map;
  }, [schedules]);

  const handleOpenAdd = useCallback(() => {
    setEditingSchedule(null);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((schedule) => {
    setEditingSchedule(schedule);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingSchedule(null);
    setFormError("");
  }, [saving]);

  const handleSubmit = useCallback(
    async (payload) => {
      if (!selectedBuilding?.id || !selectedFloor?.id || !selectedRoom?.id) return;
      setSaving(true);
      setFormError("");
      try {
        if (editingSchedule?.id) {
          await updateSchedule(
            selectedBuilding.id,
            selectedFloor.id,
            selectedRoom.id,
            editingSchedule.id,
            payload
          );
          setToast({
            open: true,
            message: "Schedule updated.",
            severity: "success",
          });
        } else {
          await addSchedule(
            selectedBuilding.id,
            selectedFloor.id,
            selectedRoom.id,
            payload
          );
          setToast({
            open: true,
            message: "Schedule added.",
            severity: "success",
          });
        }
        setModalOpen(false);
        setEditingSchedule(null);
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        const message = getErrorMessage(err, "Failed to save schedule.");
        setFormError(message);
        setToast({ open: true, message, severity: "error" });
      } finally {
        setSaving(false);
      }
    },
    [editingSchedule?.id, selectedBuilding?.id, selectedFloor?.id, selectedRoom?.id]
  );

  const handleDeletePrompt = useCallback((schedule) => {
    setConfirmState({ open: true, schedule });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, schedule: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (
      !selectedBuilding?.id ||
      !selectedFloor?.id ||
      !selectedRoom?.id ||
      !confirmState.schedule?.id
    )
      return;
    setDeleting(true);
    try {
      await deleteSchedule(
        selectedBuilding.id,
        selectedFloor.id,
        selectedRoom.id,
        confirmState.schedule.id
      );
      setToast({
        open: true,
        message: "Schedule deleted.",
        severity: "success",
      });
      handleCloseConfirm();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const message = getErrorMessage(err, "Failed to delete schedule.");
      setToast({ open: true, message, severity: "error" });
    } finally {
      setDeleting(false);
    }
  }, [
    confirmState.schedule?.id,
    handleCloseConfirm,
    selectedBuilding?.id,
    selectedFloor?.id,
    selectedRoom?.id,
  ]);

  const handleToastClose = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" className="text-slate-800">
            Room Schedule
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            {roomHeader}
          </Typography>
        </div>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleOpenAdd}
          disabled={!selectedRoom}
        >
          Add Time Slot
        </Button>
      </div>

      <Divider className="my-4" />

      <div className="flex-1 overflow-hidden">
        {!selectedRoom ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Select a room to manage its schedule.
          </div>
        ) : loading ? (
          <Loading label="Loading schedules..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {DAY_OPTIONS.map((day) => {
              const daySchedules = schedulesByDay.get(day.value) || [];
              return (
                <div
                  key={day.value}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 p-3"
                >
                  <div className="flex items-center justify-between">
                    <Typography variant="subtitle2" className="text-slate-700">
                      {day.label}
                    </Typography>
                    <span className="text-xs text-slate-400">
                      {daySchedules.length} slots
                    </span>
                  </div>
                  {daySchedules.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-400">
                      No bookings yet.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-700">
                              {minutesToTime(schedule.startMin)} -{" "}
                              {minutesToTime(schedule.endMin)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {schedule.courseName ||
                                schedule.courseId ||
                                "No course assigned"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(schedule)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeletePrompt(schedule)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AddEditScheduleModal
        open={modalOpen}
        initialValues={editingSchedule}
        existingSchedules={schedules}
        loading={saving}
        error={formError}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete schedule?"
        message="This will remove the selected time slot."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />

      <Snackbar
        open={toast.open}
        onClose={handleToastClose}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleToastClose} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default RoomSchedulePanel;
