import apiClient from "../../../api/apiClient";

// Normalize PagedResult<T> → { items, total, page, totalPages, hasNext, hasPrev }
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

// GET /api/students?page=1&size=25
export const fetchAllStudents = async ({ page = 1, size = 50 } = {}) => {
  const res = await apiClient.get("/students", { params: { page, size } });
  const payload = res.data?.data ?? res.data;
  return normalizePagedResult(payload);
};

// GET /api/students/filter — enriched StudentDetailDto (CollegeName, DepartmentName, BatchName, GroupName included)
// All params optional and composable
export const filterStudents = async ({
  universityId, collegeId, departmentId, batchId, groupId,
  isActive, search, page = 1, size = 20,
} = {}) => {
  const params = { page, size };
  if (universityId) params.universityId = universityId;
  if (collegeId)    params.collegeId    = collegeId;
  if (departmentId) params.departmentId = departmentId;
  if (batchId)      params.batchId      = batchId;
  if (groupId)      params.groupId      = groupId;
  if (isActive !== undefined && isActive !== null) params.isActive = isActive;
  if (search?.trim()) params.search = search.trim();
  const res = await apiClient.get("/students/filter", { params });
  return normalizePagedResult(res.data?.data ?? res.data);
};

// PATCH /api/students/{id} — partial update, id is ULID
export const patchStudent = async (id, dto) => {
  const res = await apiClient.patch(`/students/${id}`, dto);
  return res.data?.data ?? res.data;
};

// GET /api/students/search?q=...
export const searchStudents = async (q) => {
  const res = await apiClient.get("/students/search", { params: { q } });
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : [];
};

// GET /api/students/{code}
export const getStudentByCode = async (code) => {
  const res = await apiClient.get(`/students/${code}`);
  return res.data?.data ?? res.data;
};

// GET /api/students/struggling
export const fetchStrugglingStudents = async ({ threshold = 2.0, departmentId, batchId, page = 1, size = 20 } = {}) => {
  const params = { threshold, page, size };
  if (departmentId) params.departmentId = departmentId;
  if (batchId)      params.batchId      = batchId;
  const res = await apiClient.get("/students/struggling", { params });
  return normalizePagedResult(res.data?.data ?? res.data);
};
