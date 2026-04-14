import { useCallback, useMemo } from "react";
import {
  Button,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Delete, Edit, Search } from "@mui/icons-material";
import Loading from "../common/Loading";
import ErrorState from "../common/ErrorState";

function BuildingsList({
  buildings = [],
  loading,
  error,
  search,
  selectedId,
  onSearchChange,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) {
  const hasBuildings = useMemo(() => buildings.length > 0, [buildings.length]);
  const emptyMessage = useMemo(() => {
    return search?.trim()
      ? "No buildings match your search."
      : "No buildings found.";
  }, [search]);

  const handleSearchChange = useCallback(
    (event) => {
      if (onSearchChange) onSearchChange(event.target.value);
    },
    [onSearchChange]
  );

  const handleSelect = useCallback(
    (building) => {
      if (onSelect) onSelect(building);
    },
    [onSelect]
  );

  const handleAdd = useCallback(() => {
    if (onAdd) onAdd();
  }, [onAdd]);

  const handleEdit = useCallback(
    (event, building) => {
      event.stopPropagation();
      if (onEdit) onEdit(building);
    },
    [onEdit]
  );

  const handleDelete = useCallback(
    (event, building) => {
      event.stopPropagation();
      if (onDelete) onDelete(building);
    },
    [onDelete]
  );

  return (
    <div className="flex h-full min-h-[520px] flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Typography variant="h6" className="text-slate-800">
            Buildings
          </Typography>
          <Typography variant="body2" className="text-slate-500">
            Manage campus buildings.
          </Typography>
        </div>
        <Button
          variant="contained"
          size="small"
          startIcon={<Add />}
          onClick={handleAdd}
        >
          Add
        </Button>
      </div>

      <div className="mt-3">
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by name or code"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </div>

      <Divider className="my-4" />

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <Loading label="Loading buildings..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : !hasBuildings ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        ) : (
          <List dense className="max-h-[420px] overflow-y-auto pr-1">
            {buildings.map((building) => (
              <ListItemButton
                key={building.id}
                selected={building.id === selectedId}
                onClick={() => handleSelect(building)}
                className="rounded-xl"
              >
                <ListItemText
                  primary={
                    building.code
                      ? `${building.name || "Untitled"} (${building.code})`
                      : building.name || "Untitled"
                  }
                  secondary={building.code ? "Building code set" : "No code"}
                />
                <IconButton
                  edge="end"
                  size="small"
                  onClick={(event) => handleEdit(event, building)}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton
                  edge="end"
                  size="small"
                  color="error"
                  onClick={(event) => handleDelete(event, building)}
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

export default BuildingsList;
