import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "@mui/material";
import PageHeader from "../../components/common/PageHeader";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import BuildingsList from "../../components/campusBuildings/BuildingsList";
import BuildingFormModal from "../../components/campusBuildings/BuildingFormModal";
import FloorsList from "../../components/campusBuildings/FloorsList";
import FloorFormModal from "../../components/campusBuildings/FloorFormModal";
import RoomsList from "../../components/campusBuildings/RoomsList";
import RoomFormModal from "../../components/campusBuildings/RoomFormModal";
import RoomSchedulePanel from "../../components/campusBuildings/RoomSchedulePanel";
import {
  createBuilding,
  createFloor,
  createRoom,
  deleteBuilding,
  deleteFloor,
  deleteRoom,
  generateSlots,
  generateDemoData,
  listOccupiedRoomIds,
  timeToMinutes,
  updateBuilding,
  updateFloor,
  updateRoom,
} from "../../services/campusBuildings.service";
import {
  listenBuildings,
  listenFloors,
  listenRooms,
} from "../../services/campus3dFirestore";
import { getErrorMessage } from "../../utils/errorHelpers";

function CampusBuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [buildingsError, setBuildingsError] = useState("");

  const [floors, setFloors] = useState([]);
  const [floorsLoading, setFloorsLoading] = useState(false);
  const [floorsError, setFloorsError] = useState("");

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [selectedFloorId, setSelectedFloorId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");

  const [availabilityFilter, setAvailabilityFilter] = useState({
    day: "MON",
    startTime: "09:00",
    endTime: "10:00",
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [availableRoomIds, setAvailableRoomIds] = useState(null);

  const [buildingSearch, setBuildingSearch] = useState("");
  const [actionError, setActionError] = useState("");

  const [buildingModalOpen, setBuildingModalOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState(null);
  const [buildingSaving, setBuildingSaving] = useState(false);
  const [buildingFormError, setBuildingFormError] = useState("");

  const [floorModalOpen, setFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorSaving, setFloorSaving] = useState(false);
  const [floorFormError, setFloorFormError] = useState("");

  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomSaving, setRoomSaving] = useState(false);
  const [roomFormError, setRoomFormError] = useState("");

  const [confirmBuilding, setConfirmBuilding] = useState({
    open: false,
    building: null,
  });
  const [confirmFloor, setConfirmFloor] = useState({
    open: false,
    floor: null,
    buildingId: "",
  });
  const [confirmRoom, setConfirmRoom] = useState({
    open: false,
    room: null,
    buildingId: "",
    floorId: "",
  });

  const [deletingBuilding, setDeletingBuilding] = useState(false);
  const [deletingFloor, setDeletingFloor] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Subscribe to buildings list once and keep it live.
  useEffect(() => {
    setBuildingsLoading(true);
    const unsubscribe = listenBuildings(
      (data) => {
        setBuildings(data);
        setBuildingsError("");
        setBuildingsLoading(false);
        console.log("[3D] buildings snapshot", data.length);
      },
      (error) => {
        setBuildingsError(getErrorMessage(error));
        setBuildingsLoading(false);
        console.error("[3D] buildings snapshot error", error);
      }
    );

    return () => unsubscribe();
  }, []);

  // Load floors whenever the selected building changes.
  useEffect(() => {
    if (!selectedBuildingId) {
      setFloors([]);
      setFloorsError("");
      setFloorsLoading(false);
      return;
    }

    setFloors([]);
    setFloorsLoading(true);
    const unsubscribe = listenFloors(
      selectedBuildingId,
      (data) => {
        setFloors(data);
        setFloorsError("");
        setFloorsLoading(false);
        console.log(
          "[3D] floors snapshot",
          selectedBuildingId,
          data.length
        );
      },
      (error) => {
        setFloorsError(getErrorMessage(error));
        setFloorsLoading(false);
        console.error("[3D] floors snapshot error", error);
      }
    );

    return () => unsubscribe();
  }, [selectedBuildingId]);

  // Load rooms whenever the selected floor changes.
  useEffect(() => {
    if (!selectedBuildingId || !selectedFloorId) {
      setRooms([]);
      setRoomsError("");
      setRoomsLoading(false);
      return;
    }

    setRooms([]);
    setRoomsLoading(true);
    const unsubscribe = listenRooms(
      selectedBuildingId,
      selectedFloorId,
      (data) => {
        setRooms(data);
        setRoomsError("");
        setRoomsLoading(false);
        console.log(
          "[3D] rooms snapshot",
          selectedFloorId,
          data.length
        );
      },
      (error) => {
        setRoomsError(getErrorMessage(error));
        setRoomsLoading(false);
        console.error("[3D] rooms snapshot error", error);
      }
    );

    return () => unsubscribe();
  }, [selectedBuildingId, selectedFloorId]);

  useEffect(() => {
    if (!selectedBuildingId) return;
    const stillExists = buildings.some(
      (building) => building.id === selectedBuildingId
    );
    if (!stillExists) {
      setSelectedBuildingId("");
      setSelectedFloorId("");
      setSelectedRoomId("");
    }
  }, [buildings, selectedBuildingId]);

  useEffect(() => {
    if (!selectedFloorId) return;
    const stillExists = floors.some((floor) => floor.id === selectedFloorId);
    if (!stillExists) {
      setSelectedFloorId("");
      setSelectedRoomId("");
    }
  }, [floors, selectedFloorId]);

  useEffect(() => {
    if (!selectedRoomId) return;
    const stillExists = rooms.some((room) => room.id === selectedRoomId);
    if (!stillExists) {
      setSelectedRoomId("");
    }
  }, [rooms, selectedRoomId]);

  useEffect(() => {
    setAvailableRoomIds(null);
    setAvailabilityError("");
  }, [selectedBuildingId, selectedFloorId]);

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId]
  );

  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId) || null,
    [floors, selectedFloorId]
  );

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const normalizedSearch = useMemo(
    () => buildingSearch.trim().toLowerCase(),
    [buildingSearch]
  );

  const filteredBuildings = useMemo(() => {
    if (!normalizedSearch) return buildings;
    return buildings.filter((building) => {
      const name = String(building?.name || "").toLowerCase();
      const code = String(building?.code || "").toLowerCase();
      return name.includes(normalizedSearch) || code.includes(normalizedSearch);
    });
  }, [buildings, normalizedSearch]);

  const handleSearchChange = useCallback((value) => {
    setBuildingSearch(value);
  }, []);

  const handleSelectBuildingId = useCallback((buildingId) => {
    setSelectedBuildingId(buildingId || "");
    setSelectedFloorId("");
    setSelectedRoomId("");
    setActionError("");
  }, []);

  const handleSelectBuilding = useCallback(
    (building) => {
      handleSelectBuildingId(building?.id || "");
    },
    [handleSelectBuildingId]
  );

  const handleSelectFloorId = useCallback((floorId) => {
    setSelectedFloorId(floorId || "");
    setSelectedRoomId("");
    setActionError("");
  }, []);

  const handleSelectFloor = useCallback(
    (floor) => {
      handleSelectFloorId(floor?.id || "");
    },
    [handleSelectFloorId]
  );

  const handleSelectRoomId = useCallback((roomId) => {
    setSelectedRoomId(roomId || "");
  }, []);

  const handleSelectRoom = useCallback(
    (room) => {
      handleSelectRoomId(room?.id || "");
    },
    [handleSelectRoomId]
  );

  const handleAvailabilityDayChange = useCallback((day) => {
    setAvailabilityFilter((prev) => ({ ...prev, day }));
    setAvailableRoomIds(null);
    setAvailabilityError("");
  }, []);

  const handleAvailabilityStartChange = useCallback((startTime) => {
    setAvailabilityFilter((prev) => ({ ...prev, startTime }));
    setAvailableRoomIds(null);
    setAvailabilityError("");
  }, []);

  const handleAvailabilityEndChange = useCallback((endTime) => {
    setAvailabilityFilter((prev) => ({ ...prev, endTime }));
    setAvailableRoomIds(null);
    setAvailabilityError("");
  }, []);

  const handleClearAvailability = useCallback(() => {
    setAvailableRoomIds(null);
    setAvailabilityError("");
  }, []);

  const handleCheckAvailability = useCallback(async () => {
    if (!selectedBuildingId || !selectedFloorId) {
      setAvailabilityError("Select a building and floor first.");
      return;
    }
    setAvailabilityLoading(true);
    setAvailabilityError("");

    try {
      const startMin = timeToMinutes(availabilityFilter.startTime);
      const endMin = timeToMinutes(availabilityFilter.endTime);

      if (!Number.isFinite(startMin) || !Number.isFinite(endMin)) {
        throw new Error("Select a valid start and end time.");
      }
      if (startMin >= endMin) {
        throw new Error("Start time must be before end time.");
      }
      if (startMin % 30 !== 0 || endMin % 30 !== 0) {
        throw new Error("Times must align with 30-minute steps.");
      }

      const requestedSlots = generateSlots(
        availabilityFilter.day,
        startMin,
        endMin,
        30
      );
      if (requestedSlots.length === 0) {
        throw new Error("Select a valid time range.");
      }
      if (requestedSlots.length > 10) {
        throw new Error("Please select up to 5 hours (10 slots).");
      }

      const occupiedRoomIds = await listOccupiedRoomIds(
        selectedBuildingId,
        selectedFloorId,
        requestedSlots
      );
      const occupiedSet = new Set(occupiedRoomIds);
      const availableSet = new Set(
        rooms.filter((room) => !occupiedSet.has(room.id)).map((room) => room.id)
      );
      setAvailableRoomIds(availableSet);
    } catch (error) {
      setAvailableRoomIds(null);
      setAvailabilityError(getErrorMessage(error, "Failed to check availability."));
    } finally {
      setAvailabilityLoading(false);
    }
  }, [
    availabilityFilter.day,
    availabilityFilter.endTime,
    availabilityFilter.startTime,
    rooms,
    selectedBuildingId,
    selectedFloorId,
  ]);

  const handleOpenBuildingModal = useCallback(() => {
    setEditingBuilding(null);
    setBuildingFormError("");
    setBuildingModalOpen(true);
  }, []);

  const handleEditBuilding = useCallback((building) => {
    setEditingBuilding(building);
    setBuildingFormError("");
    setBuildingModalOpen(true);
  }, []);

  const handleCloseBuildingModal = useCallback(() => {
    setBuildingModalOpen(false);
    setEditingBuilding(null);
  }, []);

  const handleSubmitBuilding = useCallback(
    async (values) => {
      setBuildingSaving(true);
      setBuildingFormError("");
      setActionError("");
      try {
        if (editingBuilding?.id) {
          await updateBuilding(editingBuilding.id, values);
        } else {
          await createBuilding({
            ...values,
            floorsCount: 4,
            roomsPerFloor: 13,
          });
        }
        setBuildingModalOpen(false);
        setEditingBuilding(null);
      } catch (error) {
        setBuildingFormError(getErrorMessage(error));
      } finally {
        setBuildingSaving(false);
      }
    },
    [buildings.length, editingBuilding]
  );

  const handleOpenFloorModal = useCallback(() => {
    if (!selectedBuildingId) return;
    setEditingFloor(null);
    setFloorFormError("");
    setFloorModalOpen(true);
  }, [selectedBuildingId]);

  const handleEditFloor = useCallback((floor) => {
    setEditingFloor(floor);
    setFloorFormError("");
    setFloorModalOpen(true);
  }, []);

  const handleCloseFloorModal = useCallback(() => {
    setFloorModalOpen(false);
    setEditingFloor(null);
  }, []);

  const handleSubmitFloor = useCallback(
    async (values) => {
      if (!selectedBuildingId) {
        setFloorFormError("Select a building first.");
        return;
      }
      setFloorSaving(true);
      setFloorFormError("");
      setActionError("");
      try {
        const heightPerFloor =
          selectedBuilding?.size3d?.heightPerFloor || 3;
        const heightOffset = (values.floorNumber - 1) * heightPerFloor;
        const payload = { ...values, buildingId: selectedBuildingId };
        if (editingFloor?.id) {
          await updateFloor(selectedBuildingId, editingFloor.id, {
            ...payload,
            heightOffset,
          });
        } else {
          await createFloor(selectedBuildingId, {
            ...payload,
            heightOffset,
            heightPerFloor,
          });
        }
        setFloorModalOpen(false);
        setEditingFloor(null);
      } catch (error) {
        setFloorFormError(getErrorMessage(error));
      } finally {
        setFloorSaving(false);
      }
    },
    [editingFloor, selectedBuilding, selectedBuildingId]
  );

  const handleOpenRoomModal = useCallback(() => {
    if (!selectedBuildingId || !selectedFloorId) return;
    setEditingRoom(null);
    setRoomFormError("");
    setRoomModalOpen(true);
  }, [selectedBuildingId, selectedFloorId]);

  const handleEditRoom = useCallback((room) => {
    setEditingRoom(room);
    setRoomFormError("");
    setRoomModalOpen(true);
  }, []);

  const handleCloseRoomModal = useCallback(() => {
    setRoomModalOpen(false);
    setEditingRoom(null);
  }, []);

  const handleSubmitRoom = useCallback(
    async (values) => {
      if (!selectedBuildingId || !selectedFloorId) {
        setRoomFormError("Select a building and floor first.");
        return;
      }
      setRoomSaving(true);
      setRoomFormError("");
      setActionError("");
      try {
        const heightPerFloor =
          selectedBuilding?.size3d?.heightPerFloor || 3;
        const floorNumber = selectedFloor?.floorNumber || 1;
        const heightOffset = (floorNumber - 1) * heightPerFloor;
        const existingGrid = editingRoom?.gridPos;
        const existingPosition = editingRoom?.localPosition3d;
        const existingSize = editingRoom?.size3d;
        const index = rooms.length;
        const col =
          typeof existingGrid?.col === "number" ? existingGrid.col : index % 4;
        const row =
          typeof existingGrid?.row === "number"
            ? existingGrid.row
            : Math.floor(index / 4);
        const cellSize = 2.6;
        const gap = 0.3;
        const x =
          typeof existingPosition?.x === "number"
            ? existingPosition.x
            : (col - 1.5) * (cellSize + gap);
        const z =
          typeof existingPosition?.z === "number"
            ? existingPosition.z
            : (row - 1.5) * (cellSize + gap);
        const y =
          typeof existingPosition?.y === "number"
            ? existingPosition.y
            : heightOffset + 0.5;
        const payload = {
          ...values,
          buildingId: selectedBuildingId,
          floorId: selectedFloorId,
          gridIndex: index,
          gridPos: { col, row },
          localPosition3d: { x, y, z },
          size3d:
            existingSize &&
            typeof existingSize.width === "number" &&
            typeof existingSize.height === "number" &&
            typeof existingSize.depth === "number"
              ? existingSize
              : { width: 2.6, height: 1, depth: 2.6 },
          heightOffset,
        };
        if (editingRoom?.id) {
          await updateRoom(
            selectedBuildingId,
            selectedFloorId,
            editingRoom.id,
            payload
          );
        } else {
          await createRoom(selectedBuildingId, selectedFloorId, payload);
        }
        setRoomModalOpen(false);
        setEditingRoom(null);
      } catch (error) {
        setRoomFormError(getErrorMessage(error));
      } finally {
        setRoomSaving(false);
      }
    },
    [
      editingRoom,
      rooms.length,
      selectedBuilding,
      selectedBuildingId,
      selectedFloor,
      selectedFloorId,
    ]
  );

  const handleDeleteBuildingPrompt = useCallback((building) => {
    setConfirmBuilding({ open: true, building });
  }, []);

  const handleDeleteFloorPrompt = useCallback(
    (floor) => {
      setConfirmFloor({ open: true, floor, buildingId: selectedBuildingId });
    },
    [selectedBuildingId]
  );

  const handleDeleteRoomPrompt = useCallback(
    (room) => {
      setConfirmRoom({
        open: true,
        room,
        buildingId: selectedBuildingId,
        floorId: selectedFloorId,
      });
    },
    [selectedBuildingId, selectedFloorId]
  );

  const handleCloseConfirmBuilding = useCallback(() => {
    setConfirmBuilding({ open: false, building: null });
  }, []);

  const handleCloseConfirmFloor = useCallback(() => {
    setConfirmFloor({ open: false, floor: null, buildingId: "" });
  }, []);

  const handleCloseConfirmRoom = useCallback(() => {
    setConfirmRoom({ open: false, room: null, buildingId: "", floorId: "" });
  }, []);

  const handleConfirmDeleteBuilding = useCallback(async () => {
    if (!confirmBuilding.building?.id) return;
    setDeletingBuilding(true);
    setActionError("");
    try {
      await deleteBuilding(confirmBuilding.building.id);
      handleCloseConfirmBuilding();
      if (confirmBuilding.building.id === selectedBuildingId) {
        setSelectedBuildingId("");
        setSelectedFloorId("");
        setSelectedRoomId("");
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingBuilding(false);
    }
  }, [confirmBuilding.building, handleCloseConfirmBuilding, selectedBuildingId]);

  const handleConfirmDeleteFloor = useCallback(async () => {
    if (!confirmFloor.floor?.id || !confirmFloor.buildingId) return;
    setDeletingFloor(true);
    setActionError("");
    try {
      await deleteFloor(confirmFloor.buildingId, confirmFloor.floor.id);
      handleCloseConfirmFloor();
      if (confirmFloor.floor.id === selectedFloorId) {
        setSelectedFloorId("");
        setSelectedRoomId("");
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingFloor(false);
    }
  }, [
    confirmFloor.buildingId,
    confirmFloor.floor,
    handleCloseConfirmFloor,
    selectedFloorId,
  ]);

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (
      !confirmRoom.room?.id ||
      !confirmRoom.buildingId ||
      !confirmRoom.floorId
    )
      return;
    setDeletingRoom(true);
    setActionError("");
    try {
      await deleteRoom(
        confirmRoom.buildingId,
        confirmRoom.floorId,
        confirmRoom.room.id
      );
      handleCloseConfirmRoom();
      if (confirmRoom.room.id === selectedRoomId) {
        setSelectedRoomId("");
      }
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDeletingRoom(false);
    }
  }, [
    confirmRoom.buildingId,
    confirmRoom.floorId,
    confirmRoom.room,
    handleCloseConfirmRoom,
    selectedRoomId,
  ]);

  const handleGenerateDemo = useCallback(async () => {
    if (!selectedBuildingId) return;
    setDemoLoading(true);
    setActionError("");
    try {
      await generateDemoData(selectedBuildingId);
    } catch (error) {
      setActionError(getErrorMessage(error));
    } finally {
      setDemoLoading(false);
    }
  }, [selectedBuildingId]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Campus Buildings"
        breadcrumbs={[
          { label: "Admin", to: "/admin/home" },
          { label: "Campus Buildings" },
        ]}
      />

      {actionError ? <Alert severity="error">{actionError}</Alert> : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <BuildingsList
          buildings={filteredBuildings}
          loading={buildingsLoading}
          error={buildingsError}
          search={buildingSearch}
          selectedId={selectedBuildingId}
          onSearchChange={handleSearchChange}
          onSelect={handleSelectBuilding}
          onAdd={handleOpenBuildingModal}
          onEdit={handleEditBuilding}
          onDelete={handleDeleteBuildingPrompt}
        />

        <FloorsList
          floors={floors}
          loading={floorsLoading}
          error={floorsError}
          selectedBuilding={selectedBuilding}
          selectedFloorId={selectedFloorId}
          demoLoading={demoLoading}
          onSelect={handleSelectFloor}
          onAdd={handleOpenFloorModal}
          onEdit={handleEditFloor}
          onDelete={handleDeleteFloorPrompt}
          onGenerateDemo={handleGenerateDemo}
        />

        <RoomsList
          rooms={rooms}
          loading={roomsLoading}
          error={roomsError}
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          selectedRoomId={selectedRoomId}
          availabilityFilter={availabilityFilter}
          availabilityLoading={availabilityLoading}
          availabilityError={availabilityError}
          availableRoomIds={availableRoomIds}
          onAvailabilityDayChange={handleAvailabilityDayChange}
          onAvailabilityStartChange={handleAvailabilityStartChange}
          onAvailabilityEndChange={handleAvailabilityEndChange}
          onCheckAvailability={handleCheckAvailability}
          onClearAvailability={handleClearAvailability}
          onSelect={handleSelectRoom}
          onAdd={handleOpenRoomModal}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoomPrompt}
        />

        <RoomSchedulePanel
          selectedBuilding={selectedBuilding}
          selectedFloor={selectedFloor}
          selectedRoom={selectedRoom}
        />
      </div>

      <BuildingFormModal
        open={buildingModalOpen}
        initialValues={editingBuilding}
        existingBuildings={buildings}
        loading={buildingSaving}
        error={buildingFormError}
        onClose={handleCloseBuildingModal}
        onSubmit={handleSubmitBuilding}
      />

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
        open={confirmBuilding.open}
        title="Delete building?"
        message="This will remove the building, its floors, and all rooms."
        confirmLabel="Delete"
        loading={deletingBuilding}
        onClose={handleCloseConfirmBuilding}
        onConfirm={handleConfirmDeleteBuilding}
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

export default CampusBuildingsPage;
