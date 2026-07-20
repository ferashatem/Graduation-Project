import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchYears = async (collegeId) => {
  if (!collegeId) return [];

  const res = await apiClient.get(`/academic-years/by-college/${collegeId}`);
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const fetchAllYears = async () => {
  const res = await apiClient.get("/academic-years");
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const getYearById = async (...args) => {
  const yearId = args[args.length - 1];
  if (!yearId) return null;

  const years = await fetchAllYears();
  return years.find((year) => String(year.id) === String(yearId)) || null;
};

export const createYear = async ({
  name,
  isActive = true,
  order,
  collegeId,
}) => {
  const res = await apiClient.post("/academic-years", {
    name,
    isActive,
    order: Number(order),
    collegeId,
  });
  return res.data?.data ?? res.data;
};

export const updateYear = async (yearId, { name, isActive = true, order }) => {
  const res = await apiClient.put(`/academic-years/${yearId}`, {
    name,
    isActive,
    order: Number(order),
  });
  return res.data?.data ?? res.data;
};

export const deleteYear = async (yearId) => {
  await apiClient.delete(`/academic-years/${yearId}`);
  return yearId;
};
