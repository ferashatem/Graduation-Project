import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button } from "@mui/material";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import RoomCard from "../../components/Buildings/RoomCard";
import RoomFormModal from "../../components/Buildings/RoomFormModal";
import ConfirmDeleteModal from "../../components/Buildings/ConfirmDeleteModal";
import { getBuilding } from "../../firebase/buildingsApi";
import { createRoom, deleteRoom, subscribeRooms, updateRoom } from "../../firebase/roomsApi";
import { subscribeSchedulesByBuilding } from "../../firebase/scheduleApi";
import { getErrorMessage } from "../../utils/errorHelpers";
import { useAuth } from "../../context/AuthContext";
import { DAY_OPTIONS, TIME_SLOTS, getDayLabel, getDefaultDayKey } from "./scheduleConstants";

function RoomsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildingId } = useParams();
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
  const [buildingLoading, setBuildingLoading] = useState(false);
  const [buildingError, setBuildingError] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const [selectedDayKey, setSelectedDayKey] = useState(getDefaultDayKey());
  const [schedules, setSchedules] = useState([]);
  const [scheduleError, setScheduleError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, room: null });
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!collegeId || !buildingId) return;
    setBuildingLoading(true);
    setBuildingError("");
    getBuilding(collegeId, buildingId)
      .then((data) => {
        if (data) setBuilding(data);
      })
      .catch((err) => setBuildingError(getErrorMessage(err)))
      .finally(() => setBuildingLoading(false));
  }, [buildingId, collegeId]);

  useEffect(() => {
    if (!collegeId || !buildingId) {
      setRooms([]);
      setRoomsError("");
      return;
    }

    setRoomsLoading(true);
    const unsubscribe = subscribeRooms(
      collegeId,
      buildingId,
      (data) => {
        setRooms(data);
        setRoomsLoading(false);
      },
      (error) => {
        setRoomsError(getErrorMessage(error));
        setRoomsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [buildingId, collegeId]);

  useEffect(() => {
    if (!collegeId || !buildingId) {
      setSchedules([]);
      return;
    }

    const unsubscribe = subscribeSchedulesByBuilding(
      collegeId,
      buildingId,
      (data) => {
        setSchedules(data);
      },
      (error) => {
        setScheduleError(getErrorMessage(error));
      }
    );

    return () => unsubscribe();
  }, [buildingId, collegeId]);

  const roomDaySlots = useMemo(() => {
    const allowedDays = new Set(DAY_OPTIONS.map((day) => day.key));
    const map = {};
    schedules.forEach((schedule) => {
      const roomKey = String(schedule?.roomId || "").trim();
      const dayKey = String(schedule?.dayKey || "").trim().toLowerCase();
      const slotKey = String(schedule?.slotKey || "").trim();
      if (!roomKey || !dayKey || !slotKey) return;
      if (!allowedDays.has(dayKey)) return;
      if (!map[roomKey]) map[roomKey] = {};
      if (!map[roomKey][dayKey]) map[roomKey][dayKey] = new Set();
      map[roomKey][dayKey].add(slotKey);
    });
    return map;
  }, [schedules]);

  const roomStatus = useMemo(() => {
    const totalSlots = TIME_SLOTS.length;
    return rooms.reduce((acc, room) => {
      const daySlots = roomDaySlots[room.id] || {};
      const bookedCount = daySlots[selectedDayKey]?.size || 0;
      const dayStatus = DAY_OPTIONS.reduce((map, day) => {
        const count = daySlots[day.key]?.size || 0;
        map[day.key] = count >= totalSlots ? "full" : "available";
        return map;
      }, {});
      acc[room.id] = {
        available: Math.max(totalSlots - bookedCount, 0),
        isFull: bookedCount >= totalSlots,
        dayStatus,
      };
      return acc;
    }, {});
  }, [roomDaySlots, rooms, selectedDayKey]);

  const breadcrumbs = useMemo(() => {
    const name = building?.name || "Rooms";
    return [
      { label: "Buildings", to: "/buildings" },
      { label: name },
    ];
  }, [building?.name]);

  const handleDayChange = useCallback((event) => {
    setSelectedDayKey(event.target.value);
  }, []);

  const handleOpenRoom = useCallback(
    (room) => {
      if (!room?.id || !collegeId) return;
      navigate(
        `/buildings/${buildingId}/rooms/${room.id}?collegeId=${collegeId}`,
        {
          state: {
            collegeId,
            buildingName: building?.name || "",
            roomName: room.name || "",
          },
        }
      );
    },
    [building?.name, buildingId, collegeId, navigate]
  );

  const handleAdd = useCallback(() => {
    setEditing(null);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleEdit = useCallback((room) => {
    setEditing(room);
    setActionError("");
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setEditing(null);
  }, []);

  const handleDeletePrompt = useCallback((room) => {
    setConfirmState({ open: true, room });
  }, []);

  const handleCloseConfirm = useCallback(() => {
    setConfirmState({ open: false, room: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    const target = confirmState.room;
    if (!target || !collegeId || !buildingId) return;
    setDeleting(true);
    setActionError("");
    try {
      await deleteRoom(collegeId, buildingId, target.id);
      handleCloseConfirm();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }, [buildingId, collegeId, confirmState.room, handleCloseConfirm]);

  const handleSubmit = useCallback(
    async (values) => {
      if (!collegeId || !buildingId) {
        setActionError("College and building are required.");
        return;
      }
      setSaving(true);
      setActionError("");
      try {
        if (editing?.id) {
          await updateRoom(collegeId, buildingId, editing.id, {
            name: values.name,
            capacity: values.capacity,
            floor: values.floor,
          });
        } else {
          await createRoom(collegeId, buildingId, values);
        }
        setDialogOpen(false);
        setEditing(null);
      } catch (err) {
        setActionError(getErrorMessage(err));
      } finally {
        setSaving(false);
      }
    },
    [buildingId, collegeId, editing]
  );

  if (!collegeId) {
    return (
      <div className="space-y-4">
        <PageHeader title="Rooms" breadcrumbs={[{ label: "Rooms" }]} />
        <Alert severity="warning">
          College context is missing. Please select a college from the buildings
          page.
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
        title={building?.name || "Rooms"}
        breadcrumbs={breadcrumbs}
        action={
          canManage ? (
            <Button variant="contained" onClick={handleAdd}>
              Add Room
            </Button>
          ) : null
        }
      />

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Room status</h2>
            <p className="text-sm text-slate-500">
              {`Day view: ${getDayLabel(selectedDayKey)}`}
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
      {/* {roomsError ? <Alert severity="warning">{roomsError}</Alert> : null} */}
      {/* {scheduleError ? <Alert severity="warning">{scheduleError}</Alert> : null} */}
      {buildingError && !buildingLoading ? (
        <ErrorState message={buildingError} />
      ) : null}

      {buildingLoading && !building ? (
        <Loading label="Loading building..." />
      ) : roomsLoading && rooms.length === 0 ? (
        <Loading label="Loading rooms..." />
      ) : rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No rooms found for this building.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => {
            const status = roomStatus[room.id] || {
              available: TIME_SLOTS.length,
              isFull: false,
              dayStatus: {},
            };
            return (
              <RoomCard
                key={room.id}
                room={room}
                isFull={status.isFull}
                availableSlots={status.available}
                totalSlots={TIME_SLOTS.length}
                dayStatus={status.dayStatus}
                dayOptions={DAY_OPTIONS}
                onOpen={handleOpenRoom}
                onEdit={handleEdit}
                onDelete={handleDeletePrompt}
                canManage={canManage}
              />
            );
          })}
        </div>
      )}

      <RoomFormModal
        open={dialogOpen}
        initialValues={editing}
        buildingName={building?.name || ""}
        loading={saving}
        error={actionError}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
      />

      <ConfirmDeleteModal
        open={confirmState.open}
        title="Delete room?"
        message="This will remove the room and all schedules inside it."
        confirmLabel="Delete"
        loading={deleting}
        onClose={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default RoomsPage;
