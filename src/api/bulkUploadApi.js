import apiClient from "./apiClient";

// Bulk student upload — Excel (.xlsx only)
// Required columns: StudentName, NationalId, Email, DepartmentCode, BatchCode, GroupCode
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
// Required columns: StudentId (UniversityStudentId), Midterm (≤20), Coursework (≤20), Final (≤50)
// Column headers are case-insensitive; "id"/"student" accepted for StudentId, "work"/"coursework" for Coursework
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

// POST /api/Students/import-excel — sync import (returns results immediately)
export const importStudentsExcel = async (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/students/import-excel", form, {
    headers: { "Content-Type": "multipart/form-data" },
    validateStatus: (status) => status === 200 || status === 207,
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return { status: res.status, data: res.data?.data ?? res.data };
};

// POST /api/Students/bulk-upload-ai — async AI-powered student import (202)
export const bulkUploadStudentsAI = async (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/students/bulk-upload-ai", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return res.data?.data ?? res.data;
};

// POST /api/Doctors/bulk-upload — async doctor import (202)
export const bulkUploadDoctors = async (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/doctors/bulk-upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
    },
  });

  return res.data?.data ?? res.data;
};
