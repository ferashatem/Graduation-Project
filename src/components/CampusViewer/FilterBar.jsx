import { useMemo } from "react";
import { Button } from "@mui/material";

function FilterBar({
  dayOptions,
  timeOptions,
  dayValue,
  timeValue,
  onDayChange,
  onTimeChange,
  onClear,
}) {
  const isActive = useMemo(() => Boolean(dayValue), [dayValue]);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Availability filter</h2>
          <p className="text-sm text-slate-500">
            {isActive
              ? "Rooms are colored based on the selected day and time."
              : "No filter applied. Rooms are red only if fully booked all week."}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm sm:w-40"
            value={dayValue}
            onChange={(event) => onDayChange(event.target.value)}
          >
            <option value="">Select day</option>
            {dayOptions.map((day) => (
              <option key={day.key} value={day.key}>
                {day.label}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm sm:w-52"
            value={timeValue}
            onChange={(event) => onTimeChange(event.target.value)}
            disabled={!dayValue}
          >
            {timeOptions.map((slot) => (
              <option key={slot.key} value={slot.key}>
                {slot.label}
              </option>
            ))}
          </select>
          <Button variant="outlined" onClick={onClear} disabled={!isActive}>
            Clear Filter
          </Button>
        </div>
      </div>
    </div>
  );
}

export default FilterBar;

