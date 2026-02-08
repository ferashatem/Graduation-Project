import { useCallback, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isPositiveNumber = (value) => isNumber(value) && value > 0;

const FLOOR_THICKNESS = 0.2;
const ROOM_HEIGHT = 1.1;
const ROOM_COLS = 5;
const ROOM_CAPACITY = 13;
const ROOM_WIDTH = 1.3;
const ROOM_DEPTH = 1.1;
const ROOM_GAP = 0.35;
const FLOOR_PADDING = 0.6;
const DEFAULT_FLOORS_COUNT = 4;

const normalizeCode = (value) => String(value || "").trim().toUpperCase();

const disposeLabelSprite = (sprite) => {
  if (!sprite || !sprite.material) return;
  if (sprite.material.map) sprite.material.map.dispose();
  sprite.material.dispose();
};

const createLabelSprite = (text) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const fontSize = 48;
  const padding = 20;
  ctx.font = `bold ${fontSize}px Arial`;
  const textWidth = ctx.measureText(text).width;
  canvas.width = Math.ceil(textWidth + padding * 2);
  canvas.height = fontSize + padding * 2;

  ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.6)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);

  ctx.font = `bold ${fontSize}px Arial`;
  ctx.fillStyle = "#e2e8f0";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(material);
  const scale = 4;
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(scale * aspect, scale, 1);
  sprite.userData.__label = true;
  return sprite;
};

