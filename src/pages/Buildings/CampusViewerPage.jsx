import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loading from "../../components/common/Loading";
import ErrorState from "../../components/common/ErrorState";
import FilterBar from "../../components/CampusViewer/FilterBar";
import CampusScene from "../../components/CampusViewer/CampusScene";
import UIPanels from "../../components/CampusViewer/UIPanels";
import {
  CAMPUS_DAY_KEYS,
  CAMPUS_DAY_OPTIONS_WITH_FRI,
  CAMPUS_DAY_KEYS_WITH_FRI,
  CAMPUS_SLOT_KEYS,
  CAMPUS_TIME_FILTERS,
  computeDayFullMap,
  computeRoomIsFullWeek,
  computeRoomStatusForFilter,
  normalizeScheduleDocs,
} from "../../utils/campusScheduleUtils";
import {
  fetchOrListenRoomSchedule,
  listenBuildings,
  listenRooms,
} from "../../firebase/firestoreCampusApi";
import { getErrorMessage } from "../../utils/errorHelpers";

const FLOOR_DEFS = [
  { key: "first", label: "First" },
  { key: "second", label: "Second" },
  { key: "third", label: "Third" },
  { key: "fourth", label: "Fourth" },
];

const normalizeFloorKey = (value) => {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "1" || raw === "first") return "first";
  if (raw === "2" || raw === "second") return "second";
  if (raw === "3" || raw === "third") return "third";
  if (raw === "4" || raw === "fourth") return "fourth";
  return raw;
};

const ROOM_GRID_COLUMNS = 6;
const ROOM_SPACING = 1.2;
const FLOOR_PADDING = 0.6;
const FLOOR_THICKNESS = 0.18;
const ROOM_HEIGHT = 0.35;

const buildRoomKey = (collegeId, buildingId, roomId) =>
  `${collegeId}/${buildingId}/${roomId}`;

function CampusViewerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const collegeId = useMemo(
    () => location.state?.collegeId || searchParams.get("collegeId") || "",
    [location.state, searchParams]
  );

  const [buildings, setBuildings] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(false);
  const [buildingsError, setBuildingsError] = useState("");

  const [roomsByBuilding, setRoomsByBuilding] = useState({});
  const [roomsError, setRoomsError] = useState("");

  const [scheduleError, setScheduleError] = useState("");

  const [activeBuildingId, setActiveBuildingId] = useState("");
  const [activeFloorKey, setActiveFloorKey] = useState("");
  const [activeRoomId, setActiveRoomId] = useState("");
  const [hoveredRoomKey, setHoveredRoomKey] = useState("");

  const [filterDay, setFilterDay] = useState("");
  const [filterSlot, setFilterSlot] = useState("full");

  const roomListenersRef = useRef(new Map());
  const scheduleListenersRef = useRef(new Map());
  const [scheduleMap, setScheduleMap] = useState(() => new Map());

  useEffect(() => {
    if (!collegeId) return;
    setBuildings([]);
    setRoomsByBuilding({});
    roomListenersRef.current.forEach((unsubscribe) => unsubscribe());
    roomListenersRef.current.clear();
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId) return;
    setBuildingsLoading(true);
    setBuildingsError("");
    const unsubscribe = listenBuildings(
      collegeId,
      (data) => {
        setBuildings(data);
        setBuildingsLoading(false);
      },
      (error) => {
        setBuildingsError(getErrorMessage(error));
        setBuildingsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [collegeId]);

  useEffect(() => {
    if (!collegeId) return;
    const activeIds = new Set(buildings.map((building) => building.id));

    roomListenersRef.current.forEach((unsubscribe, buildingId) => {
      if (activeIds.has(buildingId)) return;
      unsubscribe();
      roomListenersRef.current.delete(buildingId);
      setRoomsByBuilding((prev) => {
        const next = { ...prev };
        delete next[buildingId];
        return next;
      });
    });

    buildings.forEach((building) => {
      if (roomListenersRef.current.has(building.id)) return;
      const unsubscribe = listenRooms(
        collegeId,
        building.id,
        (rooms) => {
          setRoomsByBuilding((prev) => ({
            ...prev,
            [building.id]: rooms,
          }));
        },
        (error) => {
          setRoomsError(getErrorMessage(error));
        }
      );
      roomListenersRef.current.set(building.id, unsubscribe);
    });
  }, [buildings, collegeId]);

  useEffect(() => {
    return () => {
      roomListenersRef.current.forEach((unsubscribe) => unsubscribe());
      roomListenersRef.current.clear();
      scheduleListenersRef.current.forEach((unsubscribe) => unsubscribe());
      scheduleListenersRef.current.clear();
    };
  }, []);

  useEffect(() => {
    setScheduleMap(new Map());
    scheduleListenersRef.current.forEach((unsubscribe) => unsubscribe());
    scheduleListenersRef.current.clear();
  }, [collegeId]);

  const roomsByBuildingKeyed = useMemo(() => {
    const map = {};
    Object.entries(roomsByBuilding).forEach(([buildingId, rooms]) => {
      map[buildingId] = rooms.map((room) => ({
        ...room,
        _campusKey: buildRoomKey(collegeId, buildingId, room.id),
      }));
    });
    return map;
  }, [collegeId, roomsByBuilding]);

  const allRooms = useMemo(() => {
    return Object.values(roomsByBuildingKeyed).flat();
  }, [roomsByBuildingKeyed]);

  useEffect(() => {
    const activeKeys = new Set(allRooms.map((room) => room._campusKey));
    scheduleListenersRef.current.forEach((unsubscribe, key) => {
      if (activeKeys.has(key)) return;
      unsubscribe();
      scheduleListenersRef.current.delete(key);
      setScheduleMap((prev) => {
        const next = new Map(prev);
        next.delete(key);
        return next;
      });
    });
  }, [allRooms]);

  const layoutMap = useMemo(() => {
    // Precompute a grid layout so buildings remain stable in 3D space.
    const map = new Map();
    const gridColumns = 4;
    const spacing = 18;
    const totalRows = Math.ceil(buildings.length / gridColumns) || 1;
    const offsetX =
      ((Math.min(buildings.length, gridColumns) - 1) * spacing) / 2;
    const offsetZ = ((totalRows - 1) * spacing) / 2;

    buildings.forEach((building, index) => {
      const column = index % gridColumns;
      const row = Math.floor(index / gridColumns);
      const x = column * spacing - offsetX;
      const z = row * spacing - offsetZ;

      const buildingRooms = roomsByBuildingKeyed[building.id] || [];
      const maxRoomsPerFloor = Math.max(
        1,
        ...FLOOR_DEFS.map(
          (floor) =>
            buildingRooms.filter(
              (room) => normalizeFloorKey(room.floor) === floor.key
            ).length
        )
      );

      const rowsNeeded = Math.max(1, Math.ceil(maxRoomsPerFloor / ROOM_GRID_COLUMNS));
      const floorSize = {
        width: ROOM_GRID_COLUMNS * ROOM_SPACING + FLOOR_PADDING * 2,
        depth: rowsNeeded * ROOM_SPACING + FLOOR_PADDING * 2,
      };

      const height =
        (FLOOR_DEFS.length - 1) * 0.9 + FLOOR_THICKNESS + ROOM_HEIGHT;

      map.set(building.id, {
        position: [x, 0, z],
        floorSize,
        columns: ROOM_GRID_COLUMNS,
        height,
      });
    });

    return map;
  }, [buildings, roomsByBuildingKeyed]);

  const ensureSchedule = useCallback(
    (room) => {
      if (!room || !collegeId) return;
      const key = room._campusKey;
      if (!key || scheduleListenersRef.current.has(key)) return;

      // Lazy-load schedules per room and cache the normalized result.
      const unsubscribe = fetchOrListenRoomSchedule(
        collegeId,
        room.buildingId,
        room.id,
        {
          listen: true,
          onChange: (docs) => {
            const normalized = normalizeScheduleDocs(docs, {
              dayKeys: CAMPUS_DAY_KEYS,
              slotKeys: CAMPUS_SLOT_KEYS,
            });
            setScheduleMap((prev) => {
              const next = new Map(prev);
              next.set(key, normalized);
              return next;
            });
          },
          onError: (error) => {
            setScheduleError(getErrorMessage(error));
          },
        }
      );
      scheduleListenersRef.current.set(key, unsubscribe);
    },
    [collegeId]
  );

  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === activeBuildingId) || null,
    [activeBuildingId, buildings]
  );

  const selectedRoom = useMemo(() => {
    if (!activeBuildingId || !activeRoomId) return null;
    return (
      (roomsByBuildingKeyed[activeBuildingId] || []).find(
        (room) => room.id === activeRoomId
      ) || null
    );
  }, [activeBuildingId, activeRoomId, roomsByBuildingKeyed]);

  const activeRoomKey = useMemo(() => {
    if (!activeBuildingId || !activeRoomId) return "";
    return buildRoomKey(collegeId, activeBuildingId, activeRoomId);
  }, [activeBuildingId, activeRoomId, collegeId]);

  const filterActive = Boolean(filterDay);

  const includeFriday = useMemo(() => {
    if (filterDay === "fri") return true;
    for (const schedule of scheduleMap.values()) {
      if (schedule?.fri) return true;
    }
    return false;
  }, [filterDay, scheduleMap]);

  const dayOptions = CAMPUS_DAY_OPTIONS_WITH_FRI;
  const dayKeys = includeFriday ? CAMPUS_DAY_KEYS_WITH_FRI : CAMPUS_DAY_KEYS;

  const roomStatusMap = useMemo(() => {
    // Derive color + per-day fullness without doing work inside the render loop.
    const map = new Map();
    allRooms.forEach((room) => {
      const schedule = scheduleMap.get(room._campusKey);
      const dayFullMap = computeDayFullMap(schedule, dayKeys, CAMPUS_SLOT_KEYS);
      const isFullWeek = computeRoomIsFullWeek(schedule, dayKeys, CAMPUS_SLOT_KEYS);
      const isReserved = filterActive
        ? computeRoomStatusForFilter(
            schedule,
            filterDay,
            filterSlot,
            CAMPUS_SLOT_KEYS
          )
        : isFullWeek;
      map.set(room._campusKey, {
        color: isReserved ? "#f87171" : "#34d399",
        dayFullMap,
        isFullWeek,
      });
    });
    return map;
  }, [allRooms, dayKeys, filterActive, filterDay, filterSlot, scheduleMap]);

  const visibleRooms = useMemo(() => {
    if (activeRoomId && activeBuildingId) {
      const room =
        (roomsByBuildingKeyed[activeBuildingId] || []).find(
          (item) => item.id === activeRoomId
        ) || null;
      return room ? [room] : [];
    }
    if (activeBuildingId && activeFloorKey) {
      return (roomsByBuildingKeyed[activeBuildingId] || []).filter(
        (room) => normalizeFloorKey(room.floor) === activeFloorKey
      );
    }
    if (activeBuildingId) {
      return roomsByBuildingKeyed[activeBuildingId] || [];
    }
    return allRooms;
  }, [
    activeBuildingId,
    activeFloorKey,
    activeRoomId,
    allRooms,
    roomsByBuildingKeyed,
  ]);

  useEffect(() => {
    if (!filterActive) return;
    visibleRooms.forEach((room) => ensureSchedule(room));
  }, [ensureSchedule, filterActive, visibleRooms]);

  const handleSelectBuilding = useCallback((building) => {
    if (!building?.id) return;
    setActiveRoomId("");
    setActiveFloorKey("");
    setActiveBuildingId((prev) => (prev === building.id ? "" : building.id));
  }, []);

  const handleSelectFloor = useCallback((building, floorKey) => {
    if (!building?.id) return;
    setActiveBuildingId(building.id);
    setActiveRoomId("");
    setActiveFloorKey((prev) =>
      prev === floorKey && activeBuildingId === building.id ? "" : floorKey
    );
  }, [activeBuildingId]);

  const handleSelectRoom = useCallback(
    (building, floorKey, room) => {
      if (!building?.id || !room?.id) return;
      setActiveBuildingId(building.id);
      setActiveFloorKey(floorKey || "");
      setActiveRoomId(room.id);
      ensureSchedule(room);
    },
    [ensureSchedule]
  );

  const handleHoverRoom = useCallback(
    (room, isHovering) => {
      if (!room?._campusKey) return;
      setHoveredRoomKey(isHovering ? room._campusKey : "");
      if (isHovering) ensureSchedule(room);
    },
    [ensureSchedule]
  );

  const handleOpenSchedule = useCallback(() => {
    if (!selectedBuilding || !selectedRoom || !collegeId) return;
    navigate(
      `/buildings/${selectedBuilding.id}/rooms/${selectedRoom.id}?collegeId=${collegeId}`,
      {
        state: {
          collegeId,
          buildingName: selectedBuilding.name || "",
          roomName: selectedRoom.name || "",
        },
      }
    );
  }, [collegeId, navigate, selectedBuilding, selectedRoom]);

  const handleClearFilter = useCallback(() => {
    setFilterDay("");
    setFilterSlot("full");
  }, []);

  const cameraFocus = useMemo(() => {
    if (!activeBuildingId) return null;
    const layout = layoutMap.get(activeBuildingId);
    if (!layout) return null;
    const target = [
      layout.position[0],
      layout.height / 2,
      layout.position[2],
    ];
    const distance =
      Math.max(layout.floorSize.width, layout.floorSize.depth) * 1.4 + 8;
    return {
      target,
      position: [
        layout.position[0] + distance,
        layout.height + distance * 0.6,
        layout.position[2] + distance,
      ],
    };
  }, [activeBuildingId, layoutMap]);

  const breadcrumbs = useMemo(
    () => [{ label: "Buildings", to: "/buildings" }, { label: "3D Viewer" }],
    []
  );

  if (!collegeId) {
    return (
      <div className="space-y-4">
        <PageHeader title="3D Campus Viewer" breadcrumbs={breadcrumbs} />
        <Alert severity="warning">
          College context is missing. Please return to the buildings page.
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/buildings")}>
          Back to Buildings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="3D Campus Viewer" breadcrumbs={breadcrumbs} />

      <FilterBar
        dayOptions={dayOptions}
        timeOptions={CAMPUS_TIME_FILTERS}
        dayValue={filterDay}
        timeValue={filterSlot}
        onDayChange={setFilterDay}
        onTimeChange={setFilterSlot}
        onClear={handleClearFilter}
      />

      {buildingsError ? <ErrorState message={buildingsError} /> : null}
      {roomsError ? <ErrorState message={roomsError} /> : null}
      {scheduleError ? <ErrorState message={scheduleError} /> : null}

      {buildingsLoading && buildings.length === 0 ? (
        <Loading label="Loading campus..." />
      ) : buildings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          No buildings found for this college.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CampusScene
            buildings={buildings}
            roomsByBuilding={roomsByBuildingKeyed}
            layoutMap={layoutMap}
            activeBuildingId={activeBuildingId}
            activeFloorKey={activeFloorKey}
            activeRoomKey={activeRoomKey}
            hoveredRoomKey={hoveredRoomKey}
            roomStatusMap={roomStatusMap}
            onSelectBuilding={handleSelectBuilding}
            onSelectFloor={handleSelectFloor}
            onSelectRoom={handleSelectRoom}
            onHoverRoom={handleHoverRoom}
            dayOptions={dayOptions}
            cameraFocus={cameraFocus}
          />

          <UIPanels
            selectedBuilding={selectedBuilding}
            selectedRoom={selectedRoom}
            floorLabel={
              activeFloorKey
                ? FLOOR_DEFS.find((floor) => floor.key === activeFloorKey)
                    ?.label || activeFloorKey
                : ""
            }
            filterActive={filterActive}
            filterDay={filterDay}
            filterSlot={filterSlot}
            onOpenSchedule={handleOpenSchedule}
            onBackToFloor={() => setActiveRoomId("")}
            onBackToBuilding={() => setActiveFloorKey("")}
            onBackToCampus={() => setActiveBuildingId("")}
          />
        </div>
      )}
    </div>
  );
}

export default CampusViewerPage;
