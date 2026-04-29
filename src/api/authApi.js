import apiClient from "./apiClient";

// POST /api/auth/register/student
export const registerStudent = async ({
  fullName, collegeCode, departmentCode, nationalId,
  batchCode, groupCode, phone, universityStudentId,
}) => {
  const res = await apiClient.post("/auth/register/student", {
    fullName,
    collegeCode,
    departmentCode,
    nationalId,
    batchCode,
    groupCode,
    phone,
    ...(universityStudentId ? { universityStudentId } : {}),
  });
  return res.data?.data ?? res.data;
};

// POST /api/auth/register/doctor
export const registerDoctor = async ({
  fullName, departmentCode, nationalId, phone, universityStaffId,
}) => {
  const res = await apiClient.post("/auth/register/doctor", {
    fullName,
    departmentCode,
    nationalId,
    phone,
    ...(universityStaffId ? { universityStaffId } : {}),
  });
  return res.data?.data ?? res.data;
};

// POST /api/auth/register/admin  (SuperAdmin only)
export const registerAdmin = async ({ fullName, phone, nationalId }) => {
  const res = await apiClient.post("/auth/register/admin", { fullName, phone, nationalId });
  return res.data?.data ?? res.data;
};
