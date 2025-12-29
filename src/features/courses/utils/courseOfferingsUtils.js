const TERM_SEASONS = ["Spring", "Summer", "Fall"];

export const buildTermOptions = (startYear = new Date().getFullYear(), years = 2) => {
  const safeYears = Number.isFinite(Number(years)) ? Number(years) : 1;
  const options = [];

  for (let offset = 0; offset < safeYears; offset += 1) {
    const year = startYear + offset;
    TERM_SEASONS.forEach((season) => {
      options.push({
        id: `${year}-${season.toLowerCase()}`,
        label: `${season} ${year}`,
      });
    });
  }

  return options;
};

export const normalizeSectionCode = (value) =>
  String(value || "").trim().toUpperCase();
