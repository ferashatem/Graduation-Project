import { Html } from "@react-three/drei";
import { useMemo } from "react";

function RoomHoverTooltip({ room, floorLabel, dayOptions, dayFullMap }) {
  const capacityLabel = useMemo(() => {
    if (room?.capacity === null || room?.capacity === undefined) return "N/A";
    return String(room.capacity);
  }, [room?.capacity]);

  return (
    <Html center distanceFactor={10} position={[0, 0.6, 0]}>
      <div className="pointer-events-none w-40 rounded-lg border border-slate-800/60 bg-slate-950/90 p-2 text-[11px] text-slate-100 shadow-xl">
        <div className="text-xs font-semibold text-white">
          Room {room?.name || "?"}
        </div>
        <div className="text-[10px] text-slate-300">Floor: {floorLabel}</div>
        <div className="text-[10px] text-slate-300">
          Capacity: {capacityLabel}
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {dayOptions.map((day) => {
            const isFull = Boolean(dayFullMap?.[day.key]);
            return (
              <span
                key={day.key}
                className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                  isFull ? "bg-rose-500 text-white" : "bg-emerald-500 text-white"
                }`}
              >
                {day.label}
              </span>
            );
          })}
        </div>
      </div>
    </Html>
  );
}

export default RoomHoverTooltip;

