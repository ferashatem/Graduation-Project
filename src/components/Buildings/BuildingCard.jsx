import { useCallback, useMemo } from "react";

function BuildingCard({
  building,
  roomsCount,
  onOpen,
  onEdit,
  onDelete,
  canManage,
}) {
  const name = useMemo(() => building?.name || "Untitled building", [building]);
  const code = useMemo(() => building?.code || "", [building]);
  const countLabel = useMemo(() => {
    if (typeof roomsCount === "number") return `${roomsCount} rooms`;
    return "Rooms: —";
  }, [roomsCount]);

  const handleOpen = useCallback(() => {
    if (onOpen) onOpen(building);
  }, [building, onOpen]);

  const handleEdit = useCallback(
    (event) => {
      event.stopPropagation();
      if (onEdit) onEdit(building);
    },
    [building, onEdit]
  );

  const handleDelete = useCallback(
    (event) => {
      event.stopPropagation();
      if (onDelete) onDelete(building);
    },
    [building, onDelete]
  );

  return (
    <div
      onClick={handleOpen}
      className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-emerald-900">{name}</h3>
        {code ? (
          <p className="text-sm text-emerald-700">Code: {code}</p>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-emerald-800/70">
          {countLabel}
        </p>
      </div>

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
          >
            Delete
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default BuildingCard;

