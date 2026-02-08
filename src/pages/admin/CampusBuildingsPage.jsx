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
import {
  createBuilding,
  createFloor,
  createRoom,
  deleteBuilding,
  deleteFloor,
  deleteRoom,
  generateDemoData,
  subscribeBuildings,
  subscribeFloors,
  subscribeRooms,
  updateBuilding,
  updateFloor,
  updateRoom,
} from "../../services/campusBuildings.service";
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
    const unsubscribe = subscribeBuildings(
      (data) => {
        setBuildings(data);
        setBuildingsError("");
        setBuildingsLoading(false);
      },
      (error) => {
        setBuildingsError(getErrorMessage(error));
        setBuildingsLoading(false);
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
    const unsubscribe = subscribeFloors(
      selectedBuildingId,
      (data) => {
        setFloors(data);
        setFloorsError("");
        setFloorsLoading(false);
      },
      (error) => {
        setFloorsError(getErrorMessage(error));
        setFloorsLoading(false);
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
    const unsubscribe = subscribeRooms(
      selectedBuildingId,
      selectedFloorId,
      (data) => {
        setRooms(data);
        setRoomsError("");
        setRoomsLoading(false);
      },
      (error) => {
        setRoomsError(getErrorMessage(error));
        setRoomsLoading(false);
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

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId]
  );

  const selectedFloor = useMemo(
    () => floors.find((floor) => floor.id === selectedFloorId) || null,
    [floors, selectedFloorId]
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

  const handleSelectBuilding = useCallback((building) => {
    setSelectedBuildingId(building?.id || "");
    setSelectedFloorId("");
    setSelectedRoomId("");
    setActionError("");
  }, []);

  const handleSelectFloor = useCallback((floor) => {
    setSelectedFloorId(floor?.id || "");
    setSelectedRoomId("");
    setActionError("");
  }, []);

  const handleSelectRoom = useCallback((room) => {
    setSelectedRoomId(room?.id || "");
  }, []);

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
          await createBuilding(values);
        }
        setBuildingModalOpen(false);
        setEditingBuilding(null);
      } catch (error) {
        setBuildingFormError(getErrorMessage(error));
      } finally {
        setBuildingSaving(false);
      }
    },
    [editingBuilding]
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
        const payload = { ...values, buildingId: selectedBuildingId };
        if (editingFloor?.id) {
          await updateFloor(selectedBuildingId, editingFloor.id, payload);
        } else {
          await createFloor(selectedBuildingId, payload);
        }
        setFloorModalOpen(false);
        setEditingFloor(null);
      } catch (error) {
        setFloorFormError(getErrorMessage(error));
      } finally {
        setFloorSaving(false);
      }
    },
    [editingFloor, selectedBuildingId]
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
        const payload = {
          ...values,
          buildingId: selectedBuildingId,
          campusBuildingId: selectedBuildingId,
          floorId: selectedFloorId,
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
    [editingRoom, selectedBuildingId, selectedFloorId]
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

      <div className="grid gap-4 lg:grid-cols-3">
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
          onSelect={handleSelectRoom}
          onAdd={handleOpenRoomModal}
          onEdit={handleEditRoom}
          onDelete={handleDeleteRoomPrompt}
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
