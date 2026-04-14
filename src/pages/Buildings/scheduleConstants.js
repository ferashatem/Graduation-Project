export const DAY_OPTIONS = [
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
];

export const TIME_SLOTS = [
  { key: "09-11", label: "09:00-11:00", startTime: "09:00", endTime: "11:00" },
  { key: "11-13", label: "11:00-13:00", startTime: "11:00", endTime: "13:00" },
  { key: "13-15", label: "13:00-15:00", startTime: "13:00", endTime: "15:00" },
  { key: "15-17", label: "15:00-17:00", startTime: "15:00", endTime: "17:00" },
];

const DAY_LOOKUP = new Map(DAY_OPTIONS.map((day) => [day.key, day.label]));

export const getDayLabel = (dayKey) => DAY_LOOKUP.get(dayKey) || dayKey;

export const getDefaultDayKey = () => {
  const today = new Date().getDay();
  switch (today) {
    case 6:
      return "sat";
    case 0:
      return "sun";
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    default:
      return "sat";
  }
};

