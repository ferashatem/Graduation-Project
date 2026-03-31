import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Button,
  CircularProgress,
  IconButton,
  Snackbar,
  Typography,
} from "@mui/material";
import { Add, ArrowBack, Delete, Edit, ExpandMore } from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import FloorFormModal from "../../components/campusBuildings/FloorFormModal";
import RoomFormModal from "../../components/campusBuildings/RoomFormModal";
import {
  createCampusFloor,
  createCampusRoom,
  deleteCampusFloor,
  deleteCampusRoom,
  getCampusBuildingById,
  getCampusFloors,
  getCampusRooms,
  updateCampusFloor,
  updateCampusRoom,
} from "../../services/campusBuildingsAdmin.service";
import { getErrorMessage } from "../../utils/errorHelpers";

function BuildingDetails() {
  const { buildingId } = useParams();
  const navigate = useNavigate();

  // Building
  const [building, setBuilding] = useState(null);
  const [buildingLoading, setBuildingLoading] = useState(true);
  const [buildingError, setBuildingError] = useState("");

  // Floors
  const [floors, setFloors] = useState([]);
  const [floorsLoading, setFloorsLoading] = useState(true);
  const [floorsError, setFloorsError] = useState("");

  // Accordion expand state
  const [expandedFloorIds, setExpandedFloorIds] = useState(new Set());

  // Rooms per floor (lazy loaded)
  const [roomsByFloorId, setRoomsByFloorId] = useState({});
  const [roomsLoadingById, setRoomsLoadingById] = useState({});
  const [roomsErrorById, setRoomsErrorById] = useState({});
  // Refs to avoid stale-closure races in async loads
  const loadingRef = useRef(new Set());
  const loadedRef = useRef(new Set());

  // Floor modal
  const [floorModal, setFloorModal] = useState({ open: false, editing: null });
  const [floorSaving, setFloorSaving] = useState(false);
  const [floorFormError, setFloorFormError] = useState("");

  // Room modal
  const [roomModal, setRoomModal] = useState({ open: false, editing: null, floorId: null });
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomFormError, setRoomFormError] = useState("");

  // Confirm dialogs
  const [confirmFloor, setConfirmFloor] = useState({ open: false, floor: null });
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [confirmRoom, setConfirmRoom] = useState({ open: false, room: null, floorId: null });
  const [deletingRoom, setDeletingRoom] = useState(false);

  // Toast
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });
  const showToast = useCallback((message, severity = "success") => {
    setToast({ open: true, message, severity });
  }, []);
  const hideToast = useCallback(() => {
    setToast((t) => ({ ...t, open: false }));
  }, []);

  // ── Load building ────────────────────────────────────────────────────────────
  const loadBuilding = useCallback(async () => {
    if (!buildingId) return;
    setBuildingLoading(true);
    setBuildingError("");
    try {
      const data = await getCampusBuildingById(buildingId);
      if (!data) setBuildingError("Building not found.");
      else setBuilding(data);
    } catch (err) {
      setBuildingError(getErrorMessage(err, "Failed to load building."));
    } finally {
      setBuildingLoading(false);
    }
  }, [buildingId]);

  // ── Load floors ──────────────────────────────────────────────────────────────
  const loadFloors = useCallback(async () => {
    if (!buildingId) return;
    setFloorsLoading(true);
    setFloorsError("");
    try {
      const data = await getCampusFloors(buildingId);
      setFloors(data);
    } catch (err) {
      setFloorsError(getErrorMessage(err, "Failed to load floors."));
    } finally {
      setFloorsLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    loadBuilding();
    loadFloors();
  }, [loadBuilding, loadFloors]);

  // ── Load rooms for one floor (lazy, deduplicated) ────────────────────────────
  const loadRoomsForFloor = useCallback(
    async (floorId) => {
      if (!buildingId || !floorId) return;
      if (loadedRef.current.has(floorId) || loadingRef.current.has(floorId)) return;

      loadingRef.current.add(floorId);
      setRoomsLoadingById((prev) => ({ ...prev, [floorId]: true }));
      setRoomsErrorById((prev) => ({ ...prev, [floorId]: "" }));
      try {
        const rooms = await getCampusRooms(buildingId, floorId);
        loadedRef.current.add(floorId);
        setRoomsByFloorId((prev) => ({ ...prev, [floorId]: rooms }));
      } catch (err) {
        setRoomsErrorById((prev) => ({
          ...prev,
          [floorId]: getErrorMessage(err, "Failed to load rooms."),
        }));
      } finally {
        loadingRef.current.delete(floorId);
        setRoomsLoadingById((prev) => ({ ...prev, [floorId]: false }));
      }
    },
    [buildingId]
  );

  // Force-refresh rooms for a floor after a mutation
  const refreshRoomsForFloor = useCallback(
    async (floorId) => {
      loadedRef.current.delete(floorId);
      loadingRef.current.delete(floorId);
      await loadRoomsForFloor(floorId);
    },
    [loadRoomsForFloor]
  );

  // ── Accordion toggle ─────────────────────────────────────────────────────────
  const handleToggleFloor = useCallback(
    (floorId) => {
      const expanding = !expandedFloorIds.has(floorId);
      setExpandedFloorIds((prev) => {
        const next = new Set(prev);
        if (next.has(floorId)) next.delete(floorId);
        else next.add(floorId);
        return next;
      });
      if (expanding) loadRoomsForFloor(floorId);
    },
    [expandedFloorIds, loadRoomsForFloor]
  );

  // ── Floor CRUD ───────────────────────────────────────────────────────────────
  const handleOpenAddFloor = useCallback(() => {
    setFloorFormError("");
    setFloorModal({ open: true, editing: null });
  }, []);

  const handleOpenEditFloor = useCallback((floor, e) => {
    e.stopPropagation();
    setFloorFormError("");
    setFloorModal({ open: true, editing: floor });
  }, []);

  const handleCloseFloorModal = useCallback(() => {
    if (floorSaving) return;
    setFloorModal({ open: false, editing: null });
  }, [floorSaving]);

  const handleSubmitFloor = useCallback(
    async (values) => {
      if (!buildingId) return;
      setFloorSaving(true);
      setFloorFormError("");
      try {
        if (floorModal.editing?.id) {
          await updateCampusFloor(buildingId, floorModal.editing.id, values);
          showToast("Floor updated.");
        } else {
          await createCampusFloor(buildingId, values);
          showToast("Floor added.");
        }
        await loadFloors();
        setFloorModal({ open: false, editing: null });
      } catch (err) {
        setFloorFormError(getErrorMessage(err, "Failed to save floor."));
      } finally {
        setFloorSaving(false);
      }
    },
    [buildingId, floorModal.editing, loadFloors, showToast]
  );

  const handleDeleteFloorPrompt = useCallback((floor, e) => {
    e.stopPropagation();
    setConfirmFloor({ open: true, floor });
  }, []);

  const handleConfirmDeleteFloor = useCallback(async () => {
    const floorId = confirmFloor.floor?.id;
    if (!floorId) return;
    setDeletingFloor(true);
    try {
      await deleteCampusFloor(buildingId, floorId);
      showToast("Floor deleted.");
      // Clean up room state for deleted floor
      loadedRef.current.delete(floorId);
      setRoomsByFloorId((prev) => { const n = { ...prev }; delete n[floorId]; return n; });
      setExpandedFloorIds((prev) => { const n = new Set(prev); n.delete(floorId); return n; });
      await loadFloors();
      setConfirmFloor({ open: false, floor: null });
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete floor."), "error");
    } finally {
      setDeletingFloor(false);
    }
  }, [buildingId, confirmFloor.floor, loadFloors, showToast]);

  // ── Room CRUD ────────────────────────────────────────────────────────────────
  const handleOpenAddRoom = useCallback((floorId) => {
    setRoomFormError("");
    setRoomModal({ open: true, editing: null, floorId });
  }, []);

  const handleOpenEditRoom = useCallback((room, floorId) => {
    setRoomFormError("");
    setRoomModal({ open: true, editing: room, floorId });
  }, []);

  const handleCloseRoomModal = useCallback(() => {
    if (roomSaving) return;
    setRoomModal({ open: false, editing: null, floorId: null });
  }, [roomSaving]);

  const handleSubmitRoom = useCallback(
    async (values) => {
      const { floorId, editing } = roomModal;
      if (!buildingId || !floorId) return;
      setRoomSaving(true);
      setRoomFormError("");
      try {
        const floorNumber =
          floors.find((f) => f.id === floorId)?.floorNumber || 0;
        if (editing?.id) {
          await updateCampusRoom(buildingId, floorId, editing.id, values);
          showToast("Room updated.");
        } else {
          await createCampusRoom(buildingId, floorId, { ...values, floorNumber });
          showToast("Room added.");
        }
        await refreshRoomsForFloor(floorId);
        setRoomModal({ open: false, editing: null, floorId: null });
      } catch (err) {
        setRoomFormError(getErrorMessage(err, "Failed to save room."));
      } finally {
        setRoomSaving(false);
      }
    },
    [buildingId, roomModal, floors, refreshRoomsForFloor, showToast]
  );

  const handleDeleteRoomPrompt = useCallback((room, floorId) => {
    setConfirmRoom({ open: true, room, floorId });
  }, []);

  const handleConfirmDeleteRoom = useCallback(async () => {
    const { room, floorId } = confirmRoom;
    if (!room?.id || !floorId) return;
    setDeletingRoom(true);
    try {
      await deleteCampusRoom(buildingId, floorId, room.id);
      showToast("Room deleted.");
      await refreshRoomsForFloor(floorId);
      setConfirmRoom({ open: false, room: null, floorId: null });
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to delete room."), "error");
    } finally {
      setDeletingRoom(false);
    }
  }, [buildingId, confirmRoom, refreshRoomsForFloor, showToast]);

  const breadcrumbs = useMemo(
    () => [
      { label: "Admin", to: "/admin/home" },
      { label: "Campus Buildings", to: "/admin/campus-buildings" },
      { label: building?.name || "Building" },
    ],
    [building?.name]
  );

  if (buildingLoading) return <Loading label="Loading building..." />;

  if (buildingError) {
    return (
      <div className="space-y-4">
        <PageHeader title="Campus Buildings" />
        <ErrorState message={buildingError} />
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/admin/campus-buildings")}
        >
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
          <div className="flex gap-2">
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={() => navigate("/admin/campus-buildings")}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenAddFloor}
            >
              Add Floor
            </Button>
          </div>
        }
      />

      {building?.code && (
        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-200">
          <Typography variant="body2" className="text-slate-500">
            Code: <span className="font-medium text-slate-700">{building.code}</span>
          </Typography>
        </div>
      )}

      {floorsLoading ? (
        <Loading label="Loading floors..." />
      ) : floorsError ? (
        <ErrorState message={floorsError} onRetry={loadFloors} />
      ) : floors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No floors yet. Click "Add Floor" to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {floors.map((floor) => {
            const isExpanded = expandedFloorIds.has(floor.id);
            const rooms = roomsByFloorId[floor.id] || [];
            const roomsLoading = roomsLoadingById[floor.id] || false;
            const roomsError = roomsErrorById[floor.id] || "";

            return (
              <div
                key={floor.id}
                className="overflow-hidden rounded-2xl shadow-sm ring-1 ring-slate-200"
              >
                <Accordion
                  expanded={isExpanded}
                  onChange={() => handleToggleFloor(floor.id)}
                  elevation={0}
                  disableGutters
                  sx={{ "&:before": { display: "none" } }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMore />}
                    sx={{ px: 2, minHeight: 56 }}
                  >
                    <div className="flex flex-1 items-center justify-between gap-3 pr-2">
                      <div>
                        <Typography
                          variant="subtitle1"
                          className="font-semibold text-slate-800"
                        >
                          Floor {floor.floorNumber}
                        </Typography>
                        {floor.label ? (
                          <Typography variant="body2" className="text-slate-500">
                            {floor.label}
                          </Typography>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1">
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenEditFloor(floor, e)}
                          title="Edit floor"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={(e) => handleDeleteFloorPrompt(floor, e)}
                          title="Delete floor"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </div>
                    </div>
                  </AccordionSummary>

                  <AccordionDetails
                    sx={{ borderTop: "1px solid #f1f5f9", bgcolor: "#f8fafc", p: 2 }}
                  >
                    {roomsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <CircularProgress size={16} />
                        <span>Loading rooms...</span>
                      </div>
                    ) : roomsError ? (
                      <Alert severity="error" className="mb-3">
                        {roomsError}
                      </Alert>
                    ) : rooms.length === 0 ? (
                      <p className="mb-3 text-sm text-slate-500">
                        No rooms yet for this floor.
                      </p>
                    ) : (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {rooms.map((room) => (
                          <div
                            key={room.id}
                            className="flex items-center gap-1 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200"
                          >
                            <span className="text-sm font-medium text-slate-700">
                              Room {room.roomNumber}
                            </span>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditRoom(room, floor.id)}
                              title="Edit room"
                            >
                              <Edit sx={{ fontSize: 14 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRoomPrompt(room, floor.id)}
                              title="Delete room"
                            >
                              <Delete sx={{ fontSize: 14 }} />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Add />}
                      onClick={() => handleOpenAddRoom(floor.id)}
                    >
                      Add Room
                    </Button>
                  </AccordionDetails>
                </Accordion>
              </div>
            );
          })}
        </div>
      )}

      {/* Floor modal */}
      <FloorFormModal
        open={floorModal.open}
        initialValues={floorModal.editing}
        existingFloors={floors}
        loading={floorSaving}
        error={floorFormError}
        onClose={handleCloseFloorModal}
        onSubmit={handleSubmitFloor}
      />

      {/* Room modal */}
      <RoomFormModal
        open={roomModal.open}
        initialValues={roomModal.editing}
        loading={roomSaving}
        error={roomFormError}
        onClose={handleCloseRoomModal}
        onSubmit={handleSubmitRoom}
      />

      {/* Confirm delete floor */}
      <ConfirmDialog
        open={confirmFloor.open}
        title="Delete floor?"
        message={`This will permanently delete Floor ${confirmFloor.floor?.floorNumber} and all its rooms.`}
        confirmLabel="Delete"
        loading={deletingFloor}
        onClose={() => setConfirmFloor({ open: false, floor: null })}
        onConfirm={handleConfirmDeleteFloor}
      />

      {/* Confirm delete room */}
      <ConfirmDialog
        open={confirmRoom.open}
        title="Delete room?"
        message={`This will permanently delete Room ${confirmRoom.room?.roomNumber}.`}
        confirmLabel="Delete"
        loading={deletingRoom}
        onClose={() => setConfirmRoom({ open: false, room: null, floorId: null })}
        onConfirm={handleConfirmDeleteRoom}
      />

      <Snackbar open={toast.open} autoHideDuration={3000} onClose={hideToast}>
        <Alert onClose={hideToast} severity={toast.severity} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default BuildingDetails;
