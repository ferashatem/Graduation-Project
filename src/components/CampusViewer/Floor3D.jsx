import { useMemo } from "react";
import Room3D from "./Room3D";

const ROOM_SIZE = [0.9, 0.35, 0.9];
const ROOM_SPACING = 1.2;
const FLOOR_THICKNESS = 0.18;
const FLOOR_PADDING = 0.6;

const sortRooms = (rooms) => {
  return [...rooms].sort((a, b) => {
    const getNumber = (value) => {
      const raw = String(value || "");
      const match = raw.match(/\d+/);
      return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
    };
    const numA = getNumber(a?.name);
    const numB = getNumber(b?.name);
    if (numA !== numB) return numA - numB;
    return String(a?.name || "").localeCompare(String(b?.name || ""));
  });
};

function Floor3D({
  floor,
  floorIndex,
  floorSize,
  columns,
  isExpanded,
  isSelected,
  isHighlighted,
  isDimmed,
  roomStatusMap,
  hoveredRoomKey,
  activeRoomKey,
  onSelectFloor,
  onSelectRoom,
  onHoverRoom,
  dayOptions,
}) {
  const sortedRooms = useMemo(() => sortRooms(floor.rooms || []), [floor.rooms]);

  const roomPositions = useMemo(() => {
    return sortedRooms.map((room, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      const x =
        -floorSize.width / 2 +
        FLOOR_PADDING +
        column * ROOM_SPACING +
        ROOM_SPACING / 2;
      const z =
        -floorSize.depth / 2 +
        FLOOR_PADDING +
        row * ROOM_SPACING +
        ROOM_SPACING / 2;
      const y = FLOOR_THICKNESS / 2 + ROOM_SIZE[1] / 2;
      return { room, position: [x, y, z] };
    });
  }, [columns, floorSize.depth, floorSize.width, sortedRooms]);

  const floorColor = useMemo(() => {
    if (isSelected) return "#38bdf8";
    if (isHighlighted) return "#475569";
    if (isDimmed) return "#1f2937";
    return "#334155";
  }, [isDimmed, isHighlighted, isSelected]);

  const floorOpacity = useMemo(() => (isDimmed ? 0.25 : 0.85), [isDimmed]);

  const floorYOffset = useMemo(() => {
    const base = floorIndex * 0.9;
    return base + (isExpanded ? 0.35 : 0);
  }, [floorIndex, isExpanded]);

  const floorZOffset = useMemo(() => (isSelected ? floorSize.depth * 0.2 : 0), [
    floorSize.depth,
    isSelected,
  ]);

  return (
    <group position={[0, floorYOffset, floorZOffset]}>
      <mesh
        onClick={(event) => {
          event.stopPropagation();
          if (onSelectFloor) onSelectFloor(floor.key);
        }}
      >
        <boxGeometry args={[floorSize.width, FLOOR_THICKNESS, floorSize.depth]} />
        <meshStandardMaterial
          color={floorColor}
          transparent
          opacity={floorOpacity}
        />
      </mesh>

      {roomPositions.map(({ room, position }) => {
        const status = roomStatusMap.get(room._campusKey) || {};
        return (
          <Room3D
            key={room.id}
            room={room}
            position={position}
            size={ROOM_SIZE}
            color={status.color || "#34d399"}
            isDimmed={isDimmed}
            isSelected={activeRoomKey === room._campusKey}
            isHovered={hoveredRoomKey === room._campusKey}
            floorLabel={floor.label}
            dayOptions={dayOptions}
            dayFullMap={status.dayFullMap}
            onHover={onHoverRoom}
            onClick={() => onSelectRoom(floor.key, room)}
          />
        );
      })}
    </group>
  );
}

export default Floor3D;
