import { Html } from "@react-three/drei";
import { useMemo, useState } from "react";
import Floor3D from "./Floor3D";

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

function Building3D({
  building,
  layout,
  rooms,
  activeBuildingId,
  activeFloorKey,
  activeRoomKey,
  hoveredRoomKey,
  roomStatusMap,
  onSelectBuilding,
  onSelectFloor,
  onSelectRoom,
  onHoverRoom,
  dayOptions,
}) {
  const [isHovered, setIsHovered] = useState(false);

  const floors = useMemo(() => {
    const grouped = FLOOR_DEFS.map((floor) => ({
      ...floor,
      rooms: [],
    }));

    rooms.forEach((room) => {
      const key = normalizeFloorKey(room?.floor);
      const target = grouped.find((floor) => floor.key === key);
      if (target) target.rooms.push(room);
    });

    return grouped;
  }, [rooms]);

  const label = useMemo(() => {
    if (building?.code) return building.code;
    if (building?.name) return building.name;
    return "Building";
  }, [building?.code, building?.name]);

  const isActive = activeBuildingId === building?.id;
  const dimmed = Boolean(activeBuildingId && building?.id !== activeBuildingId);
  const expanded = Boolean(isActive);

  return (
    <group
      position={layout.position}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
      onClick={() => onSelectBuilding(building)}
    >
      {floors.map((floor, index) => (
        <Floor3D
          key={floor.key}
          floor={floor}
          floorIndex={index}
          floorSize={layout.floorSize}
          columns={layout.columns}
          isExpanded={expanded}
          isSelected={activeFloorKey === floor.key}
          isHighlighted={isHovered}
          isDimmed={dimmed}
          roomStatusMap={roomStatusMap}
          hoveredRoomKey={hoveredRoomKey}
          activeRoomKey={activeRoomKey}
          onSelectFloor={(floorKey) => onSelectFloor(building, floorKey)}
          onSelectRoom={(floorKey, room) => onSelectRoom(building, floorKey, room)}
          onHoverRoom={onHoverRoom}
          dayOptions={dayOptions}
        />
      ))}

      <Html position={[0, layout.height + 0.7, 0]} center>
        <div
          className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
            isHovered || expanded
              ? "border-emerald-400 bg-emerald-400 text-emerald-950"
              : "border-slate-500/60 bg-slate-900/70 text-slate-200"
          }`}
        >
          {label}
        </div>
      </Html>
    </group>
  );
}

export default Building3D;
