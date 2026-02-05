import { useMemo } from "react";
import Building3D from "./Building3D";

function Campus({
  buildings,
  roomsByBuilding,
  layoutMap,
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
  const buildingRows = useMemo(() => buildings || [], [buildings]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]}>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>

      {buildingRows.map((building) => {
        const layout = layoutMap.get(building.id);
        if (!layout) return null;
        const rooms = roomsByBuilding[building.id] || [];
        return (
          <Building3D
            key={building.id}
            building={building}
            layout={layout}
            rooms={rooms}
            activeBuildingId={activeBuildingId}
            activeFloorKey={activeFloorKey}
            activeRoomKey={activeRoomKey}
            hoveredRoomKey={hoveredRoomKey}
            roomStatusMap={roomStatusMap}
            onSelectBuilding={onSelectBuilding}
            onSelectFloor={onSelectFloor}
            onSelectRoom={onSelectRoom}
            onHoverRoom={onHoverRoom}
            dayOptions={dayOptions}
          />
        );
      })}
    </group>
  );
}

export default Campus;

