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
