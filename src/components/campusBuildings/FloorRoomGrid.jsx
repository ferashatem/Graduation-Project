import { useCallback, useMemo } from "react";
import { Button, CircularProgress, IconButton, Typography } from "@mui/material";
import { Add, CalendarMonth, Delete, Edit, EventBusy, EventAvailable } from "@mui/icons-material";
import { minutesToTime } from "../../services/campusBuildingsAdmin.service";

const DAY_LABELS = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

function RoomCard({
  room,
  schedules,
  selectedDay,
  onViewSchedule,
  onEditRoom,
  onDeleteRoom,
}) {
  const sessionCount = schedules.length;
  const totalMinutes = useMemo(
    () =>
      schedules.reduce(
        (sum, s) => sum + ((s.endMin || 0) - (s.startMin || 0)),
        0
      ),
    [schedules]
  );
  const totalHours = (totalMinutes / 60).toFixed(1);

  const status = useMemo(() => {
    if (sessionCount === 0) return "available";
    if (totalMinutes >= 360) return "busy";
    return "partial";
  }, [sessionCount, totalMinutes]);

  const statusConfig = {
    available: {
      border: "border-l-emerald-400",
      bg: "bg-emerald-50/50",
      dot: "bg-emerald-400",
      label: "Available",
      labelColor: "text-emerald-600",
    },
    partial: {
      border: "border-l-amber-400",
      bg: "bg-amber-50/30",
      dot: "bg-amber-400",
      label: `${sessionCount} session${sessionCount > 1 ? "s" : ""}`,
      labelColor: "text-amber-600",
    },
    busy: {
      border: "border-l-rose-400",
      bg: "bg-rose-50/30",
      dot: "bg-rose-400",
      label: "Heavily booked",
      labelColor: "text-rose-600",
    },
  };

  const cfg = statusConfig[status];

  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-l-4 ${cfg.border} border-slate-200 ${cfg.bg} bg-white p-3 shadow-sm transition-all hover:shadow-md hover:ring-1 hover:ring-slate-300`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <Typography variant="subtitle2" className="font-bold text-slate-800">
            Room {room.roomNumber}
          </Typography>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onEditRoom(room);
            }}
            title="Edit room"
          >
            <Edit sx={{ fontSize: 14 }} />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteRoom(room);
            }}
            title="Delete room"
          >
            <Delete sx={{ fontSize: 14 }} />
          </IconButton>
        </div>
      </div>

      {/* Meta */}
      {room.capacity ? (
        <div className="mt-1 flex items-center gap-2">
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-500">
            Cap: {room.capacity}
          </span>
          {room.name ? (
            <span className="truncate text-xs text-slate-400">{room.name}</span>
          ) : null}
        </div>
      ) : null}

      {/* Sessions preview for selected day */}
      <div className="mt-2.5 flex-1">
        {schedules.length === 0 ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <EventAvailable sx={{ fontSize: 14 }} />
            <span>Free on {DAY_LABELS[selectedDay] || selectedDay}</span>
          </div>
        ) : (
          <div className="space-y-1">
            {schedules.slice(0, 3).map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 text-xs ring-1 ring-slate-100"
              >
                <span className="font-semibold text-slate-600">
                  {minutesToTime(s.startMin)}-{minutesToTime(s.endMin)}
                </span>
                <span className="truncate text-slate-400">
                  {s.courseName || "Reserved"}
                </span>
              </div>
            ))}
            {schedules.length > 3 ? (
              <p className="pl-2 text-[11px] text-slate-400">
                +{schedules.length - 3} more
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
        <div className="flex items-center gap-1">
          <span className={`text-xs font-medium ${cfg.labelColor}`}>
            {cfg.label}
          </span>
          {totalMinutes > 0 ? (
            <span className="text-[11px] text-slate-400">
              ({totalHours}h)
            </span>
          ) : null}
        </div>
        <Button
          size="small"
          variant="text"
          startIcon={<CalendarMonth sx={{ fontSize: 14 }} />}
          onClick={() => onViewSchedule(room)}
          sx={{
            fontSize: "0.7rem",
            textTransform: "none",
            minWidth: "auto",
            px: 1,
            py: 0.25,
          }}
        >
          Schedule
        </Button>
      </div>
    </div>
  );
}

function FloorRoomGrid({
  rooms,
  schedulesByRoomId,
  schedulesLoading,
  selectedDay,
  onViewSchedule,
  onAddRoom,
  onEditRoom,
  onDeleteRoom,
}) {
  const handleViewSchedule = useCallback(
    (room) => {
      if (onViewSchedule) onViewSchedule(room);
    },
    [onViewSchedule]
  );

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort((a, b) =>
        String(a.roomNumber || "").localeCompare(String(b.roomNumber || ""), undefined, {
          numeric: true,
        })
      ),
    [rooms]
  );

  if (rooms.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
          <EventBusy className="mx-auto mb-2 text-slate-300" sx={{ fontSize: 32 }} />
          <p className="text-sm text-slate-500">No rooms yet for this floor.</p>
        </div>
        <Button
          variant="outlined"
          size="small"
          startIcon={<Add />}
          onClick={onAddRoom}
        >
          Add Room
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>{rooms.length} room{rooms.length !== 1 ? "s" : ""}</span>
        {schedulesLoading ? (
          <span className="flex items-center gap-1">
            <CircularProgress size={12} />
            Loading availability...
          </span>
        ) : (
          <>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {rooms.filter((r) => !(schedulesByRoomId[r.id]?.length > 0)).length} available
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              {rooms.filter((r) => {
                const s = schedulesByRoomId[r.id] || [];
                const mins = s.reduce((sum, sc) => sum + ((sc.endMin || 0) - (sc.startMin || 0)), 0);
                return s.length > 0 && mins < 360;
              }).length}{" "}
              partially booked
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
              {rooms.filter((r) => {
                const s = schedulesByRoomId[r.id] || [];
                const mins = s.reduce((sum, sc) => sum + ((sc.endMin || 0) - (sc.startMin || 0)), 0);
                return mins >= 360;
              }).length}{" "}
              heavily booked
            </span>
          </>
        )}
      </div>

      {/* Room cards grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sortedRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            schedules={schedulesByRoomId[room.id] || []}
            selectedDay={selectedDay}
            onViewSchedule={handleViewSchedule}
            onEditRoom={onEditRoom}
            onDeleteRoom={onDeleteRoom}
          />
        ))}
      </div>

      <Button
        variant="outlined"
        size="small"
        startIcon={<Add />}
        onClick={onAddRoom}
      >
        Add Room
      </Button>
    </div>
  );
}

export default FloorRoomGrid;
