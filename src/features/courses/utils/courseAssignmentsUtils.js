const normalizeValue = (value) => String(value || "").trim();

export const normalizeTermId = (termId) => normalizeValue(termId);

export const normalizeYearLevel = (yearLevel) => normalizeValue(yearLevel);

export const normalizeSection = (section) =>
  normalizeValue(section).toUpperCase();

export const buildOfferingId = ({ courseId, termId, yearLevel, section }) => {
  const trimmedCourseId = normalizeValue(courseId);
  const trimmedTermId = normalizeValue(termId);
  const trimmedYearLevel = normalizeValue(yearLevel);
  const trimmedSection = normalizeValue(section);

  if (!trimmedCourseId || !trimmedTermId || !trimmedYearLevel || !trimmedSection) {
    return "";
  }

  return `${trimmedCourseId}__${trimmedTermId}__Y${trimmedYearLevel}__S${trimmedSection}`;
};
