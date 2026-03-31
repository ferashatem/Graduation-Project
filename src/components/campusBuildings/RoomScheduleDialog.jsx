import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import Loading from "../common/Loading";
import ConfirmDialog from "../common/ConfirmDialog";
import AddEditScheduleModal from "./AddEditScheduleModal";
import {
  addCampusSchedule,
  deleteCampusSchedule,
  getCampusRoomAllSchedules,
  minutesToTime,
  updateCampusSchedule,
} from "../../services/campusBuildingsAdmin.service";
import { getErrorMessage } from "../../utils/errorHelpers";

const DAY_OPTIONS = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

function RoomScheduleDialog({
  open,
  room,
  buildingId,
  floorId,
  initialDay,
  onClose,
  onScheduleChange,
}) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterDay, setFilterDay] = useState("ALL");

  const [scheduleModal, setScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [confirmState, setConfirmState] = useState({ open: false, schedule: null });
  const [deleting, setDeleting] = useState(false);

  const loadSchedules = useCallback(async () => {
    if (!buildingId || !floorId || !room?.id) return;
    setLoading(true);
    setError("");
    try {
      const data = await getCampusRoomAllSchedules(buildingId, floorId, room.id);
      setSchedules(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load schedules."));
    } finally {
      setLoading(false);
    }
  }, [buildingId, floorId, room?.id]);

  useEffect(() => {
    if (open && room?.id) {
      setFilterDay(initialDay || "ALL");
      loadSchedules();
    }
  }, [open, room?.id, initialDay, loadSchedules]);

  const filteredSchedules = filterDay === "ALL"
    ? schedules
    : schedules.filter((s) => s.day === filterDay);

  const groupedByDay = DAY_OPTIONS.reduce((acc, day) => {
    const daySchedules = filteredSchedules
      .filter((s) => s.day === day.value)
      .sort((a, b) => (a.startMin || 0) - (b.startMin || 0));
    if (daySchedules.length > 0) acc.push({ ...day, schedules: daySchedules });
    return acc;
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingSchedule(null);
    setFormError("");
    setScheduleModal(true);
  }, []);

  const handleEdit = useCallback((schedule) => {
    setEditingSchedule(schedule);
    setFormError("");
    setScheduleModal(true);
  }, []);

  const handleCloseScheduleModal = useCallback(() => {
    if (saving) return;
    setScheduleModal(false);
    setEditingSchedule(null);
  }, [saving]);

  const handleSubmitSchedule = useCallback(
    async (payload) => {
      if (!buildingId || !floorId || !room?.id) return;
      setSaving(true);
      setFormError("");
      try {
        if (editingSchedule?.id) {
          await updateCampusSchedule(
            buildingId, floorId, room.id, editingSchedule.id, payload
          );
        } else {
          await addCampusSchedule(buildingId, floorId, room.id, payload);
        }
        setScheduleModal(false);
        setEditingSchedule(null);
        await loadSchedules();
        if (onScheduleChange) onScheduleChange();
      } catch (err) {
        setFormError(getErrorMessage(err, "Failed to save schedule."));
      } finally {
        setSaving(false);
      }
    },
    [buildingId, editingSchedule?.id, floorId, loadSchedules, onScheduleChange, room?.id]
  );

  const handleDeletePrompt = useCallback((schedule) => {
    setConfirmState({ open: true, schedule });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const schedule = confirmState.schedule;
    if (!schedule?.id || !buildingId || !floorId || !room?.id) return;
    setDeleting(true);
    try {
      await deleteCampusSchedule(buildingId, floorId, room.id, schedule.id);
      setConfirmState({ open: false, schedule: null });
      await loadSchedules();
      if (onScheduleChange) onScheduleChange();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete schedule."));
    } finally {
      setDeleting(false);
    }
  }, [buildingId, confirmState.schedule, floorId, loadSchedules, onScheduleChange, room?.id]);

  const handleClose = useCallback(() => {
    if (saving || deleting) return;
    if (onClose) onClose();
  }, [deleting, onClose, saving]);

  if (!room) return null;

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h6" component="span">
                Room {room.roomNumber} Schedule
              </Typography>
              {room.name ? (
                <Typography variant="body2" className="text-slate-500">
                  {room.name}
                  {room.capacity ? ` · Capacity: ${room.capacity}` : ""}
                </Typography>
              ) : room.capacity ? (
                <Typography variant="body2" className="text-slate-500">
                  Capacity: {room.capacity}
                </Typography>
              ) : null}
            </div>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleOpenAdd}
            >
              Add Session
            </Button>
          </div>
        </DialogTitle>

        <DialogContent>
          {error ? <Alert severity="error" className="mb-3">{error}</Alert> : null}

          <div className="mb-4">
            <TextField
              select
              size="small"
              label="Filter by day"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value="ALL">All days</MenuItem>
              {DAY_OPTIONS.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  {d.label}
                </MenuItem>
              ))}
            </TextField>
          </div>

          <Divider className="mb-4" />

          {loading ? (
            <Loading label="Loading schedules..." />
          ) : groupedByDay.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm text-slate-500">
                No schedules found{filterDay !== "ALL" ? ` for ${DAY_OPTIONS.find((d) => d.value === filterDay)?.label || filterDay}` : ""}.
              </p>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Add />}
                onClick={handleOpenAdd}
                sx={{ mt: 2 }}
              >
                Add first session
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedByDay.map((dayGroup) => (
                <div
                  key={dayGroup.value}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Typography variant="subtitle2" className="font-semibold text-slate-700">
                      {dayGroup.label}
                    </Typography>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {dayGroup.schedules.length} session{dayGroup.schedules.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayGroup.schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors hover:bg-slate-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="rounded-md bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                            {minutesToTime(schedule.startMin)} - {minutesToTime(schedule.endMin)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">
                              {schedule.courseName || "Reserved"}
                            </p>
                            {schedule.courseId ? (
                              <p className="text-[11px] text-slate-400">
                                ID: {schedule.courseId}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <IconButton size="small" onClick={() => handleEdit(schedule)}>
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
                </div>
              ))}
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <AddEditScheduleModal
        open={scheduleModal}
        initialValues={editingSchedule}
        existingSchedules={schedules}
        loading={saving}
        error={formError}
        onClose={handleCloseScheduleModal}
        onSubmit={handleSubmitSchedule}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete session?"
        message="This will permanently remove this scheduled session."
        confirmLabel="Delete"
        loading={deleting}
        onClose={() => setConfirmState({ open: false, schedule: null })}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export default RoomScheduleDialog;
