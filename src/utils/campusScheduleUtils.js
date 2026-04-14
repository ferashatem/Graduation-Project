const DAY_OPTIONS = [
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
];

const DAY_OPTIONS_WITH_FRI = [...DAY_OPTIONS, { key: "fri", label: "Fri" }];

const SLOT_OPTIONS = [
  { key: "09-11", label: "09:00-11:00", start: "09:00", end: "11:00" },
  { key: "11-13", label: "11:00-13:00", start: "11:00", end: "13:00" },
  { key: "13-15", label: "13:00-15:00", start: "13:00", end: "15:00" },
  { key: "15-17", label: "15:00-17:00", start: "15:00", end: "17:00" },
];

const TIME_FILTERS = [
  { key: "full", label: "Full day (09-17)" },
  ...SLOT_OPTIONS.map((slot) => ({
    key: slot.key,
    label: slot.label,
  })),
];

export const CAMPUS_DAY_OPTIONS = DAY_OPTIONS;
export const CAMPUS_DAY_OPTIONS_WITH_FRI = DAY_OPTIONS_WITH_FRI;
export const CAMPUS_DAY_KEYS = DAY_OPTIONS.map((day) => day.key);
export const CAMPUS_DAY_KEYS_WITH_FRI = DAY_OPTIONS_WITH_FRI.map(
  (day) => day.key
);
export const CAMPUS_SLOT_OPTIONS = SLOT_OPTIONS;
export const CAMPUS_SLOT_KEYS = SLOT_OPTIONS.map((slot) => slot.key);
export const CAMPUS_TIME_FILTERS = TIME_FILTERS;

const normalizeDayKey = (value) =>
  String(value || "").trim().toLowerCase();

const normalizeSlotKey = (value) => String(value || "").trim();

const parseScheduleId = (id) => {
  const raw = String(id || "");
  if (!raw.includes("_")) return { dayKey: "", slotKey: "" };
  const [rawDay, ...rest] = raw.split("_");
  return {
    dayKey: normalizeDayKey(rawDay),
    slotKey: normalizeSlotKey(rest.join("_")),
  };
};

const padHour = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.length === 1 ? `0${raw}` : raw;
};

export const buildSlotKeyFromTimes = (start, end) => {
  const startHour = padHour(String(start || "").split(":")[0]);
  const endHour = padHour(String(end || "").split(":")[0]);
  if (!startHour || !endHour) return "";
  return `${startHour}-${endHour}`;
};

const extractDayKey = (doc) => {
  const direct =
    normalizeDayKey(doc?.day) ||
    normalizeDayKey(doc?.dayKey);
  if (direct) return direct;
  return parseScheduleId(doc?.id).dayKey;
};

const extractSlotKey = (doc) => {
  const direct = normalizeSlotKey(doc?.slotKey);
  if (direct) return direct;
  const fromTimes = buildSlotKeyFromTimes(
    doc?.start || doc?.startTime,
    doc?.end || doc?.endTime
  );
  if (fromTimes) return fromTimes;
  return parseScheduleId(doc?.id).slotKey;
};

const extractStatus = (doc) => {
  const status = String(doc?.status || "").trim().toLowerCase();
  if (status === "available") return "available";
  return "reserved";
};

export const normalizeScheduleDocs = (docs = [], options = {}) => {
  const dayKeys = options.dayKeys || CAMPUS_DAY_KEYS;
  const slotKeys = options.slotKeys || CAMPUS_SLOT_KEYS;
  const schedule = {};

  dayKeys.forEach((day) => {
    schedule[day] = {};
    slotKeys.forEach((slot) => {
      schedule[day][slot] = "available";
    });
  });

  docs.forEach((doc) => {
    const dayKey = extractDayKey(doc);
    const slotKey = extractSlotKey(doc);
    if (!dayKey || !slotKey) return;
    if (!schedule[dayKey]) schedule[dayKey] = {};
    schedule[dayKey][slotKey] = extractStatus(doc);
  });

  return schedule;
};

export const computeDayIsFull = (daySlots, slotKeys = CAMPUS_SLOT_KEYS) => {
  if (!daySlots) return false;
  return slotKeys.every((slotKey) => daySlots[slotKey] === "reserved");
};

export const computeDayFullMap = (
  schedule,
  dayKeys = CAMPUS_DAY_KEYS,
  slotKeys = CAMPUS_SLOT_KEYS
) => {
  const map = {};
  dayKeys.forEach((day) => {
    map[day] = computeDayIsFull(schedule?.[day], slotKeys);
  });
  return map;
};

export const computeRoomIsFullWeek = (
  schedule,
  dayKeys = CAMPUS_DAY_KEYS,
  slotKeys = CAMPUS_SLOT_KEYS
) => {
  if (!schedule) return false;
  return dayKeys.every((day) => computeDayIsFull(schedule?.[day], slotKeys));
};

export const computeRoomStatusForFilter = (
  schedule,
  dayKey,
  slotOrFullDay,
  slotKeys = CAMPUS_SLOT_KEYS
) => {
  if (!schedule || !dayKey) return false;
  if (!slotOrFullDay || slotOrFullDay === "full") {
    return computeDayIsFull(schedule?.[dayKey], slotKeys);
  }
  return schedule?.[dayKey]?.[slotOrFullDay] === "reserved";
};
