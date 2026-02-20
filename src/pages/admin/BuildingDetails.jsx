import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import FloorFormModal from "../../components/campusBuildings/FloorFormModal";
import RoomFormModal from "../../components/campusBuildings/RoomFormModal";
import {
  createFloor,
  createRoom,
  deleteFloor,
  deleteRoom,
  getBuildingById,
  getFloors,
  getRooms,
  updateFloor,
  updateRoom,
} from "../../services/buildingsAdmin.service";
import { getErrorMessage } from "../../utils/errorHelpers";

function BuildingDetails() {
  const { buildingId } = useParams();
  const navigate = useNavigate();

  const [building, setBuilding] = useState(null);
  const [buildingLoading, setBuildingLoading] = useState(true);
  const [buildingError, setBuildingError] = useState("");

  const [floors, setFloors] = useState([]);
  const [floorsLoading, setFloorsLoading] = useState(true);
  const [floorsError, setFloorsError] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const [selectedFloorId, setSelectedFloorId] = useState("");

  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorSaving, setFloorSaving] = useState(false);
  const [floorFormError, setFloorFormError] = useState("");

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomFormError, setRoomFormError] = useState("");

  const [confirmFloor, setConfirmFloor] = useState({
    open: false,
    floor: null,
  });
  const [confirmRoom, setConfirmRoom] = useState({
    open: false,
    room: null,
  });
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);

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

  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId) || null,
    [floors, selectedFloorId]
  );
  const roomSkeletons = useMemo(
    () => Array.from({ length: 6 }, (_, index) => `room-skeleton-${index}`),
    []
  );

  const loadBuilding = useCallback(async () => {
    if (!buildingId) return;
    setBuildingLoading(true);
    setBuildingError("");
    try {
      const data = await getBuildingById(buildingId);
      if (!data) {
        setBuildingError("Building not found.");
        setBuilding(null);
      } else {
        setBuilding(data);
      }
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}`
      );
      setBuildingError(
        permissionMessage || getErrorMessage(err, "Failed to load building.")
      );
    } finally {
      setBuildingLoading(false);
    }
  }, [buildingId, resolvePermissionError]);

  const loadFloors = useCallback(async () => {
    if (!buildingId) return;
    setFloorsLoading(true);
    setFloorsError("");
    try {
      const data = await getFloors(buildingId);
      setFloors(data);
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}/floors`
      );
      setFloorsError(
        permissionMessage || getErrorMessage(err, "Failed to load floors.")
      );
    } finally {
      setFloorsLoading(false);
    }
  }, [buildingId, resolvePermissionError]);

  const loadRooms = useCallback(async () => {
    if (!buildingId || !selectedFloorId) {
      setRooms([]);
      setRoomsLoading(false);
      return;
    }
    setRoomsLoading(true);
    setRoomsError("");
    try {
      const data = await getRooms(buildingId, selectedFloorId);
      setRooms(data);
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}/floors/${selectedFloorId}/rooms`
      );
      setRoomsError(
        permissionMessage || getErrorMessage(err, "Failed to load rooms.")
      );
    } finally {
      setRoomsLoading(false);
    }
  }, [buildingId, resolvePermissionError, selectedFloorId]);

  useEffect(() => {
    loadBuilding();
    loadFloors();
  }, [loadBuilding, loadFloors]);

  useEffect(() => {
    if (!selectedFloorId && floors.length > 0) {
      setSelectedFloorId(floors[0].id);
    }
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (!selectedFloorId) return;
    const exists = floors.some((floor) => floor.id === selectedFloorId);
    if (!exists) {
      setSelectedFloorId(floors[0]?.id || "");
    }
  }, [floors, selectedFloorId]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const handleSelectFloor = useCallback((floor) => {
    setSelectedFloorId(floor?.id || "");
  }, []);

  const handleOpenRoomSchedule = useCallback(
    (roomId) => {
      if (!buildingId || !selectedFloorId || !roomId) return;
      navigate(
        `/admin/campus-buildings/${buildingId}/floors/${selectedFloorId}/rooms/${roomId}`
      );
    },
    [buildingId, navigate, selectedFloorId]
  );

  const handleOpenFloorModal = useCallback(() => {
    setEditingFloor(null);
    setFloorFormError("");
    setFloorModalOpen(true);
  }, []);

  const handleEditFloor = useCallback((event, floor) => {
    event.stopPropagation();
    setEditingFloor(floor);
    setFloorFormError("");
    setFloorModalOpen(true);
  }, []);

  const handleCloseFloorModal = useCallback(() => {
    if (floorSaving) return;
    setFloorModalOpen(false);
    setEditingFloor(null);
  }, [floorSaving]);

  const handleSubmitFloor = useCallback(
    async (values) => {
      if (!buildingId) return;
      setFloorSaving(true);
      setFloorFormError("");
      setActionError("");
      try {
        const payload = { ...values, buildingId };
        if (editingFloor?.id) {
          await updateFloor(buildingId, editingFloor.id, payload);
        } else {
          await createFloor(buildingId, payload);
        }
        await loadFloors();
        setFloorModalOpen(false);
        setEditingFloor(null);
      } catch (err) {
        const permissionMessage = resolvePermissionError(
          err,
          `buildings/${buildingId}/floors`
        );
        setFloorFormError(
          permissionMessage || getErrorMessage(err, "Failed to save floor.")
        );
      } finally {
        setFloorSaving(false);
      }
    },
    [buildingId, editingFloor, loadFloors, resolvePermissionError]
  );

  const handleOpenRoomModal = useCallback(() => {
    if (!selectedFloorId) return;
    setEditingRoom(null);
    setRoomFormError("");
    setRoomModalOpen(true);
  }, [selectedFloorId]);

  const handleEditRoom = useCallback((room) => {
    setEditingRoom(room);
    setRoomFormError("");
    setRoomModalOpen(true);
  }, []);

  const handleCloseRoomModal = useCallback(() => {
    if (roomSaving) return;
    setRoomModalOpen(false);
    setEditingRoom(null);
  }, [roomSaving]);

  const handleSubmitRoom = useCallback(
    async (values) => {
      if (!buildingId || !selectedFloorId) {
        setRoomFormError("Select a floor first.");
        return;
      }
      setRoomSaving(true);
      setRoomFormError("");
      setActionError("");
      try {
        const payload = {
          ...values,
          buildingId,
          floorId: selectedFloorId,
        };
        if (editingRoom?.id) {
          await updateRoom(buildingId, selectedFloorId, editingRoom.id, payload);
        } else {
          await createRoom(buildingId, selectedFloorId, payload);
        }
        await loadRooms();
        setRoomModalOpen(false);
        setEditingRoom(null);
      } catch (err) {
        const permissionMessage = resolvePermissionError(
          err,
          `buildings/${buildingId}/floors/${selectedFloorId}/rooms`
        );
        setRoomFormError(
          permissionMessage || getErrorMessage(err, "Failed to save room.")
        );
      } finally {
        setRoomSaving(false);
      }
    },
    [
      buildingId,
      editingRoom,
      loadRooms,
      selectedFloorId,
      resolvePermissionError,
    ]
  );

  const handleDeleteFloorPrompt = useCallback((event, floor) => {
    event.stopPropagation();
    setConfirmFloor({ open: true, floor });
  }, []);

  const handleCloseConfirmFloor = useCallback(() => {
    setConfirmFloor({ open: false, floor: null });
  }, []);

  const handleConfirmDeleteFloor = useCallback(async () => {
    if (!confirmFloor.floor?.id || !buildingId) return;
    setDeletingFloor(true);
    setActionError("");
    try {
      await deleteFloor(buildingId, confirmFloor.floor.id);
      await loadFloors();
      handleCloseConfirmFloor();
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}/floors/${confirmFloor.floor?.id || ""}`
      );
      setActionError(
        permissionMessage || getErrorMessage(err, "Failed to delete floor.")
      );
    } finally {
      setDeletingFloor(false);
    }
  }, [
    buildingId,
    confirmFloor.floor,
    handleCloseConfirmFloor,
    loadFloors,
    resolvePermissionError,
  ]);

  const handleDeleteRoomPrompt = useCallback((room) => {
    setConfirmRoom({ open: true, room });
  }, []);

  const handleCloseConfirmRoom = useCallback(() => {
    setConfirmRoom({ open: false, room: null });
  }, []);

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (!confirmRoom.room?.id || !buildingId || !selectedFloorId) return;
    setDeletingRoom(true);
    setActionError("");
    try {
      await deleteRoom(buildingId, selectedFloorId, confirmRoom.room.id);
      await loadRooms();
      handleCloseConfirmRoom();
    } catch (err) {
      const permissionMessage = resolvePermissionError(
        err,
        `buildings/${buildingId}/floors/${selectedFloorId}/rooms/${confirmRoom.room?.id || ""}`
      );
      setActionError(
        permissionMessage || getErrorMessage(err, "Failed to delete room.")
      );
    } finally {
      setDeletingRoom(false);
    }
  }, [
    buildingId,
    confirmRoom.room,
    handleCloseConfirmRoom,
    loadRooms,
    selectedFloorId,
    resolvePermissionError,
  ]);

  const roomCards = useMemo(
    () =>
      rooms.map((room) => (
        <Card
          key={room.id}
          className="min-h-[140px] rounded-xl shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <CardActionArea
            onClick={() => handleOpenRoomSchedule(room.id)}
            className="h-full"
          >
            <CardContent>
              <Typography
                variant="subtitle1"
                className="font-semibold text-slate-800"
              >
                {room.roomNumber || "Room"}
              </Typography>
              <Typography variant="body2" className="text-slate-500">
                {room.name || "Unnamed room"}
              </Typography>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Capacity: {room.capacity || "-"}
                </span>
                {room.type ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1">
                    {room.type}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </CardActionArea>
          <CardActions className="justify-end pt-0">
            <IconButton
              size="small"
              onClick={(event) => {
                event.stopPropagation();
                handleEditRoom(room);
              }}
            >
              <Edit fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              color="error"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteRoomPrompt(room);
              }}
            >
              <Delete fontSize="small" />
            </IconButton>
          </CardActions>
        </Card>
      )),
    [handleDeleteRoomPrompt, handleEditRoom, handleOpenRoomSchedule, rooms]
  );

  const breadcrumbs = useMemo(
    () => [
      { label: "Admin", to: "/admin/home" },
      { label: "Campus Buildings", to: "/admin/campus-buildings" },
      { label: building?.name || "Building" },
    ],
    [building?.name]
  );

  if (buildingLoading) {
    return <Loading label="Loading building..." />;
  }

  if (buildingError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Campus Buildings" />
        <ErrorState message={buildingError} />
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/admin/campus-buildings")}>
          Back to Buildings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title={building?.name || "Building"}
        breadcrumbs={breadcrumbs}
        action={
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/admin/campus-buildings")}
          >
            Back
          </Button>
        }
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography variant="h6" className="text-slate-800">
                Floors
              </Typography>
              <Typography variant="body2" className="text-slate-500">
                Select a floor to manage rooms.
              </Typography>
            </div>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleOpenFloorModal}
              disabled={!buildingId}
            >
              Add
            </Button>
          </div>

          <Divider className="my-4" />

          <div className="flex-1 overflow-hidden">
            {floorsLoading ? (
              <Loading label="Loading floors..." />
            ) : floorsError ? (
              <ErrorState message={floorsError} />
            ) : floors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No floors yet for this building.
              </div>
            ) : (
              <List dense className="max-h-[420px] overflow-y-auto pr-1">
                {floors.map((floor) => (
                  <ListItemButton
                    key={floor.id}
                    selected={floor.id === selectedFloorId}
                    onClick={() => handleSelectFloor(floor)}
                    className="rounded-xl"
                  >
                    <ListItemText
                      primary={`Floor ${floor.floorNumber}`}
                      secondary={floor.label || "No label"}
                    />
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(event) => handleEditFloor(event, floor)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      size="small"
                      color="error"
                      onClick={(event) => handleDeleteFloorPrompt(event, floor)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                ))}
              </List>
            )}
          </div>
        </div>

        <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <Typography variant="h6" className="text-slate-800">
                Rooms
              </Typography>
              <Typography variant="body2" className="text-slate-500">
                {selectedFloor
                  ? `Rooms inside Floor ${selectedFloor.floorNumber}.`
                  : "Select a floor to view rooms."}
              </Typography>
            </div>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={handleOpenRoomModal}
              disabled={!selectedFloorId}
            >
              Add
            </Button>
          </div>

          <Divider className="my-4" />

          {!selectedFloorId ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Choose a floor to see its rooms.
            </div>
          ) : roomsError ? (
            <ErrorState message={roomsError} />
          ) : roomsLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roomSkeletons.map((key) => (
                <div
                  key={key}
                  className="min-h-[140px] rounded-xl border border-slate-100 bg-white p-4"
                >
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                  <Skeleton
                    variant="rectangular"
                    height={20}
                    className="mt-3 rounded-md"
                  />
                </div>
              ))}
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No rooms yet for this floor.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {roomCards}
            </div>
          )}
        </div>
      </div>

      <FloorFormModal
        open={floorModalOpen}
        initialValues={editingFloor}
        existingFloors={floors}
        loading={floorSaving}
        error={floorFormError}
        onClose={handleCloseFloorModal}
        onSubmit={handleSubmitFloor}
      />

      <RoomFormModal
        open={roomModalOpen}
        initialValues={editingRoom}
        loading={roomSaving}
        error={roomFormError}
        onClose={handleCloseRoomModal}
        onSubmit={handleSubmitRoom}
      />

      <ConfirmDialog
        open={confirmFloor.open}
        title="Delete floor?"
        message="This will remove the floor and all rooms inside it."
        confirmLabel="Delete"
        loading={deletingFloor}
        onClose={handleCloseConfirmFloor}
        onConfirm={handleConfirmDeleteFloor}
      />

      <ConfirmDialog
        open={confirmRoom.open}
        title="Delete room?"
        message="This will remove the selected room."
        confirmLabel="Delete"
        loading={deletingRoom}
        onClose={handleCloseConfirmRoom}
        onConfirm={handleConfirmDeleteRoom}
      />
    </div>
  );
}

export default BuildingDetails;
