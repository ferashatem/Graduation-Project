import { useMemo } from "react";
import { useCursor } from "@react-three/drei";
import RoomHoverTooltip from "./RoomHoverTooltip";

function Room3D({
  room,
  position,
  size,
  color,
  isDimmed,
  isSelected,
  isHovered,
  floorLabel,
  dayOptions,
  dayFullMap,
  onHover,
  onClick,
}) {
  useCursor(isHovered);

  const materialProps = useMemo(
    () => ({
      color,
      transparent: Boolean(isDimmed),
      opacity: isDimmed ? 0.45 : 1,
      emissive: isHovered ? "#ffffff" : "#000000",
      emissiveIntensity: isHovered ? 0.25 : 0,
    }),
    [color, isDimmed, isHovered]
  );

  const outlineScale = useMemo(() => (isSelected ? 1.08 : 1), [isSelected]);

  return (
    <group position={position}>
      {isSelected ? (
        <mesh scale={[outlineScale, outlineScale, outlineScale]}>
          <boxGeometry args={size} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.25}
          />
        </mesh>
      ) : null}
      <mesh
        onPointerOver={(event) => {
          event.stopPropagation();
          if (onHover) onHover(room, true);
        }}
        onPointerOut={(event) => {
          event.stopPropagation();
          if (onHover) onHover(room, false);
        }}
        onClick={(event) => {
          event.stopPropagation();
          if (onClick) onClick(room);
        }}
      >
        <boxGeometry args={size} />
        <meshStandardMaterial {...materialProps} />
      </mesh>
      {isHovered ? (
        <RoomHoverTooltip
          room={room}
          floorLabel={floorLabel}
          dayOptions={dayOptions}
          dayFullMap={dayFullMap}
        />
      ) : null}
    </group>
  );
}

export default Room3D;

