import apiClient from "./apiClient";

// POST /api/auth/register/student
export const registerStudent = async ({
  fullName, email, collegeCode, departmentCode, nationalId,
  batchCode, groupCode, phone, universityStudentId,
}) => {
  const res = await apiClient.post("/auth/register/student", {
    fullName,
    email,
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

// POST /api/auth/change-password
export const changePassword = async ({ currentPassword, newPassword }) => {
  const res = await apiClient.post("/auth/change-password", { currentPassword, newPassword });
  return res.data?.data ?? res.data;
};

// POST /api/auth/admin/reset-password/{userId}  (Admin only)
export const adminResetPassword = async (userId) => {
  const res = await apiClient.post(`/auth/admin/reset-password/${userId}`);
  return res.data?.data ?? res.data;
};
