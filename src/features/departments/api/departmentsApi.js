import apiClient from "../../../api/apiClient";

const normalizeCollection = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.data ?? payload?.items ?? [];
};

export const fetchAllDepartments = async ({ page = 1, pageSize = 100 } = {}) => {
  const res = await apiClient.get("/Departments", { params: { page, pageSize } });
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const getDepartmentById = async (...args) => {
  const departmentId = args[args.length - 1];
  if (!departmentId) return null;

  const departments = await fetchAllDepartments();
  return (
    departments.find(
      (department) =>
        String(department.id) === String(departmentId) ||
        String(department.code) === String(departmentId)
    ) || null
  );
};

export const fetchDepartmentsByCollege = async (collegeId) => {
  if (!collegeId) return fetchAllDepartments();

  const res = await apiClient.get(`/Departments/by-college/${collegeId}`);
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const fetchDepartmentsByYear = async (yearId) => {
  if (!yearId) return [];
  const res = await apiClient.get(`/academic-years/${yearId}/departments`);
  const payload = res.data?.data ?? res.data;
  return normalizeCollection(payload);
};

export const createDepartment = async ({ name, code, collegeId, academicYearId }) => {
  const body = { name, code, collegeId };
  if (academicYearId) body.academicYearId = academicYearId;
  const res = await apiClient.post("/Departments", body);
  return res.data?.data ?? res.data;
};

export const updateDepartment = async (departmentId, { name, code, collegeId }) => {
  const res = await apiClient.put(`/Departments/${departmentId}`, { name, code, collegeId });
  return res.data?.data ?? res.data;
};

export const deleteDepartment = async (departmentId) => {
  await apiClient.delete(`/Departments/${departmentId}`);
  return departmentId;
};
