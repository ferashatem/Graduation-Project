import apiClient from "./apiClient";

export const uploadStudentFile = async (file, onProgress) => {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post("/studentfiles/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data?.data ?? res.data;
};

// GET /api/StudentFiles/my — list student's own uploaded files
export const fetchMyStudentFiles = async () => {
  const res = await apiClient.get("/studentfiles/my");
  const payload = res.data?.data ?? res.data;
  return Array.isArray(payload) ? payload : payload?.items ?? [];
};
