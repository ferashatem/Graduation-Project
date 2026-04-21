
import apiClient from "../../../api/apiClient";

export const getDepartmentById = async (departmentId) => {
  const res = await apiClient.get(`/Departments/${departmentId}`);
  return res.data?.data ?? res.data;
};

export const fetchDepartmentsByCollege = async (collegeId) => {
  const res = await apiClient.get(`/Departments/by-college/${collegeId}`);
  const payload = res.data?.data;
  return Array.isArray(payload) ? payload : (payload?.data ?? payload?.items ?? []);
};

export const createDepartment = async ({ name, code, collegeCode }) => {
  const res = await apiClient.post("/Departments", { name, code, collegeCode });
  return res.data?.data ?? res.data;
};

export const updateDepartment = async (departmentCode, { name, code, collegeCode }) => {
  const res = await apiClient.put(`/Departments/${departmentCode}`, { name, code, collegeCode });
  return res.data?.data ?? res.data;
};

export const deleteDepartment = async (departmentCode) => {
  await apiClient.delete(`/Departments/${departmentCode}`);
  return departmentCode;
};
