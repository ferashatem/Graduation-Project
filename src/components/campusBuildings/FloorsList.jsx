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
import { Add, Delete, Edit, AutoFixHigh } from "@mui/icons-material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";

function FloorsList({
  floors = [],
  loading,
  error,
  selectedBuilding,
  selectedFloorId,
  demoLoading,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
  onGenerateDemo,
}) {
  const hasFloors = useMemo(() => floors.length > 0, [floors.length]);
  const buildingName = useMemo(
    () => selectedBuilding?.name || "building",
    [selectedBuilding?.name]
  );

  const handleSelect = useCallback(
    (floor) => {
      if (onSelect) onSelect(floor);
    },
    [onSelect]
  );

  const handleAdd = useCallback(() => {
    if (onAdd) onAdd();
  }, [onAdd]);

  const handleEdit = useCallback(
    (event, floor) => {
      event.stopPropagation();
      if (onEdit) onEdit(floor);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (event, floor) => {
      event.stopPropagation();
      if (onDelete) onDelete(floor);
    },
    [onDelete]
  );

  const handleGenerateDemo = useCallback(() => {
    if (onGenerateDemo) onGenerateDemo();
  }, [onGenerateDemo]);

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" className="text-slate-800">
            Floors
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            {selectedBuilding
              ? `Floors inside ${buildingName}.`
              : "Select a building to manage floors."}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixHigh />}
            onClick={handleGenerateDemo}
            disabled={!selectedBuilding || demoLoading}
          >
            {demoLoading ? "Generating..." : "Demo Data"}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={handleAdd}
            disabled={!selectedBuilding}
          >
            Add
          </Button>
        </div>
      </div>

      <Divider className="my-4" />

      <div className="flex-1 overflow-hidden">
        {!selectedBuilding ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            Choose a building to see its floors.
          </div>
        ) : loading ? (
          <Loading label="Loading floors..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !hasFloors ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No floors yet for this building.
          </div>
        ) : (
          <List dense className="max-h-[420px] overflow-y-auto pr-1">
            {floors.map((floor) => (
              <ListItemButton
                key={floor.id}
                selected={floor.id === selectedFloorId}
                onClick={() => handleSelect(floor)}
                className="rounded-xl"
              >
                <ListItemText
                  primary={`Floor ${floor.floorNumber}`}
                  secondary={floor.label || "No label"}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(event) => handleEdit(event, floor)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={(event) => handleDelete(event, floor)}
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

export default FloorsList;
