import apiClient from "./apiClient";

// Bulk student upload — Excel (.xlsx only)
// Required columns: FullName, Email, UniversityStudentId, BatchCode, GroupCode
// May return 207 Multi-Status (partial success) — always check result.errors[]
export const bulkUploadStudents = async (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/students/bulk-upload-direct", form, {
    headers: { "Content-Type": "multipart/form-data" },
    // Accept 207 as a valid response (partial success)
    validateStatus: (status) => status === 200 || status === 207,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

  return {
    status: res.status,
    data: res.data?.data ?? res.data,
  };
};

// Bulk grades import — Excel (.xlsx)
export const bulkUploadGrades = async (offeringId, file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post(`/grades/import/${offeringId}`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    validateStatus: (status) => status === 200 || status === 207,
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });

  return {
    status: res.status,
    data: res.data?.data ?? res.data,
  };
};