function CampusBuildings3DViewer({
  buildings = [],
  floors = [],
  rooms = [],
  selectedBuildingId,
  selectedFloorId,
  selectedRoomId,
  onSelectBuilding,
  onSelectFloor,
  onSelectRoom,
}) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const pointerRef = useRef(new THREE.Vector2());
  const animationRef = useRef(0);
  const focusRef = useRef(null);
  const debugRef = useRef({ loggedAnimate: false, loggedRenderInfo: false });
  const dataGroupRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const pointerCleanupRef = useRef(null);
  const geometriesRef = useRef(null);
  const materialsRef = useRef(null);
  const clickableRef = useRef(new Set());
  const meshMapRef = useRef({
    building: new Map(),
    floor: new Map(),
    room: new Map(),
  });
  const pendingFocusRef = useRef("");

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId]
  );
  const selectedFloor = useMemo(
    () => floors.find((f) => f.id === selectedFloorId) || null,
    [floors, selectedFloorId]
  );
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || null,
    [rooms, selectedRoomId]
  );

  const validatedBuildings = useMemo(() => {
    const valid = [];
    buildings.forEach((building) => {
      const position = building?.position3d || {};
      const size = building?.size3d || {};

      const x = Number(position.x);
      const y = Number(position.y);
      const z = Number(position.z);
      const width = Number(size.width);
      const depth = Number(size.depth);
      const heightPerFloor = Number(size.heightPerFloor);

      if (
        !isNumber(x) ||
        !isNumber(y) ||
        !isNumber(z) ||
        !isPositiveNumber(width) ||
        !isPositiveNumber(depth) ||
        !isPositiveNumber(heightPerFloor)
      ) {
        console.warn("[3D] invalid building data, skipping", building?.id, {
          position3d: position,
          size3d: size,
        });
        return;
      }

      valid.push({
        ...building,
        __position3d: { x, y, z },
        __size3d: { width, depth, heightPerFloor },
      });
    });
    return valid;
  }, [buildings]);

  const roomsSorted = useMemo(() => {
    return [...rooms].sort((a, b) =>
      String(a?.roomNumber || "").localeCompare(String(b?.roomNumber || ""))
    );
  }, [rooms]);

  useEffect(() => {
    console.log("[3D] buildings data", buildings);
  }, [buildings]);

  const initScene = useCallback(() => {
    if (!mountRef.current || sceneRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b1020);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 10000);
    camera.position.set(120, 120, 120);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setScissorTest(false);
    rendererRef.current = renderer;

    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.position = "absolute";
    renderer.domElement.style.inset = "0";

    mountRef.current.appendChild(renderer.domElement);
    console.log(
      "[3D] renderer appended",
      Boolean(renderer.domElement?.parentElement)
    );

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 5;
    controls.maxDistance = 5000;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    const ambient = new THREE.AmbientLight("#ffffff", 0.6);
    const dirLight = new THREE.DirectionalLight("#ffffff", 1.0);
    dirLight.position.set(20, 30, 12);
    scene.add(ambient, dirLight);

    const debugGroup = new THREE.Group();
    debugGroup.name = "debugGroup";
    debugGroup.add(new THREE.GridHelper(200, 50));
    debugGroup.add(new THREE.AxesHelper(20));
    const sanityCube = new THREE.Mesh(
      new THREE.BoxGeometry(10, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })
    );
    sanityCube.position.set(0, 5, 0);
    debugGroup.add(sanityCube);
    scene.add(debugGroup);

    const dataGroup = new THREE.Group();
    dataGroup.name = "dataGroup";
    scene.add(dataGroup);
    dataGroupRef.current = dataGroup;

    geometriesRef.current = {
      building: new THREE.BoxGeometry(1, 1, 1),
      floor: new THREE.BoxGeometry(1, 1, 1),
      room: new THREE.BoxGeometry(1, 1, 1),
    };

    materialsRef.current = {
      buildingDefault: new THREE.MeshStandardMaterial({
        color: "#64748b",
        transparent: true,
        opacity: 0.55,
      }),
      buildingSelected: new THREE.MeshStandardMaterial({
        color: "#2563eb",
        transparent: true,
        opacity: 0.8,
      }),
      buildingDim: new THREE.MeshStandardMaterial({
        color: "#1f2937",
        transparent: true,
        opacity: 0.2,
      }),
      floorDefault: new THREE.MeshStandardMaterial({
        color: "#0f172a",
        transparent: true,
        opacity: 0.7,
      }),
      floorSelected: new THREE.MeshStandardMaterial({
        color: "#38bdf8",
        transparent: true,
        opacity: 0.9,
      }),
      floorDim: new THREE.MeshStandardMaterial({
        color: "#1f2937",
        transparent: true,
        opacity: 0.15,
      }),
      roomAvailable: new THREE.MeshStandardMaterial({ color: "#22c55e" }),
      roomReserved: new THREE.MeshStandardMaterial({ color: "#ef4444" }),
      roomSelected: new THREE.MeshStandardMaterial({ color: "#facc15" }),
    };

    const handleResize = () => {
      if (!mountRef.current || !rendererRef.current || !cameraRef.current) return;
      const { clientWidth, clientHeight } = mountRef.current;
      console.log("[3D] mount size", clientWidth, clientHeight);
      const width = clientWidth || 520;
      const height = clientHeight || 520;
      rendererRef.current.setSize(width, height, false);
      rendererRef.current.setViewport(0, 0, width, height);
      cameraRef.current.aspect = width / Math.max(height, 1);
      cameraRef.current.near = 0.1;
      cameraRef.current.far = 10000;
      cameraRef.current.updateProjectionMatrix();
    };

    resizeObserverRef.current = new ResizeObserver(handleResize);
    resizeObserverRef.current.observe(mountRef.current);
    handleResize();

    const handlePointerDown = (event) => {
      if (!rendererRef.current || !cameraRef.current) return;
      const bounds = rendererRef.current.domElement.getBoundingClientRect();
      pointerRef.current.x =
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointerRef.current.y =
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      raycasterRef.current.setFromCamera(pointerRef.current, cameraRef.current);
      const clickable = Array.from(clickableRef.current);
      const hits = raycasterRef.current.intersectObjects(clickable, false);
      if (!hits.length) return;
      const meta = hits[0]?.object?.userData || {};
      if (!meta.type) return;

      if (meta.type === "building" && onSelectBuilding) {
        onSelectBuilding(meta.buildingId);
      }
      if (meta.type === "floor") {
        if (onSelectBuilding) onSelectBuilding(meta.buildingId);
        if (meta.floorId && onSelectFloor) onSelectFloor(meta.floorId);
      }
      if (meta.type === "room") {
        if (onSelectBuilding) onSelectBuilding(meta.buildingId);
        if (meta.floorId && onSelectFloor) onSelectFloor(meta.floorId);
        if (meta.roomId && onSelectRoom) onSelectRoom(meta.roomId);
      }
    };

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    pointerCleanupRef.current = () => {
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
    };

    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      if (!debugRef.current.loggedAnimate) {
        console.log("[3D] animate started");
        debugRef.current.loggedAnimate = true;
      }

      if (focusRef.current && cameraRef.current && controlsRef.current) {
        const focus = focusRef.current;
        focus.progress = Math.min(1, focus.progress + focus.step);
        cameraRef.current.position.lerpVectors(
          focus.startPosition,
          focus.endPosition,
          focus.progress
        );
        controlsRef.current.target.lerpVectors(
          focus.startTarget,
          focus.endTarget,
          focus.progress
        );
        controlsRef.current.update();
        if (focus.progress >= 1) focusRef.current = null;
      } else if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (rendererRef.current && cameraRef.current && sceneRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        if (!debugRef.current.loggedRenderInfo) {
          console.log(
            "[3D] scene children count",
            sceneRef.current.children.length
          );
          console.log(
            "[3D] drawCalls",
            rendererRef.current.info.render.calls,
            "tris",
            rendererRef.current.info.render.triangles
          );
          debugRef.current.loggedRenderInfo = true;
        }
      }
    };

    animate();
  }, [onSelectBuilding, onSelectFloor, onSelectRoom]);

  const startFocus = useCallback((box) => {
    if (!box || box.isEmpty() || !cameraRef.current || !controlsRef.current)
      return;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    const length = Math.max(size.x, size.y, size.z, 1);
    const distance = length * 2.2 + 8;
    const direction = new THREE.Vector3(1, 1, 1).normalize();

    focusRef.current = {
      startPosition: cameraRef.current.position.clone(),
      startTarget: controlsRef.current.target.clone(),
      endPosition: center.clone().add(direction.multiplyScalar(distance)),
      endTarget: center.clone(),
      progress: 0,
      step: 1 / 20,
    };
  }, []);

  const focusAll = useCallback(() => {
    const dataGroup = dataGroupRef.current;
    if (!dataGroup) return;
    const box = new THREE.Box3().setFromObject(dataGroup);
    if (!box.isEmpty()) {
      startFocus(box);
    }
  }, [startFocus]);

  const focusFromSelection = useCallback(() => {
    const map = meshMapRef.current;
    if (selectedRoomId && map.room.has(selectedRoomId)) {
      const obj = map.room.get(selectedRoomId);
      startFocus(new THREE.Box3().setFromObject(obj));
      return true;
    }
    if (selectedFloorId && map.floor.has(selectedFloorId)) {
      const obj = map.floor.get(selectedFloorId);
      startFocus(new THREE.Box3().setFromObject(obj));
      return true;
    }
    if (selectedBuildingId && map.building.has(selectedBuildingId)) {
      const obj = map.building.get(selectedBuildingId);
      startFocus(new THREE.Box3().setFromObject(obj));
      return true;
    }
    return false;
  }, [selectedBuildingId, selectedFloorId, selectedRoomId, startFocus]);

  const syncScene = useCallback(() => {
    const scene = sceneRef.current;
    const dataGroup = dataGroupRef.current;
    const geometries = geometriesRef.current;
    const materials = materialsRef.current;
    if (!scene || !dataGroup || !geometries || !materials) return;

    console.log("[3D] adding buildings meshes", validatedBuildings.length);

    // Clear dataGroup only. Keep debug helpers and lights alive.
    dataGroup.traverse((child) => {
      if (child.userData?.__label) disposeLabelSprite(child);
    });
    while (dataGroup.children.length) {
      const child = dataGroup.children.pop();
      if (child) dataGroup.remove(child);
    }
    clickableRef.current.clear();
    meshMapRef.current = {
      building: new Map(),
      floor: new Map(),
      room: new Map(),
    };

    const activeBuildingId = selectedBuildingId || "";
    const activeFloorId = selectedFloorId || "";

    if (validatedBuildings.length === 0) {
      const placeholder = new THREE.Mesh(
        geometries.building,
        materials.roomSelected
      );
      placeholder.scale.set(8, 8, 8);
      placeholder.position.set(0, 4, 0);
      placeholder.userData = { type: "placeholder" };
      dataGroup.add(placeholder);
    }

    validatedBuildings.forEach((building) => {
      const buildingGroup = new THREE.Group();
      const buildingId = building.id;
      const isSelectedBuilding = buildingId === activeBuildingId;
      const position = building.__position3d;
      const size = building.__size3d;
      const heightPerFloor = size.heightPerFloor;
      const floorWidth = size.width;
      const floorDepth = size.depth;

      const buildingMaterial = !activeBuildingId
        ? materials.buildingDefault
        : isSelectedBuilding
        ? materials.buildingSelected
        : materials.buildingDim;

      const buildingMesh = new THREE.Mesh(
        geometries.building,
        buildingMaterial
      );
      buildingMesh.userData = { type: "building", buildingId };
      buildingGroup.add(buildingMesh);
      clickableRef.current.add(buildingMesh);
      meshMapRef.current.building.set(buildingId, buildingGroup);

      buildingGroup.position.set(position.x, position.y, position.z);

      const floorsCountRaw = Number(building?.floorsCount);
      const defaultFloorsCount =
        isPositiveNumber(floorsCountRaw) && Number.isFinite(floorsCountRaw)
          ? Math.max(1, Math.round(floorsCountRaw))
          : DEFAULT_FLOORS_COUNT;

      const buildingFloors =
        isSelectedBuilding && floors.length
          ? floors
          : Array.from({ length: defaultFloorsCount }, (_, index) => ({
              id: null,
              floorNumber: index + 1,
              __placeholder: true,
            }));

      const floorNumbers = buildingFloors
        .map((floor) => Number(floor?.floorNumber))
        .filter((value) => Number.isFinite(value));
      const floorsCount = Math.max(
        defaultFloorsCount,
        floorNumbers.length ? Math.max(...floorNumbers) : 0,
        buildingFloors.length
      );

      const buildingHeight = floorsCount * heightPerFloor;
      buildingMesh.scale.set(floorWidth, buildingHeight, floorDepth);
      buildingMesh.position.set(0, buildingHeight / 2, 0);

      const buildingLabelText = building.code
        ? `BUILDING ${normalizeCode(building.code)}`
        : building.name
        ? building.name.toUpperCase()
        : "BUILDING";
      const labelSprite = createLabelSprite(buildingLabelText);
      if (labelSprite) {
        labelSprite.position.set(0, buildingHeight + 1.5, 0);
        buildingGroup.add(labelSprite);
      }

      buildingFloors.forEach((floor) => {
        const floorNumber = Number(floor?.floorNumber) || 1;
        const floorY =
          (floorNumber - 1) * heightPerFloor + heightPerFloor / 2;
        const isFloorSelected = floor?.id && floor.id === activeFloorId;
        const floorVisible = !activeFloorId || isFloorSelected;

        const floorMaterial = !isSelectedBuilding
          ? materials.floorDim
          : isFloorSelected
          ? materials.floorSelected
          : materials.floorDefault;

        const floorMesh = new THREE.Mesh(geometries.floor, floorMaterial);
        floorMesh.scale.set(floorWidth, FLOOR_THICKNESS, floorDepth);
        floorMesh.position.set(0, floorY, 0);
        floorMesh.visible = isSelectedBuilding ? floorVisible : true;
        floorMesh.userData = {
          type: floor?.id ? "floor" : "building",
          buildingId,
          floorId: floor?.id || "",
        };

        buildingGroup.add(floorMesh);
        if (floor?.id) {
          clickableRef.current.add(floorMesh);
          meshMapRef.current.floor.set(floor.id, floorMesh);
        }
      });

      if (isSelectedBuilding && activeFloorId) {
        const floorAnchor = floors.find((floor) => floor.id === activeFloorId);
        const floorNumber = Number(floorAnchor?.floorNumber) || 1;
        const floorY =
          (floorNumber - 1) * heightPerFloor + heightPerFloor / 2;
        const roomsPerFloorRaw = Number(building?.roomsPerFloor);
        const roomsPerFloor = isPositiveNumber(roomsPerFloorRaw)
          ? Math.max(1, Math.round(roomsPerFloorRaw))
          : ROOM_CAPACITY;
        const roomsToRender = roomsSorted.slice(
          0,
          Math.min(roomsPerFloor, ROOM_CAPACITY)
        );

        roomsToRender.forEach((room, index) => {
          const roomMaterial =
            room.id === selectedRoomId
              ? materials.roomSelected
              : room?.isReserved
              ? materials.roomReserved
              : materials.roomAvailable;

          const roomMesh = new THREE.Mesh(geometries.room, roomMaterial);
          roomMesh.userData = {
            type: "room",
            buildingId,
            floorId: room.floorId || activeFloorId,
            roomId: room.id,
          };

          const col = index % ROOM_COLS;
          const row = Math.floor(index / ROOM_COLS);
          const startX = -floorWidth / 2 + FLOOR_PADDING + ROOM_WIDTH / 2;
          const startZ = -floorDepth / 2 + FLOOR_PADDING + ROOM_DEPTH / 2;
          const x = startX + col * (ROOM_WIDTH + ROOM_GAP);
          const z = startZ + row * (ROOM_DEPTH + ROOM_GAP);

          roomMesh.scale.set(ROOM_WIDTH, ROOM_HEIGHT, ROOM_DEPTH);
          roomMesh.position.set(x, floorY, z);
          buildingGroup.add(roomMesh);
          clickableRef.current.add(roomMesh);
          meshMapRef.current.room.set(room.id, roomMesh);
        });
      }

      dataGroup.add(buildingGroup);
    });

    const focusKey = `${selectedBuildingId || ""}|${selectedFloorId || ""}|${
      selectedRoomId || ""
    }`;
    pendingFocusRef.current = focusKey;
  }, [
    validatedBuildings,
    floors,
    roomsSorted,
    selectedBuildingId,
    selectedFloorId,
    selectedRoomId,
  ]);

  useEffect(() => {
    initScene();
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current && mountRef.current) {
        resizeObserverRef.current.disconnect();
      }
      if (pointerCleanupRef.current) pointerCleanupRef.current();
      if (controlsRef.current) controlsRef.current.dispose();
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (rendererRef.current.domElement?.parentNode) {
          rendererRef.current.domElement.parentNode.removeChild(
            rendererRef.current.domElement
          );
        }
      }
      if (geometriesRef.current) {
        Object.values(geometriesRef.current).forEach((geo) => geo.dispose());
      }
      if (materialsRef.current) {
        Object.values(materialsRef.current).forEach((mat) => mat.dispose());
      }
    };
  }, [initScene]);

  useEffect(() => {
    syncScene();
  }, [syncScene]);

  useEffect(() => {
    if (!pendingFocusRef.current) return;
    const focused = focusFromSelection();
    if (!focused) {
      focusAll();
    }
    pendingFocusRef.current = "";
  }, [focusAll, focusFromSelection, buildings]);

  const infoRows = useMemo(() => {
    const buildingLabel = selectedBuilding
      ? `${selectedBuilding.name || "Building"}${
          selectedBuilding.code ? ` (${selectedBuilding.code})` : ""
        }`
      : "None";
    const floorLabel = selectedFloor
      ? `Floor ${selectedFloor.floorNumber || ""}`
      : "None";
    const roomLabel = selectedRoom ? selectedRoom.roomNumber || "Room" : "None";
    const roomStatus = selectedRoom
      ? selectedRoom.isReserved
        ? "Reserved"
        : "Available"
      : "N/A";

    return [
      { label: "Building", value: buildingLabel },
      { label: "Floor", value: floorLabel },
      { label: "Room", value: roomLabel },
      { label: "Status", value: roomStatus },
    ];
  }, [selectedBuilding, selectedFloor, selectedRoom]);

  const statsRows = useMemo(() => {
    return [
      { label: "Total buildings", value: buildings.length },
      { label: "Floors (selected)", value: floors.length },
      { label: "Rooms (selected floor)", value: rooms.length },
      {
        label: "Rooms per floor",
        value: rooms.length ? rooms.length : 0,
      },
    ];
  }, [buildings.length, floors.length, rooms.length]);

  return (
    <div
      className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-lg"
      style={{ height: 520, position: "relative" }}
    >
      <div ref={mountRef} className="h-full w-full" />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-4 top-4 w-64 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3 text-xs text-slate-200 shadow-lg">
          <div className="mb-2 text-sm font-semibold text-slate-100">
            Info Panel
          </div>
          <div className="space-y-1">
            {infoRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-slate-100">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute right-4 top-4 w-64 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3 text-xs text-slate-200 shadow-lg">
          <div className="mb-2 text-sm font-semibold text-slate-100">
            Campus Stats
          </div>
          <div className="space-y-1">
            {statsRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-3">
                <span className="text-slate-400">{row.label}</span>
                <span className="text-slate-100">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-4 left-1/2 w-[70%] -translate-x-1/2 rounded-xl border border-slate-700/60 bg-slate-900/80 p-3 text-xs text-slate-200 shadow-lg">
          <div className="mb-1 text-sm font-semibold text-slate-100">
            Controls
          </div>
          <div className="flex flex-wrap justify-between gap-2 text-slate-400">
            <span>Rotate: Left mouse</span>
            <span>Pan: Right mouse / Shift + Drag</span>
            <span>Zoom: Scroll</span>
            <span>Click: Select building, floor, or room</span>
          </div>
        </div>
      </div>

      {buildings.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          No buildings to preview.
        </div>
      ) : validatedBuildings.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-400">
          No valid building data to render.
        </div>
      ) : null}
    </div>
  );
}

export default CampusBuildings3DViewer;
