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
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import Loading from "../common/Loading";
import ConfirmDialog from "../common/ConfirmDialog";
import AddEditScheduleModal from "./AddEditScheduleModal";
import { db } from "../../firebase/firebaseConfig";
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

const normalizeText = (value) =>
  value === null || value === undefined ? "" : String(value).trim();

const firstNonEmpty = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const arrayMatch = value.map(normalizeText).find(Boolean);
      if (arrayMatch) return arrayMatch;
      continue;
    }
    const normalized = normalizeText(value);
    if (normalized) return normalized;
  }
  return "";
};

const getDayLabel = (dayValue) =>
  DAY_OPTIONS.find((option) => option.value === dayValue)?.label ||
  normalizeText(dayValue);

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

  const getAssignmentDocsByScheduleId = useCallback(async (scheduleId) => {
    if (!scheduleId) return [];
    const assignmentsQuery = query(
      collection(db, "courseAssignments"),
      where("scheduleId", "==", scheduleId)
    );
    const assignmentsSnap = await getDocs(assignmentsQuery);
    return assignmentsSnap.docs;
  }, []);

  const loadSelectedCourse = useCallback(async (courseId) => {
    const normalizedCourseId = normalizeText(courseId);
    if (!normalizedCourseId) return null;

    const indexedCourseSnap = await getDoc(doc(db, "allCourses", normalizedCourseId));
    if (!indexedCourseSnap.exists()) {
      throw new Error("Selected course was not found.");
    }

    const indexedCourse = { id: indexedCourseSnap.id, ...indexedCourseSnap.data() };
    const collegeId = normalizeText(indexedCourse.collegeId);
    const yearId = normalizeText(indexedCourse.yearId);
    const departmentId = normalizeText(indexedCourse.departmentId);

    if (!collegeId || !yearId || !departmentId) {
      return indexedCourse;
    }

    const courseSnap = await getDoc(
      doc(
        db,
        "colleges",
        collegeId,
        "years",
        yearId,
        "departments",
        departmentId,
        "courses",
        normalizedCourseId
      )
    );

    return courseSnap.exists()
      ? { ...indexedCourse, ...courseSnap.data() }
      : indexedCourse;
  }, []);

  const getBuildingName = useCallback(async () => {
    if (!buildingId) return "";
    try {
      const buildingSnap = await getDoc(doc(db, "campusBuildings", buildingId));
      return buildingSnap.exists()
        ? normalizeText(buildingSnap.data()?.name)
        : "";
    } catch {
      return "";
    }
  }, [buildingId]);

  const buildCourseAssignmentPayload = useCallback(
    async (scheduleId, schedulePayload, courseData) => {
      if (!scheduleId || !schedulePayload?.courseId || !courseData) return null;

      const buildingName = (await getBuildingName()) || normalizeText(room?.buildingName);
      const roomName = firstNonEmpty(room?.name, room?.roomNumber, room?.id);
      const dayOfWeek = getDayLabel(schedulePayload.day);
      const startTime = minutesToTime(schedulePayload.startMin);
      const endTime = minutesToTime(schedulePayload.endMin);

      const professorId = firstNonEmpty(
        courseData.profId,
        courseData.professorId,
        courseData.professorUid
      );
      const professorName = firstNonEmpty(
        courseData.profName,
        courseData.professorName,
        courseData.professorDisplayName
      );

      const assistantUidList = Array.from(
        new Set(
          [
            ...(Array.isArray(courseData.assistantUids)
              ? courseData.assistantUids
              : []),
            ...(Array.isArray(courseData.assistantIds)
              ? courseData.assistantIds
              : []),
            courseData.assistantId,
          ]
            .map(normalizeText)
            .filter(Boolean)
        )
      );

      const assistantId =
        assistantUidList[0] || firstNonEmpty(courseData.assistantId);
      const assistantName = firstNonEmpty(
        courseData.assistantName,
        courseData.assistantNames,
        courseData.assistantDisplayName
      );

      return {
        scheduleId,
        courseId: normalizeText(schedulePayload.courseId) || courseData.id,
        courseName:
          firstNonEmpty(schedulePayload.courseName, courseData.name) || null,
        courseCode:
          firstNonEmpty(schedulePayload.courseCode, courseData.code) || null,
        college: firstNonEmpty(
          courseData.college,
          courseData.collegeName,
          courseData.collegeId
        ) || null,
        year: firstNonEmpty(
          courseData.year,
          courseData.yearLevel,
          courseData.yearName,
          courseData.yearId
        ) || null,
        department: firstNonEmpty(
          courseData.department,
          courseData.departmentName,
          courseData.departmentId
        ) || null,
        profId: professorId || null,
        profName: professorName || null,
        assistantId: assistantId || null,
        assistantName: assistantName || null,
        buildingId: normalizeText(buildingId) || null,
        buildingName: buildingName || null,
        floorId: normalizeText(floorId) || null,
        roomId: normalizeText(room?.id) || null,
        roomName: roomName || null,
        dayOfWeek: dayOfWeek || null,
        startTime,
        endTime,
        slotType:
          schedulePayload?.slotType ??
          editingSchedule?.slotType ??
          null,

        // Compatibility fields used by current professor / assistant pages.
        professorUid: professorId || null,
        assistantUids: assistantUidList,
        building: buildingName || normalizeText(buildingId) || "",
        room: roomName || "",
        schedule: [{ day: dayOfWeek || "", startTime, endTime }],
      };
    },
    [buildingId, editingSchedule?.slotType, floorId, getBuildingName, room]
  );

  const syncCourseAssignmentForSchedule = useCallback(
    async (scheduleId, schedulePayload) => {
      if (!scheduleId) return;

      const assignmentDocs = await getAssignmentDocsByScheduleId(scheduleId);

      if (!schedulePayload?.courseId) {
        await Promise.all(assignmentDocs.map((assignmentDoc) => deleteDoc(assignmentDoc.ref)));
        return;
      }

      const courseData = await loadSelectedCourse(schedulePayload.courseId);
      const assignmentPayload = await buildCourseAssignmentPayload(
        scheduleId,
        schedulePayload,
        courseData
      );

      if (!assignmentPayload) return;

      if (assignmentDocs.length === 0) {
        // Before creating a new doc, check if an existing courseAssignment for
        // this courseId already exists (e.g. created by AssignStaffDialog without
        // a scheduleId). If so, update that doc instead of creating a duplicate.
        const existingByCoursSnap = await getDocs(
          query(
            collection(db, "courseAssignments"),
            where("courseId", "==", schedulePayload.courseId)
          )
        );
        const docsWithoutSchedule = existingByCoursSnap.docs.filter(
          (d) => !d.data().scheduleId
        );
        if (docsWithoutSchedule.length > 0) {
          await Promise.all(
            docsWithoutSchedule.map((d) =>
              updateDoc(d.ref, { ...assignmentPayload, updatedAt: serverTimestamp() })
            )
          );
          return;
        }

        await addDoc(collection(db, "courseAssignments"), {
          ...assignmentPayload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        return;
      }

      await Promise.all(
        assignmentDocs.map((assignmentDoc) =>
          updateDoc(assignmentDoc.ref, {
            ...assignmentPayload,
            updatedAt: serverTimestamp(),
          })
        )
      );
    },
    [buildCourseAssignmentPayload, getAssignmentDocsByScheduleId, loadSelectedCourse]
  );

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
          try {
            await syncCourseAssignmentForSchedule(editingSchedule.id, payload);
          } catch (syncErr) {
            setScheduleModal(false);
            setEditingSchedule(null);
            await loadSchedules();
            if (onScheduleChange) onScheduleChange();
            setError(
              getErrorMessage(
                syncErr,
                "Time slot saved, but the course assignment record could not be synced."
              )
            );
            return;
          }
        } else {
          const createdSchedule = await addCampusSchedule(
            buildingId,
            floorId,
            room.id,
            payload
          );
          try {
            await syncCourseAssignmentForSchedule(createdSchedule.id, payload);
          } catch (syncErr) {
            setScheduleModal(false);
            setEditingSchedule(null);
            await loadSchedules();
            if (onScheduleChange) onScheduleChange();
            setError(
              getErrorMessage(
                syncErr,
                "Time slot saved, but the course assignment record could not be created."
              )
            );
            return;
          }
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
    [
      buildingId,
      editingSchedule?.id,
      floorId,
      loadSchedules,
      onScheduleChange,
      room?.id,
      syncCourseAssignmentForSchedule,
    ]
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
      try {
        const assignmentDocs = await getAssignmentDocsByScheduleId(schedule.id);
        await Promise.all(
          assignmentDocs.map((assignmentDoc) => deleteDoc(assignmentDoc.ref))
        );
      } catch (syncErr) {
        setConfirmState({ open: false, schedule: null });
        await loadSchedules();
        if (onScheduleChange) onScheduleChange();
        setError(
          getErrorMessage(
            syncErr,
            "Time slot deleted, but its course assignment record could not be removed."
          )
        );
        return;
      }
      setConfirmState({ open: false, schedule: null });
      await loadSchedules();
      if (onScheduleChange) onScheduleChange();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete schedule."));
    } finally {
      setDeleting(false);
    }
  }, [
    buildingId,
    confirmState.schedule,
    floorId,
    getAssignmentDocsByScheduleId,
    loadSchedules,
    onScheduleChange,
    room?.id,
  ]);

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
                            {schedule.courseCode ? (
                              <p className="text-[11px] text-slate-400">
                                {schedule.courseCode}
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
