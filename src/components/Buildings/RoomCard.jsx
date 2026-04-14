import { useCallback, useMemo } from "react";

function RoomCard({
  room,
  isFull,
  availableSlots,
  totalSlots,
  dayStatus,
  dayOptions,
  onOpen,
  onEdit,
  onDelete,
  canManage,
}) {
  const name = useMemo(() => room?.name || "Unnamed room", [room]);
  const capacity = useMemo(() => room?.capacity, [room]);
  const floor = useMemo(() => room?.floor || "", [room]);

  const statusLabel = useMemo(() => {
    if (typeof availableSlots === "number" && typeof totalSlots === "number") {
      return `${availableSlots}/${totalSlots} slots available`;
    }
    return "Slots: -";
  }, [availableSlots, totalSlots]);

  const dayStatusMap = useMemo(
    () => (dayStatus && typeof dayStatus === "object" ? dayStatus : {}),
    [dayStatus]
  );
  const orderedDays = useMemo(
    () => (Array.isArray(dayOptions) ? dayOptions : []),
    [dayOptions]
  );

  const handleOpen = useCallback(() => {
    if (onOpen) onOpen(room);
  }, [onOpen, room]);

  const handleEdit = useCallback(
    (event) => {
      event.stopPropagation();
      if (onEdit) onEdit(room);
    },
    [onEdit, room]
  );

  const handleDelete = useCallback(
    (event) => {
      event.stopPropagation();
      if (onDelete) onDelete(room);
    },
    [onDelete, room]
  );

  const cardClasses = useMemo(() => {
    if (isFull) {
      return "border-rose-200 bg-rose-50/70";
    }
    return "border-emerald-200 bg-emerald-50/70";
  }, [isFull]);

  const titleClasses = useMemo(() => {
    if (isFull) return "text-rose-800";
    return "text-emerald-900";
  }, [isFull]);

  return (
    <div
      onClick={handleOpen}
      className={`group flex cursor-pointer flex-col justify-between rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${cardClasses}`}
    >
      <div className="space-y-1">
        <h3 className={`text-lg font-semibold ${titleClasses}`}>{name}</h3>
        {capacity ? (
          <p className="text-sm text-slate-600">Capacity: {capacity}</p>
        ) : null}
        {floor ? <p className="text-sm text-slate-500">Floor: {floor}</p> : null}
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          {statusLabel}
        </p>

        <div className="pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Available days
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {orderedDays.map((day) => {
              const status = dayStatusMap[day.key] === "full" ? "full" : "available";
              const chipClasses =
                status === "full"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-green-200 bg-green-50 text-green-700";
              return (
                <span
                  key={day.key || day.label}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipClasses}`}
                >
                  {day.label || day}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {canManage ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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

export default RoomCard;
