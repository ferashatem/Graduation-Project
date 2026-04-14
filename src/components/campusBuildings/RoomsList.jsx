import { useCallback, useMemo } from "react";
import {
  Alert,
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";
import { minutesToTime } from "../../services/campusBuildings.service";

const DAY_OPTIONS = [
  { value: "MON", label: "Mon" },
  { value: "TUE", label: "Tue" },
  { value: "WED", label: "Wed" },
  { value: "THU", label: "Thu" },
  { value: "FRI", label: "Fri" },
  { value: "SAT", label: "Sat" },
  { value: "SUN", label: "Sun" },
];

function RoomsList({
  rooms = [],
  loading,
  error,
  selectedBuilding,
  selectedFloor,
  selectedRoomId,
  availabilityFilter,
  availabilityLoading,
  availabilityError,
  availableRoomIds,
  onAvailabilityDayChange,
  onAvailabilityStartChange,
  onAvailabilityEndChange,
  onCheckAvailability,
  onClearAvailability,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) {
  const timeOptions = useMemo(() => {
    const options = [];
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      options.push(minutesToTime(minutes));
    }
    return options;
  }, []);

  const availabilityActive = useMemo(
    () => Boolean(availableRoomIds && typeof availableRoomIds.has === "function"),
    [availableRoomIds]
  );

  const visibleRooms = useMemo(() => {
    if (!availabilityActive) return rooms;
    return rooms.filter((room) => availableRoomIds.has(room.id));
  }, [availableRoomIds, availabilityActive, rooms]);

  const hasRooms = useMemo(() => visibleRooms.length > 0, [visibleRooms.length]);
  const floorLabel = useMemo(() => {
    if (!selectedFloor) return "";
    return `Floor ${selectedFloor.floorNumber}`;
  }, [selectedFloor]);

  const availabilityDayLabel = useMemo(() => {
    const day = String(availabilityFilter?.day || "").toUpperCase();
    return DAY_OPTIONS.find((option) => option.value === day)?.label || day;
  }, [availabilityFilter?.day]);

  const availabilitySummary = useMemo(() => {
    if (!availabilityActive) return "";
    const start = availabilityFilter?.startTime || "--:--";
    const end = availabilityFilter?.endTime || "--:--";
    return `Available rooms: ${visibleRooms.length} of ${rooms.length} for ${availabilityDayLabel} ${start} - ${end}.`;
  }, [
    availabilityActive,
    availabilityDayLabel,
    availabilityFilter?.endTime,
    availabilityFilter?.startTime,
    rooms.length,
    visibleRooms.length,
  ]);

  const emptyMessage = useMemo(() => {
    if (availabilityActive) {
      return "No rooms available for the selected time range.";
    }
    return "No rooms yet for this floor.";
  }, [availabilityActive]);

  const handleSelect = useCallback(
    (room) => {
      if (onSelect) onSelect(room);
    },
    [onSelect]
  );

  const handleAdd = useCallback(() => {
    if (onAdd) onAdd();
  }, [onAdd]);

  const handleAvailabilityDay = useCallback(
    (event) => {
      if (onAvailabilityDayChange) onAvailabilityDayChange(event.target.value);
    },
    [onAvailabilityDayChange]
  );

  const handleAvailabilityStart = useCallback(
    (event) => {
      if (onAvailabilityStartChange) onAvailabilityStartChange(event.target.value);
    },
    [onAvailabilityStartChange]
  );

  const handleAvailabilityEnd = useCallback(
    (event) => {
      if (onAvailabilityEndChange) onAvailabilityEndChange(event.target.value);
    },
    [onAvailabilityEndChange]
  );

  const handleCheckAvailability = useCallback(() => {
    if (onCheckAvailability) onCheckAvailability();
  }, [onCheckAvailability]);

  const handleClearAvailability = useCallback(() => {
    if (onClearAvailability) onClearAvailability();
  }, [onClearAvailability]);

  const handleEdit = useCallback(
    (event, room) => {
      event.stopPropagation();
      if (onEdit) onEdit(room);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (event, room) => {
      event.stopPropagation();
      if (onDelete) onDelete(room);
    },
    [onDelete]
  );

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" className="text-slate-800">
            Rooms
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            {selectedBuilding && selectedFloor
              ? `Rooms inside ${floorLabel}.`
              : "Select a floor to manage rooms."}
          </Typography>
        </div>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleAdd}
          disabled={!selectedBuilding || !selectedFloor}
        >
          Add
        </Button>
      </div>

      <div className="mt-3 space-y-3">
        <Typography variant="subtitle2" className="text-slate-700">
          Availability filter
        </Typography>
        <div className="grid gap-2 sm:grid-cols-3">
          <TextField
            select
            size="small"
            label="Day"
            value={availabilityFilter?.day || "MON"}
            onChange={handleAvailabilityDay}
            disabled={!selectedBuilding || !selectedFloor || availabilityLoading}
          >
            {DAY_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Start"
            value={availabilityFilter?.startTime || "09:00"}
            onChange={handleAvailabilityStart}
            disabled={!selectedBuilding || !selectedFloor || availabilityLoading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`start-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="End"
            value={availabilityFilter?.endTime || "10:00"}
            onChange={handleAvailabilityEnd}
            disabled={!selectedBuilding || !selectedFloor || availabilityLoading}
          >
            {timeOptions.map((option) => (
              <MenuItem key={`end-${option}`} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={handleCheckAvailability}
            disabled={!selectedBuilding || !selectedFloor || availabilityLoading}
          >
            {availabilityLoading ? "Checking..." : "Check Available Rooms"}
          </Button>
          {availabilityActive ? (
            <Button
              size="small"
              onClick={handleClearAvailability}
              disabled={availabilityLoading}
            >
              Clear
            </Button>
          ) : null}
        </div>
        {availabilityError ? (
          <Alert severity="error">{availabilityError}</Alert>
        ) : null}
        {availabilityActive && availabilitySummary ? (
          <Typography variant="caption" className="text-slate-500">
            {availabilitySummary}
          </Typography>
        ) : null}
      </div>

      <Divider className="my-4" />

      <div className="flex-1 overflow-hidden">
        {!selectedBuilding || !selectedFloor ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Choose a floor to see its rooms.
          </div>
        ) : loading ? (
          <Loading label="Loading rooms..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !hasRooms ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <List dense className="max-h-[420px] overflow-y-auto pr-1">
            {visibleRooms.map((room) => (
              <ListItemButton
                key={room.id}
                selected={room.id === selectedRoomId}
                onClick={() => handleSelect(room)}
                className="rounded-xl"
              >
                <ListItemText
                  primary={`${room.roomNumber || "Room"} - ${room.name || "N/A"}`}
                  secondary={
                    room.capacity
                      ? `Capacity ${room.capacity}`
                      : "No capacity set"
                  }
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(event) => handleEdit(event, room)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={(event) => handleDelete(event, room)}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        )}
      </div>
    </div>
  );
}

export default RoomsList;
