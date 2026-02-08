import { useCallback, useMemo } from "react";
import {
  Button,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit } from "@mui/icons-material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";

function RoomsList({
  rooms = [],
  loading,
  error,
  selectedBuilding,
  selectedFloor,
  selectedRoomId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) {
  const hasRooms = useMemo(() => rooms.length > 0, [rooms.length]);
  const floorLabel = useMemo(() => {
    if (!selectedFloor) return "";
    return `Floor ${selectedFloor.floorNumber}`;
  }, [selectedFloor]);

  const handleSelect = useCallback(
    (room) => {
      if (onSelect) onSelect(room);
    },
    [onSelect]
  );

  const handleAdd = useCallback(() => {
    if (onAdd) onAdd();
  }, [onAdd]);

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
            No rooms yet for this floor.
          </div>
        ) : (
          <List dense className="max-h-[420px] overflow-y-auto pr-1">
            {rooms.map((room) => (
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
