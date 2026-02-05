import { Button } from "@mui/material";

function UIPanels({
  selectedBuilding,
  selectedRoom,
  floorLabel,
  filterActive,
  filterDay,
  filterSlot,
  onOpenSchedule,
  onBackToFloor,
  onBackToBuilding,
  onBackToCampus,
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Selection
          </h3>
          <p className="mt-1 text-base font-semibold text-slate-900">
            {selectedBuilding?.name || "Campus overview"}
          </p>
          {floorLabel ? (
            <p className="text-sm text-slate-600">Floor: {floorLabel}</p>
          ) : null}
          {selectedRoom ? (
            <p className="text-sm text-slate-600">
              Room {selectedRoom.name || "?"} (Capacity{" "}
              {selectedRoom.capacity ?? "N/A"})
            </p>
          ) : null}
        </div>

        <div className="space-y-2 text-xs text-slate-500">
          <p>Click a building to focus and dim the campus.</p>
          <p>Click a floor to expand it, then click a room for details.</p>
          <p>Use the filter bar to preview availability.</p>
        </div>

        <div className="flex flex-col gap-2">
          {selectedRoom ? (
            <Button variant="contained" onClick={onOpenSchedule}>
              Open Room Schedule
            </Button>
          ) : null}
          {selectedRoom ? (
            <Button variant="outlined" onClick={onBackToFloor}>
              Back to Floor
            </Button>
          ) : null}
          {floorLabel ? (
            <Button variant="outlined" onClick={onBackToBuilding}>
              Back to Building
            </Button>
          ) : null}
          {selectedBuilding ? (
            <Button variant="outlined" onClick={onBackToCampus}>
              Back to Campus
            </Button>
          ) : null}
        </div>

        {filterActive ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-xs text-emerald-900">
            Filter active: {String(filterDay || "").toUpperCase()}{" "}
            {filterSlot === "full" ? "09-17" : filterSlot}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs text-slate-600">
            Default view: Rooms are red only if fully booked all week.
          </div>
        )}
      </div>
    </div>
  );
}

export default UIPanels;

