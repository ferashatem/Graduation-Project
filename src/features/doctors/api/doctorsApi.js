import apiClient from "../../../api/apiClient";

const normalizePagedResult = (payload) => {
  if (Array.isArray(payload)) return { items: payload, total: payload.length, page: 1, totalPages: 1 };
  const items = payload?.data ?? payload?.Data ?? payload?.items ?? [];
  return {
    items: Array.isArray(items) ? items : [],
    total: payload?.totalCount ?? payload?.TotalCount ?? payload?.total ?? items.length,
    page: payload?.page ?? payload?.Page ?? 1,
    totalPages: payload?.totalPages ?? payload?.TotalPages ?? 1,
    hasNext: payload?.hasNext ?? payload?.HasNext ?? false,
    hasPrev: payload?.hasPrev ?? payload?.HasPrev ?? false,
  };
};

// GET /api/doctors?page=1&size=25
export const fetchAllDoctors = async ({ page = 1, size = 50 } = {}) => {
  const res = await apiClient.get("/doctors", { params: { page, size } });
  const payload = res.data?.data ?? res.data;
  return normalizePagedResult(payload);
};

// GET /api/doctors/filter — enriched DoctorDetailDto (DepartmentName, CollegeName included)
export const filterDoctors = async ({
  collegeId, departmentId, isActive, search, page = 1, size = 20,
} = {}) => {
  const params = { page, size };
  if (collegeId)    params.collegeId    = collegeId;
  if (departmentId) params.departmentId = departmentId;
  if (isActive !== undefined && isActive !== null) params.isActive = isActive;
  if (search?.trim()) params.search = search.trim();
  const res = await apiClient.get("/doctors/filter", { params });
  return normalizePagedResult(res.data?.data ?? res.data);
};

// PATCH /api/doctors/{id} — partial update, id is ULID
export const patchDoctor = async (id, dto) => {
  const res = await apiClient.patch(`/doctors/${id}`, dto);
  return res.data?.data ?? res.data;
};

// GET /api/doctors/search?q=...
export const searchDoctors = async (q) => {
  const res = await apiClient.get("/doctors/search", { params: { q } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/doctors/{code}
export const getDoctorByCode = async (code) => {
  const res = await apiClient.get(`/doctors/${code}`);
  return res.data?.data ?? res.data;
};

// DELETE /api/doctors/{code}
export const deleteDoctor = async (code) => {
  await apiClient.delete(`/doctors/${code}`);
  return code;
};
