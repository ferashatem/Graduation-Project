import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Button,
  Divider,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import RoomSessionModal from "../../components/campusBuildings/RoomSessionModal";
import {
  addRoomSession,
  deleteRoomSession,
  fetchColleges,
  fetchMaterialsByCollege,
  getBuildingById,
  getFloorById,
  getRoom,
  getRoomScheduleByDay,
  updateRoomSession,
} from "../../services/buildingsAdmin.service";
import { getErrorMessage } from "../../utils/errorHelpers";

const DAY_OPTIONS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getDefaultDay = () => {
  const map = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return map[new Date().getDay()] || "Monday";
};

const timeToMinutes = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return Number.NaN;
  const [hoursPart, minutesPart] = raw.split(":");
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return Number.NaN;
  return hours * 60 + minutes;
};

const isOverlapping = (aStart, aEnd, bStart, bEnd) =>
  aStart < bEnd && aEnd > bStart;

function RoomSchedulePage() {
  const { buildingId, floorId, roomId } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [floor, setFloor] = useState(null);
  const [room, setRoom] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");

  const [selectedDay, setSelectedDay] = useState(getDefaultDay());
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [collegesError, setCollegesError] = useState("");
  const materialsCacheRef = useRef(new Map());

  const [confirmState, setConfirmState] = useState({
    open: false,
    session: null,
  });
  const [deleting, setDeleting] = useState(false);

  const [actionError, setActionError] = useState("");

  const resolvePermissionError = useCallback((error, path) => {
    const message = error?.message || "";
    if (
      error?.code === "permission-denied" ||
      /missing or insufficient permissions/i.test(message)
    ) {
      console.error("[permissions] access denied", { path, error });
      return "Missing or insufficient permissions. Please contact an administrator.";
    }
    return "";
  }, []);

  const resolveIndexError = useCallback((error, path) => {
    const message = error?.message || "";
    if (error?.code === "failed-precondition" || /requires an index/i.test(message)) {
      console.error("[firestore] index required", { path, error });
      return "This query needs a Firestore index. Please create it and try again.";
    }
    return "";
  }, []);

  useEffect(() => {
    let isActive = true;
    if (!buildingId || !floorId || !roomId) return;
    setMetaLoading(true);
    setMetaError("");

    Promise.all([
      getBuildingById(buildingId),
      getFloorById(buildingId, floorId),
      getRoom(buildingId, floorId, roomId),
    ])
      .then(([buildingDoc, floorDoc, roomDoc]) => {
        if (!isActive) return;
        if (!roomDoc) {
          setMetaError("Room not found.");
          setRoom(null);
          return;
        }
        setBuilding(buildingDoc);
        setFloor(floorDoc);
        setRoom(roomDoc);
      })
      .catch((err) => {
        if (!isActive) return;
        const permissionMessage = resolvePermissionError(
          err,
          `buildings/${buildingId}/floors/${floorId}/rooms/${roomId}`
        );
        setMetaError(
          permissionMessage || getErrorMessage(err, "Failed to load room.")
        );
      })
      .finally(() => {
        if (!isActive) return;
        setMetaLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [buildingId, floorId, roomId, resolvePermissionError]);

  useEffect(() => {
    let isActive = true;
    setCollegesLoading(true);
    setCollegesError("");
    fetchColleges()
      .then((data) => {
        if (!isActive) return;
        setColleges(data);
      })
      .catch((err) => {
        if (!isActive) return;
        const permissionMessage = resolvePermissionError(err, "colleges");
        setCollegesError(
          permissionMessage ||
            getErrorMessage(err, "Failed to load colleges.")
        );
      })
      .finally(() => {
        if (!isActive) return;
        setCollegesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [resolvePermissionError]);

  useEffect(() => {
    setSelectedDay(getDefaultDay());
  }, [roomId]);

  useEffect(() => {
    let isActive = true;
    if (!buildingId || !floorId || !roomId || !selectedDay) return;
    setSessionsLoading(true);
    setSessionsError("");

    getRoomScheduleByDay(buildingId, floorId, roomId, selectedDay)
      .then((data) => {
        if (!isActive) return;
        setSessions(data);
      })
      .catch((err) => {
        if (!isActive) return;
        const path = `buildings/${buildingId}/floors/${floorId}/rooms/${roomId}/schedule`;
        const indexMessage = resolveIndexError(err, path);
        const permissionMessage = resolvePermissionError(err, path);
        setSessionsError(
          indexMessage ||
            permissionMessage ||
            getErrorMessage(err, "Failed to load schedule.")
        );
      })
      .finally(() => {
        if (!isActive) return;
        setSessionsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [buildingId, floorId, roomId, resolvePermissionError, selectedDay, refreshKey]);

  const sortedSessions = useMemo(() => {
    const sorted = [...sessions];
    sorted.sort((a, b) =>
      String(a.startTime || "").localeCompare(String(b.startTime || ""))
    );
    return sorted;
  }, [sessions]);

  const handleDayChange = useCallback((event) => {
    setSelectedDay(event.target.value);
  }, []);

  const handleOpenAdd = useCallback(() => {
    setEditingSession(null);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleEdit = useCallback((session) => {
    setEditingSession(session);
    setFormError("");
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingSession(null);
  }, [saving]);

  const fetchMaterialsForCollege = useCallback(
    async (collegeId) => {
      if (!collegeId) return [];
      if (materialsCacheRef.current.has(collegeId)) {
        return materialsCacheRef.current.get(collegeId);
      }
      const data = await fetchMaterialsByCollege(collegeId);
      materialsCacheRef.current.set(collegeId, data);
      return data;
    },
    []
  );

  const handleSubmitSession = useCallback(
    async (payload) => {
      if (!buildingId || !floorId || !roomId) return;
      setSaving(true);
      setFormError("");
      setActionError("");

      if (!payload.collegeId || !payload.materialId) {
        setFormError("Please select a college and material.");
        setSaving(false);
        return;
      }

      const startMinutes = timeToMinutes(payload.startTime);
      const endMinutes = timeToMinutes(payload.endTime);
      if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
        setFormError("Enter valid start and end times.");
        setSaving(false);
        return;
      }
      if (startMinutes >= endMinutes) {
        setFormError("Start time must be before end time.");
        setSaving(false);
        return;
      }

      const conflict = sessions.find((session) => {
        if (editingSession?.id && session.id === editingSession.id) return false;
        if (String(session.day) !== String(payload.day)) return false;
        const sessionStart = timeToMinutes(session.startTime);
        const sessionEnd = timeToMinutes(session.endTime);
        return isOverlapping(startMinutes, endMinutes, sessionStart, sessionEnd);
      });

      if (conflict) {
        setFormError(
          `This room is already booked from ${conflict.startTime} to ${conflict.endTime}.`
        );
        setSaving(false);
        return;
      }

      try {
        if (editingSession?.id) {
          await updateRoomSession(
            buildingId,
            floorId,
            roomId,
            editingSession.id,
            payload
          );
        } else {
          await addRoomSession(buildingId, floorId, roomId, payload);
        }
        setModalOpen(false);
        setEditingSession(null);
        setRefreshKey((prev) => prev + 1);
      } catch (err) {
        const permissionMessage = resolvePermissionError(
          err,
          `buildings/${buildingId}/floors/${floorId}/rooms/${roomId}/schedule`
        );
        const message =
          permissionMessage || getErrorMessage(err, "Failed to save session.");
        setFormError(message);
        setActionError(message);
      } finally {
        setSaving(false);
      }
    },
    [
      buildingId,
      editingSession?.id,
      floorId,
      roomId,
      resolvePermissionError,
      sessions,
    ]
  );

  const handleDeletePrompt = useCallback((session) => {
    setConfirmState({ open: true, session });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, session: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!confirmState.session?.id || !buildingId || !floorId || !roomId) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteRoomSession(
        buildingId,
        floorId,
        roomId,
        confirmState.session.id
      );
      handleCloseConfirm();
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}/floors/${floorId}/rooms/${roomId}/schedule/${confirmState.session?.id || ""}`
      );
      setActionError(
        permissionMessage || getErrorMessage(err, "Failed to delete session.")
      );
    } finally {
      setDeleting(false);
    }
  }, [
    buildingId,
    confirmState.session,
    floorId,
    handleCloseConfirm,
    resolvePermissionError,
    roomId,
  ]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Admin", to: "/admin/home" },
      { label: "Campus Buildings", to: "/admin/campus-buildings" },
      { label: building?.name || "Building", to: `/admin/campus-buildings/${buildingId}` },
      { label: floor?.label || `Floor ${floor?.floorNumber || ""}` },
      { label: room?.roomNumber || room?.name || "Room" },
    ],
    [building?.name, buildingId, floor?.floorNumber, floor?.label, room?.name, room?.roomNumber]
  );

  if (metaLoading) {
    return <Loading label="Loading room schedule..." />;
  }

  if (metaError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Room Schedule" />
        <ErrorState message={metaError} />
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/admin/campus-buildings/${buildingId}`)}
        >
          Back to Building
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={room?.name || room?.roomNumber || "Room Schedule"}
        breadcrumbs={breadcrumbs}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate(`/admin/campus-buildings/${buildingId}`)}
          >
            Back
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <Typography variant="h6" className="text-slate-800">
          {room?.roomNumber || "Room"} {room?.name ? `- ${room.name}` : ""}
        </Typography>
        <Typography variant="body2" className="text-slate-500">
          Capacity: {room?.capacity || "-"}
        </Typography>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Typography variant="h6" className="text-slate-800">
              Reservations
            </Typography>
            <Typography variant="body2" className="text-slate-500">
              Select a day to view reservations.
            </Typography>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TextField
              select
              size="small"
              label="Day"
              value={selectedDay}
              onChange={handleDayChange}
            >
              {DAY_OPTIONS.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAdd}
            >
              Add Session
            </Button>
          </div>
        </div>

        <Divider className="my-4" />

        {sessionsLoading ? (
          <Loading label="Loading reservations..." />
        ) : sessionsError ? (
          <ErrorState message={sessionsError} />
        ) : sortedSessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No reservations for this day.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Typography variant="subtitle2" className="text-slate-700">
                    {session.startTime} - {session.endTime}
                  </Typography>
                  <Typography variant="body2" className="text-slate-500">
                    {session.materialTitle ||
                      session.materialName ||
                      session.reservedBy ||
                      "Reserved session"}
                    {session.collegeName ? ` - ${session.collegeName}` : ""}
                  </Typography>
                  {session.notes ? (
                    <Typography variant="caption" className="text-slate-400">
                      {session.notes}
                    </Typography>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <IconButton size="small" onClick={() => handleEdit(session)}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeletePrompt(session)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <RoomSessionModal
        open={modalOpen}
        initialValues={editingSession}
        selectedDay={selectedDay}
        loading={saving}
        error={formError}
        colleges={colleges}
        collegesLoading={collegesLoading}
        collegesError={collegesError}
        onRequestMaterials={fetchMaterialsForCollege}
        onClose={handleCloseModal}
        onSubmit={handleSubmitSession}
      />

      <ConfirmDialog
        open={confirmState.open}
        title="Delete session?"
        message="This will remove the reservation from the schedule."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default RoomSchedulePage;
